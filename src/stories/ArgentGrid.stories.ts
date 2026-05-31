import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { expect, userEvent, waitFor } from '@storybook/test';
import { ArgentGridComponent, ArgentGridModule, themeQuartz } from '../public-api';
import {
  departmentValueFormatter,
  locationValueFormatter,
  roleValueFormatter,
  STORY_DEPARTMENTS,
  STORY_LOCATIONS,
  STORY_ROLES,
} from './story-utils';

interface Employee {
  id: number;
  name: string;
  department: string;
  role: string;
  salary: number;
  location: string;
  startDate: string;
  performance: number;
}

const meta: Meta<ArgentGridComponent<Employee>> = {
  title: 'Components/ArgentGrid',
  component: ArgentGridComponent,
  decorators: [
    moduleMetadata({
      imports: [ArgentGridModule],
    }),
  ],
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    height: { control: 'text' },
    width: { control: 'text' },
    rowHeight: { control: 'number' },
  },
};

export default meta;
type Story = StoryObj<ArgentGridComponent<Employee>>;

function generateStaticData(count: number): Employee[] {
  const departments = STORY_DEPARTMENTS;
  const roles = STORY_ROLES;
  const locations = STORY_LOCATIONS;

  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `Employee ${i + 1}`,
    department: departments[i % departments.length],
    role: roles[i % roles.length],
    salary: 50000 + i * 1000,
    location: locations[i % locations.length],
    startDate: '2020-01-01',
    performance: 80,
  }));
}

export const Default: Story = {
  args: {
    columnDefs: [
      { field: 'id', headerName: 'ID', width: 80 },
      { field: 'name', headerName: 'Name', width: 200 },
      {
        field: 'department',
        headerName: 'Department',
        width: 180,
        valueFormatter: departmentValueFormatter,
      },
      { field: 'role', headerName: 'Role', width: 250, valueFormatter: roleValueFormatter },
      { field: 'salary', headerName: 'Salary', width: 120 },
      {
        field: 'location',
        headerName: 'Location',
        width: 180,
        valueFormatter: locationValueFormatter,
      },
      { field: 'startDate', headerName: 'Start Date', width: 130 },
      { field: 'performance', headerName: 'Performance', width: 120 },
    ],
    rowData: generateStaticData(100),
    height: 'calc(100vh - 60px)',
    width: '100%',
    theme: themeQuartz,
  },
  parameters: {
    docs: {
      description: {
        story: '**Basic grid** with 100 rows. Default theme (Quartz). No special features enabled.',
      },
    },
  },
};

export const LargeDataset: Story = {
  args: {
    columnDefs: [
      { field: 'id', headerName: 'ID', width: 80 },
      { field: 'name', headerName: 'Name', width: 200 },
      {
        field: 'department',
        headerName: 'Department',
        width: 180,
        valueFormatter: departmentValueFormatter,
      },
      { field: 'role', headerName: 'Role', width: 250, valueFormatter: roleValueFormatter },
      { field: 'salary', headerName: 'Salary', width: 120 },
    ],
    rowData: generateStaticData(100000),
    height: 'calc(100vh - 60px)',
    width: '100%',
    theme: themeQuartz,
  },
  parameters: {
    docs: {
      description: {
        story:
          '**Performance demo with 100K rows**. Scroll smoothly at 60fps thanks to canvas rendering and virtual scrolling. Try scrolling to the bottom!',
      },
    },
  },
};

