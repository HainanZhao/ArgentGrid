import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import {
  ArgentGridComponent,
  ArgentGridModule,
  type GridOptions,
  type IHeaderAngularComp,
  type IHeaderParams,
  themeQuartz,
} from '../public-api';

interface Employee {
  id: number;
  name: string;
  department: string;
  rating: number;
  salary: number;
}

/**
 * A custom header component (`colDef.headerComponent`). It owns its own label,
 * a sort toggle (driving `params.progressSort`), a live sort arrow read from the
 * live `params.column.sort` (kept current via `refresh`), and a filter button
 * that opens the built-in filter via `params.showFilter`. Because the column has
 * a custom header, the grid disables its default sort-on-click — exactly like
 * AG Grid.
 */
@Component({
  selector: 'demo-emoji-header',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="icon">{{ icon }}</span>
    <button class="label" type="button" (click)="toggleSort($event)">
      {{ label }}<span class="arrow">{{ arrow }}</span>
    </button>
    <button
      *ngIf="params?.enableFilterButton"
      class="filter"
      type="button"
      title="Filter"
      (click)="openFilter($event)"
    >
      ⚲
    </button>
  `,
  styles: [
    `
      :host {
        display: flex;
        align-items: center;
        gap: 6px;
        width: 100%;
        height: 100%;
        font: 12px/1 system-ui, sans-serif;
      }
      .icon {
        font-size: 14px;
      }
      .label {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 4px;
        border: none;
        background: transparent;
        font: inherit;
        font-weight: 700;
        color: inherit;
        cursor: pointer;
        padding: 0;
        text-align: left;
      }
      .label:hover {
        color: #6366f1;
      }
      .arrow {
        color: #6366f1;
        font-size: 11px;
      }
      .filter {
        border: 1px solid #c3c9d4;
        background: #fff;
        border-radius: 4px;
        cursor: pointer;
        line-height: 1;
        padding: 2px 5px;
      }
      .filter:hover {
        background: #eef2ff;
        border-color: #6366f1;
      }
    `,
  ],
})
export class EmojiHeader implements IHeaderAngularComp {
  params?: IHeaderParams;
  label = '';
  icon = '🏷️';

  agInit(params: IHeaderParams): void {
    this.params = params;
    this.label = params.displayName;
    this.icon = (params.icon as string) ?? '🏷️';
  }

  // Pooled? No — header components are not recycled, but the grid still calls
  // refresh when sort/filter state changes so the arrow stays in sync.
  refresh(params: IHeaderParams): void {
    this.params = params;
  }

  get arrow(): string {
    const sort = this.params?.column?.sort;
    return sort === 'asc' ? ' ▲' : sort === 'desc' ? ' ▼' : '';
  }

  toggleSort(event: MouseEvent): void {
    this.params?.progressSort(event.shiftKey);
  }

  openFilter(event: MouseEvent): void {
    this.params?.showFilter(event.currentTarget as HTMLElement);
  }
}

function makeData(count: number): Employee[] {
  const depts = ['Engineering', 'Sales', 'Marketing', 'HR', 'Finance'];
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `Employee ${i + 1}`,
    department: depts[i % depts.length],
    rating: 1 + ((i * 2) % 5),
    salary: 50000 + i * 750,
  }));
}

const meta: Meta<ArgentGridComponent<Employee>> = {
  title: 'Features/HeaderComponents',
  component: ArgentGridComponent,
  decorators: [
    moduleMetadata({
      imports: [ArgentGridModule, BrowserModule, EmojiHeader],
    }),
  ],
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj<ArgentGridComponent<Employee>>;

/**
 * `headerComponent` as a **component class**, with per-column `headerComponentParams`
 * (the emoji icon). Click a custom header to sort (Shift-click for multi-sort);
 * the arrow tracks the live sort. The plain `id` column keeps the built-in header.
 */
export const ComponentClass: Story = {
  args: {
    columnDefs: [
      { field: 'id', headerName: 'ID', width: 80, pinned: 'left' },
      {
        field: 'name',
        headerName: 'Name',
        width: 200,
        sortable: true,
        filter: true,
        headerComponent: EmojiHeader,
        headerComponentParams: { icon: '🧑' },
      },
      {
        field: 'department',
        headerName: 'Department',
        width: 200,
        sortable: true,
        filter: true,
        headerComponent: EmojiHeader,
        headerComponentParams: { icon: '🏢' },
      },
      {
        field: 'salary',
        headerName: 'Salary',
        width: 160,
        sortable: true,
        headerComponent: EmojiHeader,
        headerComponentParams: { icon: '💰' },
      },
    ],
    rowData: makeData(200),
    height: 'calc(100vh - 20px)',
    width: '100%',
    rowHeight: 36,
    theme: themeQuartz,
  },
};

/**
 * The same header resolved by **registered name** through a per-grid
 * `gridOptions.components` map (`headerComponent: 'emojiHeader'`) — the
 * AG-Grid-style indirection that decouples the column config from the component.
 */
export const RegisteredByName: Story = {
  args: {
    gridOptions: {
      components: { emojiHeader: EmojiHeader },
    } as GridOptions<Employee>,
    columnDefs: [
      { field: 'id', headerName: 'ID', width: 80, pinned: 'left' },
      {
        field: 'name',
        headerName: 'Name',
        width: 220,
        sortable: true,
        headerComponent: 'emojiHeader',
        headerComponentParams: { icon: '🧑' },
      },
      {
        field: 'rating',
        headerName: 'Rating',
        width: 160,
        sortable: true,
        headerComponent: 'emojiHeader',
        headerComponentParams: { icon: '⭐' },
      },
      {
        field: 'salary',
        headerName: 'Salary',
        width: 160,
        sortable: true,
        headerComponent: 'emojiHeader',
        headerComponentParams: { icon: '💰' },
      },
    ],
    rowData: makeData(200),
    height: 'calc(100vh - 20px)',
    width: '100%',
    rowHeight: 36,
    theme: themeQuartz,
  },
};
