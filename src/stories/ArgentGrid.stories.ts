import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
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