export const WithSorting: Story = {
  args: {
    columnDefs: [
      {
        field: 'id',
        headerName: 'ID',
        width: 80,
        sortable: true,
        headerComponentParams: { sortIcon: '↕️' },
      },
      {
        field: 'name',
        headerName: 'Name ↕️',
        width: 200,
        sortable: true,
        headerComponentParams: { sortIcon: '↕️' },
      },
      {
        field: 'department',
        headerName: 'Department ↕️',
        width: 180,
        sortable: true,
        headerComponentParams: { sortIcon: '↕️' },
      },
      {
        field: 'salary',
        headerName: 'Salary ↕️',
        width: 120,
        sortable: true,
        headerComponentParams: { sortIcon: '↕️' },
      },
    ],
    rowData: generateStaticData(50),
    height: 'calc(100vh - 60px)',
    width: '100%',
    theme: themeQuartz,
  },
  parameters: {
    docs: {
      description: {
        story:
          '**Sortable columns** with ↕️ indicators. **Click column headers** to sort ascending/descending. Look for the **▲/▼ arrows** that appear when sorted.',
      },
    },
  },
};

export const WithSelection: Story = {
  args: {
    columnDefs: [
      { field: 'id', headerName: 'ID', width: 80 },
      { field: 'name', headerName: 'Name', width: 200 },
      {
        field: 'department',
        headerName: 'Department',
        width: 180,
        valueFormatter: departmentValueFormatter,
      },
      { field: 'role', headerName: 'Role', width: 250, valueFormatter: roleValueFormatter },
    ],
    rowData: generateStaticData(50),
    rowSelection: 'multiple',
    height: 'calc(100vh - 60px)',
    width: '100%',
    theme: themeQuartz,
  },
  parameters: {
    docs: {
      description: {
        story:
          '**Row selection with checkboxes**. Enabling `rowSelection` automatically adds a dedicated checkbox selection column. **Click checkboxes** to select/deselect rows. **Header checkbox** selects/deselects all visible rows.',
      },
    },
  },
};

export const WithFiltering: Story = {
  args: {
    columnDefs: [
      {
        field: 'id',
        headerName: 'ID',
        width: 80,
        filter: 'number',
        floatingFilter: true,
        headerComponentParams: { filterIcon: '🔢' },
      },
      {
        field: 'name',
        headerName: 'Name 🔤',
        width: 200,
        filter: 'text',
        floatingFilter: true,
        headerComponentParams: { filterIcon: '🔤' },
      },
      {
        field: 'department',
        headerName: 'Department ☑️',
        width: 180,
        filter: 'set',
        floatingFilter: true,
        headerComponentParams: { filterIcon: '☑️' },
        valueFormatter: departmentValueFormatter,
      },
      {
        field: 'role',
        headerName: 'Role 🔤',
        width: 250,
        filter: 'text',
        floatingFilter: true,
        headerComponentParams: { filterIcon: '🔤' },
        valueFormatter: roleValueFormatter,
      },
    ],
    rowData: generateStaticData(50),
    height: 'calc(100vh - 60px)',
    width: '100%',
    theme: themeQuartz,
  },
  parameters: {
    docs: {
      description: {
        story:
          '**Filtering with visible filter inputs**. Each filterable column shows an icon (🔢 Number, 🔤 Text, ☑️ Set). **Filter inputs are visible in the header row** - type to filter. Department uses a set filter (dropdown with checkboxes).',
      },
    },
  },
};

export const Empty: Story = {
  args: {
    columnDefs: [
      { field: 'id', headerName: 'ID', width: 80 },
      { field: 'name', headerName: 'Name', width: 200 },
    ],
    rowData: [],
    height: 'calc(100vh - 60px)',
    width: '100%',
    theme: themeQuartz,
  },
  parameters: {
    docs: {
      description: {
        story: '**Empty grid** with no rows. Shows overlay message "No rows to show".',
      },
    },
  },
};

export const WithCustomTheme: Story = {
  args: {
    columnDefs: [
      { field: 'id', headerName: 'ID', width: 80 },
      { field: 'name', headerName: 'Name', width: 200 },
      { field: 'department', headerName: 'Department', width: 180 },
      { field: 'salary', headerName: 'Salary', width: 120 },
    ],
    rowData: generateStaticData(50),
    height: 'calc(100vh - 60px)',
    width: '100%',
    theme: themeQuartz.withParams({
      accentColor: '#ff5722', // Orange accent
      rowHeight: 48,
      fontSize: 14,
    }),
  },
  parameters: {
    docs: {
      description: {
        story:
          '**Custom theme** with orange accent color, larger row height (48px), and larger font (14px). See Theming stories for more theme options.',
      },
    },
  },
};

