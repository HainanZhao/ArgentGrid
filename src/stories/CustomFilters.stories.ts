import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import {
  ArgentGridComponent,
  ArgentGridModule,
  type GridOptions,
  type IDoesFilterPassParams,
  type IFilterAngularComp,
  type IFilterParams,
  themeQuartz,
} from '../public-api';

interface Employee {
  id: number;
  name: string;
  department: string;
  salary: number;
}

/**
 * A custom number-range filter (`colDef.filter` = this component). It owns its
 * own UI (min/max inputs), reports activity via `isFilterActive`, decides each
 * row in `doesFilterPass`, and round-trips its state through `getModel`/`setModel`
 * (so the grid can persist/restore it). Calling `params.filterChangedCallback()`
 * tells the grid to re-run filtering. The instance is kept alive across popup
 * opens, so the min/max you typed are still there when you reopen it.
 */
@Component({
  selector: 'demo-range-filter',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="range-filter">
      <label>Min <input type="number" [value]="min ?? ''" (input)="onMin($event)" /></label>
      <label>Max <input type="number" [value]="max ?? ''" (input)="onMax($event)" /></label>
      <button type="button" (click)="clear()">Clear</button>
    </div>
  `,
  styles: [
    `
      .range-filter {
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding: 12px;
        min-width: 180px;
        font: 12px/1.4 system-ui, sans-serif;
      }
      label {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 8px;
        font-weight: 600;
      }
      input {
        width: 90px;
        padding: 3px 6px;
        border: 1px solid #c3c9d4;
        border-radius: 4px;
      }
      button {
        align-self: flex-end;
        border: 1px solid #c3c9d4;
        background: #fff;
        border-radius: 4px;
        padding: 3px 10px;
        cursor: pointer;
      }
      button:hover {
        background: #eef2ff;
        border-color: #6366f1;
      }
    `,
  ],
})
export class RangeFilter implements IFilterAngularComp<Employee> {
  private params!: IFilterParams<Employee>;
  min: number | null = null;
  max: number | null = null;

  agInit(params: IFilterParams<Employee>): void {
    this.params = params;
  }

  isFilterActive(): boolean {
    return this.min !== null || this.max !== null;
  }

  doesFilterPass(params: IDoesFilterPassParams<Employee>): boolean {
    const value = Number(this.params.getValue(params.node));
    if (this.min !== null && value < this.min) return false;
    if (this.max !== null && value > this.max) return false;
    return true;
  }

  getModel(): { min: number | null; max: number | null } | null {
    return this.isFilterActive() ? { min: this.min, max: this.max } : null;
  }

  setModel(model: { min: number | null; max: number | null } | null): void {
    this.min = model?.min ?? null;
    this.max = model?.max ?? null;
  }

  onMin(e: Event): void {
    const v = (e.target as HTMLInputElement).value;
    this.min = v === '' ? null : Number(v);
    this.params.filterChangedCallback();
  }

  onMax(e: Event): void {
    const v = (e.target as HTMLInputElement).value;
    this.max = v === '' ? null : Number(v);
    this.params.filterChangedCallback();
  }

  clear(): void {
    this.min = null;
    this.max = null;
    this.params.filterChangedCallback();
  }
}

function makeData(count: number): Employee[] {
  const depts = ['Engineering', 'Sales', 'Marketing', 'HR', 'Finance'];
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `Employee ${i + 1}`,
    department: depts[i % depts.length],
    salary: 50000 + ((i * 1337) % 90000),
  }));
}

const meta: Meta<ArgentGridComponent<Employee>> = {
  title: 'Features/CustomFilters',
  component: ArgentGridComponent,
  decorators: [
    moduleMetadata({
      imports: [ArgentGridModule, BrowserModule, RangeFilter],
    }),
  ],
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj<ArgentGridComponent<Employee>>;

/**
 * `filter` as a **component class** on Salary. Click the funnel, set a min/max,
 * and rows filter live; reopen the popup and your values persist. The built-in
 * text filter on Name still works alongside it.
 */
export const ComponentClass: Story = {
  args: {
    columnDefs: [
      { field: 'id', headerName: 'ID', width: 80, pinned: 'left' },
      { field: 'name', headerName: 'Name', width: 200, filter: 'text' },
      { field: 'department', headerName: 'Department', width: 180, filter: 'set' },
      { field: 'salary', headerName: 'Salary', width: 160, filter: RangeFilter },
    ],
    rowData: makeData(300),
    height: 'calc(100vh - 20px)',
    width: '100%',
    rowHeight: 36,
    theme: themeQuartz,
  },
};

/**
 * The same filter resolved by **registered name** via `gridOptions.components`
 * (`filter: 'rangeFilter'`), with `filterParams` available on `IFilterParams`.
 */
export const RegisteredByName: Story = {
  args: {
    gridOptions: {
      components: { rangeFilter: RangeFilter },
    } as GridOptions<Employee>,
    columnDefs: [
      { field: 'id', headerName: 'ID', width: 80, pinned: 'left' },
      { field: 'name', headerName: 'Name', width: 220, filter: 'text' },
      {
        field: 'salary',
        headerName: 'Salary',
        width: 160,
        filter: 'rangeFilter',
        filterParams: { label: 'Salary range' },
      },
    ],
    rowData: makeData(300),
    height: 'calc(100vh - 20px)',
    width: '100%',
    rowHeight: 36,
    theme: themeQuartz,
  },
};
