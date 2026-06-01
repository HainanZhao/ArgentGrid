import { BrowserModule } from '@angular/platform-browser';
import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import {
  ArgentGridComponent,
  ArgentGridModule,
  type GridOptions,
  type ICellRendererParams,
  registerCellRenderer,
  themeQuartz,
} from '../public-api';
import { RatingRenderer, StatusPillRenderer } from './CustomComponents.stories';

interface Employee {
  id: number;
  name: string;
  department: string;
  status: 'Active' | 'On Leave' | 'Remote' | 'Travel';
  rating: number;
  salary: number;
}

/**
 * Register renderers globally, once, under a name. Any grid in the app can now
 * reference them with `cellRenderer: 'statusPill'` — no import at the call site.
 * A function renderer ('currency') returns a string and is drawn on the canvas;
 * the component renderers route through the DOM overlay.
 */
registerCellRenderer('statusPill', StatusPillRenderer);
registerCellRenderer('starRating', RatingRenderer);
registerCellRenderer(
  'currency',
  (p: ICellRendererParams<Employee>) => `$${Number(p.value).toLocaleString()}`
);

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
  title: 'Features/NamedRenderers',
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
 * Columns reference renderers by **name** (`cellRenderer: 'statusPill'`),
 * resolved from the global registry populated above. This is the AG-Grid-style
 * indirection that decouples a column config from the renderer implementation.
 */
export const GlobalRegistry: Story = {
  args: {
    columnDefs: [
      { field: 'id', headerName: 'ID', width: 80, pinned: 'left' },
      { field: 'name', headerName: 'Name', width: 160 },
      { field: 'department', headerName: 'Department', width: 160 },
      { field: 'status', headerName: 'Status', width: 200, cellRenderer: 'statusPill' },
      { field: 'rating', headerName: 'Rating', width: 140, cellRenderer: 'starRating' },
      { field: 'salary', headerName: 'Salary', width: 130, cellRenderer: 'currency' },
    ],
    rowData: makeData(200),
    height: 'calc(100vh - 20px)',
    width: '100%',
    rowHeight: 40,
    theme: themeQuartz,
  },
};

/**
 * The same names, but resolved from a **per-grid** `gridOptions.components` map,
 * which takes precedence over the global registry. Here 'statusPill' is
 * overridden locally with the rating component to prove the precedence — note
 * the Status column renders stars in this story.
 */
export const PerGridComponents: Story = {
  args: {
    gridOptions: {
      components: {
        statusPill: RatingRenderer, // local override beats the global 'statusPill'
        currency: (p: ICellRendererParams<Employee>) => `${Number(p.value).toLocaleString()} USD`,
      },
    } as GridOptions<Employee>,
    columnDefs: [
      { field: 'id', headerName: 'ID', width: 80, pinned: 'left' },
      { field: 'name', headerName: 'Name', width: 160 },
      {
        field: 'status',
        headerName: 'Status (overridden)',
        width: 200,
        cellRenderer: 'statusPill',
      },
      { field: 'rating', headerName: 'Rating', width: 140, cellRenderer: 'starRating' },
      { field: 'salary', headerName: 'Salary', width: 160, cellRenderer: 'currency' },
    ],
    rowData: makeData(200),
    height: 'calc(100vh - 20px)',
    width: '100%',
    rowHeight: 40,
    theme: themeQuartz,
  },
};
