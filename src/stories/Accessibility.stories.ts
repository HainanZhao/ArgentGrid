import { BrowserModule } from '@angular/platform-browser';
import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { expect, waitFor } from '@storybook/test';
import {
  ArgentGridComponent,
  ArgentGridModule,
  type ColDef,
  type GridOptions,
  themeQuartz,
} from '../public-api';

// ---------------------------------------------------------------------------
// Accessibility (T2.4)
//
// The data viewport is a canvas, so there are no per-cell DOM nodes. ArgentGrid
// exposes the grid to assistive tech two ways: (1) the real-DOM header carries
// role="columnheader" + aria-sort/aria-colindex; (2) an off-screen ARIA mirror
// (AriaRowMirror) maintains role="row" / role="gridcell" text nodes for the
// visible rows, kept in lockstep with the canvas. The grid root advertises
// role="grid", aria-rowcount/colcount and tracks the focused cell via
// aria-activedescendant. Inspect the DOM (or a screen reader) to see it.
// ---------------------------------------------------------------------------

interface Person {
  id: number;
  name: string;
  department: string;
  salary: number;
  active: boolean;
}

function makePeople(count: number): Person[] {
  const depts = ['Engineering', 'Sales', 'Support', 'Finance', 'Design'];
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `Person ${i + 1}`,
    department: depts[i % depts.length],
    salary: 50000 + ((i * 1234) % 50000),
    active: i % 3 !== 0,
  }));
}

const columns: ColDef<Person>[] = [
  { field: 'name', headerName: 'Name', width: 200, sort: 'asc' },
  { field: 'department', headerName: 'Department', width: 180 },
  {
    field: 'salary',
    headerName: 'Salary',
    width: 140,
    valueFormatter: (p) => `$${Number(p.value).toLocaleString()}`,
  },
  { field: 'active', headerName: 'Active', width: 110 },
];

const meta: Meta<ArgentGridComponent<Person>> = {
  title: 'Features/Accessibility',
  component: ArgentGridComponent,
  decorators: [moduleMetadata({ imports: [ArgentGridModule, BrowserModule] })],
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj<ArgentGridComponent<Person>>;

/**
 * A representative grid with row selection enabled and an initial sort. The
 * **Interactions** panel verifies the ARIA semantics: grid/header roles, the
 * sorted column's `aria-sort`, and the off-screen `role="row"` / `role="gridcell"`
 * mirror of the visible rows.
 */
export const AriaSemantics: Story = {
  args: {
    columnDefs: columns,
    rowData: makePeople(100),
    gridOptions: {
      rowSelection: 'multiple',
      ariaLabel: 'Employees',
    } as GridOptions<Person>,
    height: 'calc(100vh - 20px)',
    width: '100%',
    rowHeight: 36,
    theme: themeQuartz,
  },
  play: async ({ canvasElement }) => {
    const root = canvasElement as HTMLElement;

    // Grid root advertises itself as a grid with a label and row/col counts.
    const grid = root.querySelector<HTMLElement>('.argent-grid-container');
    await expect(Boolean(grid)).toBe(true);
    await expect(grid?.getAttribute('role')).toBe('grid');
    await expect(grid?.getAttribute('aria-label')).toBe('Employees');
    // 100 data rows + 1 header row.
    await expect(grid?.getAttribute('aria-rowcount')).toBe('101');

    // Header cells are real DOM with columnheader roles; the sorted column
    // reports aria-sort="ascending".
    const headerCells = root.querySelectorAll('.argent-grid-header-cell[role="columnheader"]');
    await expect(headerCells.length).toBeGreaterThan(0);
    const sorted = Array.from(headerCells).find((c) => c.getAttribute('aria-sort') === 'ascending');
    await expect(Boolean(sorted)).toBe(true);

    // The off-screen mirror exposes the visible rows as role=row/gridcell.
    await waitFor(async () => {
      const ariaRows = root.querySelectorAll('.argent-grid-aria-layer [role="row"]');
      await expect(ariaRows.length).toBeGreaterThan(0);
    });
    const firstRow = root.querySelector<HTMLElement>('.argent-grid-aria-layer [role="row"]');
    await expect(firstRow?.getAttribute('aria-rowindex')).toBe('2'); // header occupies index 1
    const firstCells = firstRow?.querySelectorAll('[role="gridcell"]');
    await expect((firstCells?.length ?? 0) > 0).toBe(true);
    await expect(firstCells?.[0].getAttribute('aria-colindex')).toBeTruthy();
  },
};

/**
 * With `suppressAccessibility: true` the grid emits no role/aria semantics and
 * builds no off-screen mirror — an escape hatch for very wide viewports.
 */
export const AccessibilitySuppressed: Story = {
  args: {
    columnDefs: columns,
    rowData: makePeople(100),
    gridOptions: { suppressAccessibility: true } as GridOptions<Person>,
    height: 'calc(100vh - 20px)',
    width: '100%',
    rowHeight: 36,
    theme: themeQuartz,
  },
  play: async ({ canvasElement }) => {
    const root = canvasElement as HTMLElement;
    const grid = root.querySelector<HTMLElement>('.argent-grid-container');
    await waitFor(async () => {
      await expect(Boolean(grid)).toBe(true);
    });
    await expect(grid?.hasAttribute('role')).toBe(false);
    const ariaRows = root.querySelectorAll('.argent-grid-aria-layer [role="row"]');
    await expect(ariaRows.length).toBe(0);
  },
};
