import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, ViewChild } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import {
  ArgentGridComponent,
  ArgentGridModule,
  type ICellEditorAngularComp,
  type ICellEditorParams,
  registerCellRenderer,
  themeQuartz,
} from '../public-api';

interface Task {
  id: number;
  title: string;
  status: 'Todo' | 'In Progress' | 'Blocked' | 'Done';
  priority: number;
}

const STATUSES: Task['status'][] = ['Todo', 'In Progress', 'Blocked', 'Done'];

// ---------------------------------------------------------------------------
// A <select> dropdown editor (the canonical custom cell editor)
// ---------------------------------------------------------------------------

@Component({
  selector: 'demo-select-editor',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <select
      #sel
      class="ed"
      [value]="value"
      (change)="onChange($event)"
      (keydown.enter)="commit()"
    >
      <option *ngFor="let opt of options" [value]="opt">{{ opt }}</option>
    </select>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
        height: 100%;
      }
      .ed {
        width: 100%;
        height: 100%;
        border: 1px solid #6366f1;
        box-sizing: border-box;
        padding: 0 6px;
        font: 13px system-ui, sans-serif;
        background: #fff;
      }
    `,
  ],
})
export class SelectCellEditor implements ICellEditorAngularComp<Task> {
  value = '';
  options: string[] = [];
  @ViewChild('sel') private sel?: ElementRef<HTMLSelectElement>;
  private params!: ICellEditorParams<Task>;

  agInit(params: ICellEditorParams<Task>): void {
    this.params = params;
    this.value = String(params.value ?? '');
    // `cellEditorParams: { values: [...] }` is spread onto params.
    this.options = (params.values as string[]) ?? [];
  }

  getValue(): string {
    return this.value;
  }

  afterGuiAttached(): void {
    this.sel?.nativeElement.focus();
  }

  onChange(event: Event): void {
    this.value = (event.target as HTMLSelectElement).value;
  }

  commit(): void {
    this.params.stopEditing();
  }
}

// ---------------------------------------------------------------------------
// A clamped number editor (returns a real number from getValue)
// ---------------------------------------------------------------------------

@Component({
  selector: 'demo-number-editor',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<input
    #inp
    class="ed"
    type="number"
    [min]="min"
    [max]="max"
    [value]="value"
    (input)="onInput($event)"
  />`,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
        height: 100%;
      }
      .ed {
        width: 100%;
        height: 100%;
        border: 1px solid #6366f1;
        box-sizing: border-box;
        padding: 0 6px;
        font: 13px system-ui, sans-serif;
      }
    `,
  ],
})
export class NumberCellEditor implements ICellEditorAngularComp<Task> {
  value = 0;
  min = 1;
  max = 5;
  @ViewChild('inp') private inp?: ElementRef<HTMLInputElement>;

  agInit(params: ICellEditorParams<Task>): void {
    this.value = Number(params.value ?? 0);
    if (typeof params.min === 'number') this.min = params.min;
    if (typeof params.max === 'number') this.max = params.max;
    // Type-to-edit: seed from the key that opened the editor, if numeric.
    if (params.charPress && /\d/.test(params.charPress)) this.value = Number(params.charPress);
  }

  getValue(): number {
    return Math.min(this.max, Math.max(this.min, Math.round(this.value)));
  }

  afterGuiAttached(): void {
    const el = this.inp?.nativeElement;
    el?.focus();
    el?.select();
  }

  onInput(event: Event): void {
    this.value = Number((event.target as HTMLInputElement).value);
  }
}

// Register the select editor under a name too, to exercise name resolution.
registerCellRenderer('statusEditor', SelectCellEditor);

function makeData(count: number): Task[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    title: `Task ${i + 1}`,
    status: STATUSES[i % STATUSES.length],
    priority: (i % 5) + 1,
  }));
}

const meta: Meta<ArgentGridComponent<Task>> = {
  title: 'Features/CellEditors',
  component: ArgentGridComponent,
  decorators: [
    moduleMetadata({
      imports: [ArgentGridModule, BrowserModule, SelectCellEditor, NumberCellEditor],
    }),
  ],
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj<ArgentGridComponent<Task>>;

/**
 * Custom Angular cell editors hosted over the canvas. Double-click (or press
 * Enter / start typing) a **Status** cell for a `<select>` dropdown editor, or a
 * **Priority** cell for a clamped number editor. Enter/Tab commit, Escape
 * cancels — and the edited value flows through the normal valueParser/valueSetter
 * pipeline. The Status column resolves its editor by registered name
 * (`cellEditor: 'statusEditor'`); Priority uses the component class directly.
 */
export const CustomEditors: Story = {
  args: {
    columnDefs: [
      { field: 'id', headerName: 'ID', width: 80, pinned: 'left' },
      { field: 'title', headerName: 'Title', width: 220, editable: true },
      {
        field: 'status',
        headerName: 'Status',
        width: 200,
        editable: true,
        cellEditor: 'statusEditor',
        cellEditorParams: { values: STATUSES },
      },
      {
        field: 'priority',
        headerName: 'Priority (1–5)',
        width: 160,
        editable: true,
        cellEditor: NumberCellEditor,
        cellEditorParams: { min: 1, max: 5 },
      },
    ],
    rowData: makeData(200),
    height: 'calc(100vh - 20px)',
    width: '100%',
    rowHeight: 36,
    theme: themeQuartz,
  },
};