export const WithPagination: Story = {
  args: {
    columnDefs: [
      { field: 'id', headerName: 'ID', width: 80 },
      { field: 'name', headerName: 'Name', width: 200 },
      {
        field: 'department',
        headerName: 'Department',
        width: 180,
        valueFormatter: departmentValueFormatter,
      },
      { field: 'role', headerName: 'Role', width: 250, valueFormatter: roleValueFormatter },
      { field: 'salary', headerName: 'Salary', width: 120 },
    ],
    rowData: generateStaticData(100),
    gridOptions: {
      pagination: true,
      paginationPageSize: 20,
    },
    height: 'calc(100vh - 60px)',
    width: '100%',
    theme: themeQuartz,
  },
  parameters: {
    docs: {
      description: {
        story:
          '**Client-side pagination** with 100 rows and 20 rows per page. **Navigate using the pagination controls** at the bottom of the grid. Automatically handles page numbering and row ranges.',
      },
    },
  },
};

export const MultiColumnSorting: Story = {
  args: {
    columnDefs: [
      { field: 'department', headerName: 'Department', width: 180, sortable: true },
      { field: 'role', headerName: 'Role', width: 250, sortable: true },
      { field: 'name', headerName: 'Name', width: 200, sortable: true },
      { field: 'salary', headerName: 'Salary', width: 120, sortable: true },
    ],
    rowData: generateStaticData(100),
    height: 'calc(100vh - 60px)',
    width: '100%',
    theme: themeQuartz,
  },
  parameters: {
    docs: {
      description: {
        story:
          '**Multi-Column Sorting**: **Hold SHIFT and click** column headers to sort by multiple columns. ' +
          'A number (1, 2, 3...) will appear next to the arrow indicating the sort priority. ' +
          'For example, sort by Department first, then by Role.',
      },
    },
  },
};

// --- Keyboard navigation stories + interaction (play) tests -----------------
// The focused cell lives on the canvas (not the DOM), so the stories stash the
// GridApi on window and the play functions read focus state through it.

interface KbGridApi {
  setFocusedCell(rowIndex: number, colKey: string): void;
  getFocusedCell(): { rowIndex: number; column?: { colId: string } } | null;
}

const getKbGridApi = (): KbGridApi | undefined =>
  (window as unknown as { __gridApi?: KbGridApi }).__gridApi;

const focusedColId = () => getKbGridApi()?.getFocusedCell()?.column?.colId;
const focusedRow = () => getKbGridApi()?.getFocusedCell()?.rowIndex;

/**
 * Wait for the grid to be ready and give its container DOM keyboard focus.
 * Presence checks assert on booleans, never on the GridApi/Element objects —
 * the Interactions instrumenter serializes expect() args over the channel via
 * telejson, which throws on rich class instances (`e.replace is not a function`).
 */
async function focusGrid(canvasElement: HTMLElement): Promise<HTMLElement> {
  await waitFor(() => expect(Boolean(getKbGridApi())).toBe(true));
  const container = canvasElement.querySelector<HTMLElement>('.argent-grid-container');
  await expect(Boolean(container)).toBe(true);
  container?.focus();
  return container as HTMLElement;
}

const keyboardRender = (args: Record<string, unknown>) => ({
  props: {
    ...args,
    onGridReady: (gridApi: unknown) => {
      (window as unknown as { __gridApi: unknown }).__gridApi = gridApi;
    },
  },
  template: `
    <argent-grid
      [columnDefs]="columnDefs"
      [rowData]="rowData"
      [height]="height"
      [width]="width"
      [theme]="theme"
      (gridReady)="onGridReady($event)">
    </argent-grid>
  `,
});

