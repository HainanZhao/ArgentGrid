import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import {
  ArgentGridComponent,
  ArgentGridModule,
  type ICellRendererAngularComp,
  type ICellRendererParams,
  themeQuartz,
} from '../public-api';

interface Employee {
  id: number;
  name: string;
  department: string;
  status: 'Active' | 'On Leave' | 'Remote' | 'Travel';
  rating: number;
  salary: number;
}

/**
 * A genuinely interactive DOM cell renderer: a coloured status pill plus a
 * clickable button. Proves real DOM events fire over the canvas, and that a
 * pooled instance rebinds correctly on scroll (via `refresh`).
 */
@Component({
  selector: 'demo-status-pill',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="pill" [style.background]="color" [style.color]="textColor">{{ label }}</span>
    <button class="act" type="button" (click)="onView()">View</button>
  `,
  styles: [
    `
      :host {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 0 10px;
        width: 100%;
        height: 100%;
        font: 12px/1 system-ui, sans-serif;
      }
      .pill {
        padding: 3px 8px;
        border-radius: 10px;
        font-weight: 600;
        white-space: nowrap;
      }
      .act {
        margin-left: auto;
        border: 1px solid #c3c9d4;
        background: #fff;
        border-radius: 4px;
        padding: 3px 8px;
        cursor: pointer;
      }
      .act:hover {
        background: #eef2ff;
        border-color: #6366f1;
      }
    `,
  ],
})
export class StatusPillRenderer implements ICellRendererAngularComp<Employee> {
  label = '';
  color = '#e5e7eb';
  textColor = '#111';
  private params!: ICellRendererParams<Employee>;

  agInit(params: ICellRendererParams<Employee>): void {
    this.update(params);
  }

  // Returning true keeps the pooled instance alive and just rebinds it.
  refresh(params: ICellRendererParams<Employee>): boolean {
    this.update(params);
    return true;
  }

  onView(): void {
    const name = this.params.data?.name ?? 'row';
    window.alert(`${name} is "${this.label}"`);
  }

  private update(params: ICellRendererParams<Employee>): void {
    this.params = params;
    this.label = String(params.value ?? '');
    const palette: Record<string, [string, string]> = {
      Active: ['#dcfce7', '#166534'],
      'On Leave': ['#fef9c3', '#854d0e'],
      Remote: ['#dbeafe', '#1e40af'],
      Travel: ['#fae8ff', '#86198f'],
    };
    const [bg, fg] = palette[this.label] ?? ['#e5e7eb', '#111'];
    this.color = bg;
    this.textColor = fg;
  }
}

/**
 * Interactive star rating renderer — clicking a star mutates the row data and
 * applies a transaction, exercising the grid API from inside an overlay cell.
 */
@Component({
  selector: 'demo-rating',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      *ngFor="let star of stars; let i = index"
      class="star"
      [class.on]="i < value"
      (click)="setRating(i + 1)"
      >★</span
    >
  `,
  styles: [
    `
      :host {
        display: flex;
        align-items: center;
        height: 100%;
        padding: 0 8px;
      }
      .star {
        cursor: pointer;
        color: #d1d5db;
        font-size: 16px;
        line-height: 1;
      }
      .star.on {
        color: #f59e0b;
      }
    `,
  ],
})
export class RatingRenderer implements ICellRendererAngularComp<Employee> {
  readonly stars = [0, 1, 2, 3, 4];
  value = 0;
  private params!: ICellRendererParams<Employee>;

  agInit(params: ICellRendererParams<Employee>): void {
    this.update(params);
  }

  refresh(params: ICellRendererParams<Employee>): boolean {
    this.update(params);
    return true;
  }

  setRating(n: number): void {
    if (!this.params.data) return;
    this.value = n;
    this.params.data.rating = n;
    this.params.api.applyTransaction({ update: [this.params.data] });
  }

  private update(params: ICellRendererParams<Employee>): void {
    this.params = params;
    this.value = Number(params.value ?? 0);
  }
}

function makeData(count: number): Employee[] {
  const depts = ['Engineering', 'Sales', 'Marketing', 'HR', 'Finance'];
  const statuses: Employee['status'][] = ['Active', 'On Leave', 'Remote', 'Travel'];
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `Employee ${i + 1}`,
    department: depts[i % depts.length],
    status: statuses[(i * 3) % statuses.length],
    rating: 1 + ((i * 2) % 5),
    salary: 50000 + i * 750,
  }));
}

const meta: Meta<ArgentGridComponent<Employee>> = {
  title: 'Features/CustomComponents',
  component: ArgentGridComponent,
  decorators: [
    moduleMetadata({
      imports: [ArgentGridModule, BrowserModule, StatusPillRenderer, RatingRenderer],
    }),
  ],
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj<ArgentGridComponent<Employee>>;

/**
 * Angular component cell renderers (status pill + star rating) composited over
 * the canvas. Scroll to confirm the DOM cells recycle and stay aligned with the
 * canvas-drawn columns; click "View" and the stars to confirm interactivity.
 */
export const AngularComponentRenderers: Story = {
  args: {
    columnDefs: [
      { field: 'id', headerName: 'ID', width: 80, pinned: 'left' },
      { field: 'name', headerName: 'Name', width: 160 },
      { field: 'department', headerName: 'Department', width: 160 },
      {
        field: 'status',
        headerName: 'Status',
        width: 200,
        cellRenderer: StatusPillRenderer,
      },
      {
        field: 'rating',
        headerName: 'Rating',
        width: 140,
        cellRenderer: RatingRenderer,
      },
      {
        field: 'salary',
        headerName: 'Salary',
        width: 130,
        valueFormatter: (p: any) => `$${Number(p.value).toLocaleString()}`,
      },
    ],
    rowData: makeData(200),
    height: 'calc(100vh - 20px)',
    width: '100%',
    rowHeight: 40,
    theme: themeQuartz,
  },
};
