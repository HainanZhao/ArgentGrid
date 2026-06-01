import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import {
  ArgentGridComponent,
  ArgentGridModule,
  type ColDef,
  type GridOptions,
  type ICellRendererAngularComp,
  type ICellRendererParams,
  type IDetailCellRendererAngularComp,
  type IDetailCellRendererParams,
  registerCellRenderer,
  themeQuartz,
} from '../public-api';

// ---------------------------------------------------------------------------
// Domain: a customer (master) with its orders (detail)
// ---------------------------------------------------------------------------

interface Order {
  id: string;
  product: string;
  qty: number;
  total: number;
}

interface Customer {
  id: number;
  name: string;
  region: string;
  orderCount: number;
}

const PRODUCTS = ['Widget', 'Gadget', 'Sprocket', 'Cog', 'Flange', 'Bracket'];

/** Deterministic orders for a customer, derived from its id (stable across rebinds). */
function ordersFor(customer: Customer): Order[] {
  return Array.from({ length: customer.orderCount }, (_, i) => {
    const qty = ((customer.id + i) % 5) + 1;
    const unit = 20 + ((customer.id * 7 + i * 13) % 80);
    return {
      id: `${customer.id}-${i + 1}`,
      product: PRODUCTS[(customer.id + i) % PRODUCTS.length],
      qty,
      total: qty * unit,
    };
  });
}

function makeCustomers(count: number): Customer[] {
  const regions = ['North', 'South', 'East', 'West', 'Central'];
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `Customer ${i + 1}`,
    region: regions[i % regions.length],
    orderCount: 2 + (i % 5),
  }));
}

// ---------------------------------------------------------------------------
// First-column expand toggle (discoverable affordance; toggles via the API)
// ---------------------------------------------------------------------------

@Component({
  selector: 'demo-expand-toggle',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<button *ngIf="isMaster" class="tg" type="button" (click)="toggle()">{{
    expanded ? '▾' : '▸'
  }}</button>`,
  imports: [CommonModule],
  styles: [
    `
      :host {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
      }
      .tg {
        border: none;
        background: transparent;
        cursor: pointer;
        font-size: 13px;
        color: #475569;
        padding: 2px 6px;
      }
      .tg:hover {
        color: #1e40af;
      }
    `,
  ],
})
export class ExpandToggleRenderer implements ICellRendererAngularComp<Customer> {
  isMaster = false;
  expanded = false;
  private params!: ICellRendererParams<Customer>;
  private cdr = inject(ChangeDetectorRef);

  agInit(params: ICellRendererParams<Customer>): void {
    this.update(params);
  }

  refresh(params: ICellRendererParams<Customer>): boolean {
    this.update(params);
    return true;
  }

  toggle(): void {
    this.params.api.setRowNodeExpanded(this.params.node, !this.params.node.expanded);
  }

  private update(params: ICellRendererParams<Customer>): void {
    this.params = params;
    this.isMaster = !!params.node.master;
    this.expanded = !!params.node.expanded;
    this.cdr.markForCheck();
  }
}

// ---------------------------------------------------------------------------
// Flagship detail: a real nested ArgentGrid of the master's orders
// ---------------------------------------------------------------------------

@Component({
  selector: 'demo-detail-grid',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ArgentGridModule],
  template: `
    <div class="wrap">
      <div class="hdr">Orders for {{ customer?.name }} ({{ orders.length }})</div>
      <argent-grid [columnDefs]="cols" [rowData]="orders" height="180px" width="100%"></argent-grid>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
        height: 100%;
        /* Opaque background so the canvas detail backdrop never shows through. */
        background: #ffffff;
        box-sizing: border-box;
        padding: 8px 12px;
        border-bottom: 1px solid #e2e8f0;
      }
      .hdr {
        font: 600 12px/1.6 system-ui, sans-serif;
        color: #334155;
        margin-bottom: 4px;
      }
    `,
  ],
})
export class DetailGridRenderer implements IDetailCellRendererAngularComp<Customer> {
  customer: Customer | undefined;
  orders: Order[] = [];
  readonly cols: ColDef<Order>[] = [
    { field: 'id', headerName: 'Order #', width: 110 },
    { field: 'product', headerName: 'Product', width: 140 },
    { field: 'qty', headerName: 'Qty', width: 80 },
    {
      field: 'total',
      headerName: 'Total',
      width: 120,
      valueFormatter: (p: any) => `$${Number(p.value).toLocaleString()}`,
    },
  ];
  private cdr = inject(ChangeDetectorRef);

  agInit(params: IDetailCellRendererParams<Customer>): void {
    this.update(params);
  }

  // Pooled instances are reused across masters — re-key the data on refresh.
  refresh(params: IDetailCellRendererParams<Customer>): boolean {
    this.update(params);
    return true;
  }

  private update(params: IDetailCellRendererParams<Customer>): void {
    this.customer = params.data;
    this.orders = params.data ? ordersFor(params.data) : [];
    this.cdr.markForCheck();
  }
}

// ---------------------------------------------------------------------------
// Secondary detail: a simple custom panel, resolved by registered NAME
// ---------------------------------------------------------------------------

@Component({
  selector: 'demo-detail-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="title">{{ heading }}: {{ customer?.name }}</div>
    <ul class="facts">
      <li>Region: {{ customer?.region }}</li>
      <li>Orders on file: {{ customer?.orderCount }}</li>
      <li>Lifetime value: {{ ltv | currency }}</li>
    </ul>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
        height: 100%;
        background: #f8fafc;
        box-sizing: border-box;
        padding: 12px 16px;
        border-bottom: 1px solid #e2e8f0;
        font: 13px/1.5 system-ui, sans-serif;
        color: #334155;
      }
      .title {
        font-weight: 600;
        margin-bottom: 6px;
      }
      .facts {
        margin: 0;
        padding-left: 18px;
      }
    `,
  ],
})
export class DemoDetailPanel implements IDetailCellRendererAngularComp<Customer> {
  customer: Customer | undefined;
  heading = 'Customer';
  ltv = 0;
  private cdr = inject(ChangeDetectorRef);