const keyboardArgs = {
  columnDefs: [
    { field: 'id', headerName: 'ID', width: 80, editable: true },
    { field: 'name', headerName: 'Name', width: 200, editable: true },
    { field: 'department', headerName: 'Department', width: 180, editable: true },
    { field: 'role', headerName: 'Role', width: 200, editable: true },
    { field: 'salary', headerName: 'Salary', width: 120, editable: true },
  ],
  rowData: generateStaticData(200),
  height: 'calc(100vh - 60px)',
  width: '100%',
  theme: themeQuartz,
};

export const KeyboardNavigation: Story = {
  render: keyboardRender,
  args: keyboardArgs,
  parameters: {
    docs: {
      description: {
        story:
          '**Keyboard navigation**: click a cell or use the arrow keys, Tab/Shift-Tab, Home/End ' +
          '(Ctrl+Home / Ctrl+End for grid edges), PageUp/PageDown to move the focus ring. ' +
          'Enter or any printable key starts editing the focused cell. ' +
          'The **Interactions** panel runs an automated test of the movement keys.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const root = canvasElement as HTMLElement;
    const container = await focusGrid(root);
    const api = getKbGridApi();
    if (!api) throw new Error('GridApi not available');

    // Clicking a cell moves keyboard focus to it. (Dispatch with explicit
    // coordinates — the focused cell is hit-tested from the canvas, not the DOM.)
    const canvas = root.querySelector<HTMLCanvasElement>('canvas.argent-grid-canvas');
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      canvas.dispatchEvent(
        new MouseEvent('click', { bubbles: true, clientX: rect.left + 100, clientY: rect.top + 60 })
      );
      // Assert with a primitive (the colId string) — never pass the rich Column
      // object into an instrumented expect(); the Interactions channel serializes
      // call args via telejson and can't round-trip class instances.
      await expect(focusedColId()).toBeTruthy();
      container.focus();
    }

    // PageDown scrolls the viewport down and advances the focused row.
    const viewport = root.querySelector<HTMLElement>('.argent-grid-viewport');
    api.setFocusedCell(0, 'name');
    const beforeScroll = viewport?.scrollTop ?? 0;
    await userEvent.keyboard('{PageDown}');
    await waitFor(() => expect(viewport?.scrollTop ?? 0).toBeGreaterThan(beforeScroll));
    await expect(focusedRow() ?? 0).toBeGreaterThan(0);

    // Arrow keys move the focused cell.
    api.setFocusedCell(5, 'name');
    await userEvent.keyboard('{ArrowDown}');
    await expect(focusedRow()).toBe(6);
    await expect(focusedColId()).toBe('name');
    await userEvent.keyboard('{ArrowRight}');
    await expect(focusedColId()).toBe('department');
    await userEvent.keyboard('{ArrowUp}');
    await expect(focusedRow()).toBe(5);
    await userEvent.keyboard('{ArrowLeft}');
    await expect(focusedColId()).toBe('name');

    // Arrows clamp at the grid edges (no wrap).
    api.setFocusedCell(0, 'id');
    await userEvent.keyboard('{ArrowUp}{ArrowLeft}');
    await expect(focusedRow()).toBe(0);
    await expect(focusedColId()).toBe('id');

    // Tab wraps to the next row at the last column; Shift+Tab wraps back.
    api.setFocusedCell(0, 'salary');
    await userEvent.keyboard('{Tab}');
    await expect(focusedRow()).toBe(1);
    await expect(focusedColId()).toBe('id');
    await userEvent.keyboard('{Shift>}{Tab}{/Shift}');
    await expect(focusedRow()).toBe(0);
    await expect(focusedColId()).toBe('salary');

    // Home/End move within the row; Ctrl+Home/End to grid corners.
    api.setFocusedCell(5, 'department');
    await userEvent.keyboard('{Home}');
    await expect(focusedColId()).toBe('id');
    await userEvent.keyboard('{End}');
    await expect(focusedColId()).toBe('salary');
    await userEvent.keyboard('{Control>}{Home}{/Control}');
    await expect(focusedRow()).toBe(0);
    await expect(focusedColId()).toBe('id');
    await userEvent.keyboard('{Control>}{End}{/Control}');
    await expect(focusedRow()).toBe(199);
    await expect(focusedColId()).toBe('salary');
  },
};

export const KeyboardEditing: Story = {
  render: keyboardRender,
  args: keyboardArgs,
  parameters: {
    docs: {
      description: {
        story:
          '**Edit entry from the keyboard**: with a cell focused, press **Enter** to open the ' +
          'editor, or type any printable character to start editing seeded with that character. ' +
          'The **Interactions** panel runs an automated test of both paths.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const root = canvasElement as HTMLElement;
    const container = await focusGrid(root);
    const api = getKbGridApi();
    if (!api) throw new Error('GridApi not available');

    // Enter opens the editor on the focused cell.
    api.setFocusedCell(2, 'name');
    await userEvent.keyboard('{Enter}');
    const editor = await waitFor(() => {
      const el = root.querySelector<HTMLInputElement>('.argent-grid-cell-editor input');
      if (!el) throw new Error('editor not open');
      return el;
    });
    await expect(editor).toBeVisible();

    // Close the editor and return focus to the grid.
    await userEvent.keyboard('{Escape}');
    container.focus();

    // Type-to-edit: a printable character opens the editor seeded with it.
    api.setFocusedCell(3, 'name');
    await userEvent.keyboard('Z');
    const typed = await waitFor(() => {
      const el = root.querySelector<HTMLInputElement>('.argent-grid-cell-editor input');
      if (!el) throw new Error('editor not open');
      return el;
    });
    await expect(typed).toHaveValue('Z');
    await userEvent.keyboard('{Escape}');
  },
};

export const Overlays: Story = {
  render: (args) => ({
    props: {
      ...args,
      generateStaticData, // Pass the helper to props
    },
    template: `
      <div style="display: flex; flex-direction: column; gap: 10px; height: 100%; padding: 10px; box-sizing: border-box;">
        <div style="display: flex; gap: 10px; margin-bottom: 5px;">
          <button (click)="grid.getApi().showLoadingOverlay()" style="padding: 5px 10px; cursor: pointer;">Show Loading Overlay</button>
          <button (click)="grid.getApi().showNoRowsOverlay()" style="padding: 5px 10px; cursor: pointer;">Show No Rows Overlay</button>
          <button (click)="grid.getApi().hideOverlay()" style="padding: 5px 10px; cursor: pointer;">Hide Overlays</button>
          <button (click)="grid.getApi().setRowData([])" style="padding: 5px 10px; cursor: pointer;">Clear Row Data (Auto No Rows)</button>
          <button (click)="grid.getApi().setRowData(generateStaticData(50))" style="padding: 5px 10px; cursor: pointer;">Reset Row Data</button>
        </div>
        <argent-grid 
          #grid
          style="flex: 1;"
          [columnDefs]="columnDefs" 
          [rowData]="rowData" 
          [height]="height" 
          [width]="width"
          [theme]="theme"
          [gridOptions]="gridOptions">
        </argent-grid>
      </div>
    `,
  }),
  args: {
    columnDefs: [
      { field: 'id', headerName: 'ID', width: 80 },
      { field: 'name', headerName: 'Name', width: 200 },
      { field: 'department', headerName: 'Department', width: 180 },
    ],
    rowData: generateStaticData(50),
    height: 'calc(100vh - 100px)',
    width: '100%',
    theme: themeQuartz,
  },
  parameters: {
    docs: {
      description: {
        story:
          '**Overlay API**: Manually trigger built-in overlays via the API. ' +
          'Includes **Loading** and **No Rows** overlays. ' +
          'The grid also automatically shows the "No Rows" overlay when data is empty.',
      },
    },
  },
};