  agInit(params: IDetailCellRendererParams<Customer>): void {
    this.update(params);
  }

  refresh(params: IDetailCellRendererParams<Customer>): boolean {
    this.update(params);
    return true;
  }

  private update(params: IDetailCellRendererParams<Customer>): void {
    this.customer = params.data;
    // `detailCellRendererParams` is spread onto the params object.
    this.heading = (params as any).heading ?? 'Customer';
    this.ltv = params.data ? ordersFor(params.data).reduce((sum, o) => sum + o.total, 0) : 0;
    this.cdr.markForCheck();
  }
}

// Register the panel under a name so a column can reference it as a string,
// exercising the named-renderer resolution path for detailCellRenderer.
registerCellRenderer('customerPanel', DemoDetailPanel);

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

const baseColumns: ColDef<Customer>[] = [
  { field: 'id', headerName: '', width: 50, pinned: 'left', cellRenderer: ExpandToggleRenderer },
  { field: 'name', headerName: 'Customer', width: 200 },
  { field: 'region', headerName: 'Region', width: 140 },
  { field: 'orderCount', headerName: 'Orders', width: 120 },
];

const meta: Meta<ArgentGridComponent<Customer>> = {
  title: 'Features/MasterDetail',
  component: ArgentGridComponent,
  decorators: [
    moduleMetadata({
      imports: [
        ArgentGridModule,
        BrowserModule,
        ExpandToggleRenderer,
        DetailGridRenderer,
        DemoDetailPanel,
      ],
    }),
  ],
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj<ArgentGridComponent<Customer>>;

/**
 * Flagship: each expanded master row hosts a **real nested `<argent-grid>`** of
 * that customer's orders, composited full-width over the canvas via the DOM
 * overlay. Click the ▸ toggle in the first column to expand a row. Scroll the
 * outer grid — the detail host recycles and re-binds; scroll inside a detail
 * grid — it owns its own pointer/scroll events.
 */
export const NestedGrid: Story = {
  args: {
    columnDefs: baseColumns,
    rowData: makeCustomers(50),
    gridOptions: {
      masterDetail: true,
      isRowMaster: (c: Customer) => c.orderCount > 0,
      detailRowHeight: 240,
      detailCellRenderer: DetailGridRenderer,
    } as GridOptions<Customer>,
    height: 'calc(100vh - 20px)',
    width: '100%',
    rowHeight: 40,
    theme: themeQuartz,
  },
};

/**
 * The same master/detail wiring, but the detail is a lightweight custom panel
 * resolved by **registered name** (`detailCellRenderer: 'customerPanel'`), and
 * `detailCellRendererParams` is spread onto the component's params (here a
 * custom `heading`).
 */
export const CustomPanelByName: Story = {
  args: {
    columnDefs: baseColumns,
    rowData: makeCustomers(50),
    gridOptions: {
      masterDetail: true,
      isRowMaster: (c: Customer) => c.orderCount > 0,
      detailRowHeight: 150,
      detailCellRenderer: 'customerPanel',
      detailCellRendererParams: { heading: 'Account' },
    } as GridOptions<Customer>,
    height: 'calc(100vh - 20px)',
    width: '100%',
    rowHeight: 40,
    theme: themeQuartz,
  },
};
