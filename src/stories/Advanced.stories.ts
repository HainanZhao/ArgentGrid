import { BrowserModule } from '@angular/platform-browser';
import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { ArgentGridComponent, ArgentGridModule, themeQuartz } from '../public-api';

interface Employee {
  id: number;
  name: string;
  department: string;
  role: string;
  salary: number;
  location: string;
  performance: number;
}

const meta: Meta<ArgentGridComponent<Employee>> = {
  title: 'Features/Advanced',
  component: ArgentGridComponent,
  decorators: [
    moduleMetadata({
      imports: [ArgentGridModule, BrowserModule],
    }),
  ],
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<ArgentGridComponent<Employee>>;

function generateData(count: number): Employee[] {
  const departments = ['Engineering', 'Sales', 'Marketing', 'HR', 'Finance'];
  const roles = ['Software Engineer', 'Manager', 'Director', 'VP', 'Intern'];
  const locations = ['New York', 'San Francisco', 'London', 'Singapore', 'Remote'];

  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `Employee ${i + 1}`,
    department: departments[Math.floor(Math.random() * departments.length)],
    role: roles[Math.floor(Math.random() * roles.length)],
    salary: Math.floor(Math.random() * 150000) + 50000,
    location: locations[Math.floor(Math.random() * locations.length)],
    performance: Math.floor(Math.random() * 40) + 60,
  }));
}

export const SideBar: Story = {
  args: {
    columnDefs: [
      { field: 'id', headerName: 'ID', width: 80, filter: true },
      { field: 'name', headerName: 'Name', width: 200, filter: true },
      { field: 'department', headerName: 'Department', width: 180, filter: 'set' },
      { field: 'role', headerName: 'Role', width: 250, filter: true },
      { field: 'salary', headerName: 'Salary', width: 120, filter: 'number' },
      { field: 'location', headerName: 'Location', width: 150, filter: 'set' },
      { field: 'performance', headerName: 'Performance', width: 120, filter: 'number' },
    ],
    rowData: generateData(50),
    height: '500px',
    width: '100%',
    theme: themeQuartz,
    gridOptions: {
      sideBar: {
        toolPanels: [
          {
            id: 'columns',
            labelDefault: 'Columns',
            labelKey: 'columns',
            iconKey: 'columns',
            toolPanel: 'agColumnsToolPanel',
          },
          {
            id: 'filters',
            labelDefault: 'Filters',
            labelKey: 'filters',
            iconKey: 'filter',
            toolPanel: 'agFiltersToolPanel',
          },
        ],
      },
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Side bar with Columns and Filters panels. Click the sidebar toggle button in the grid toolbar to show/hide.',
      },
    },
  },
};

export const SideBarDefault: Story = {
  args: {
    columnDefs: [
      { field: 'id', headerName: 'ID', width: 80, filter: true },
      { field: 'name', headerName: 'Name', width: 200, filter: true },
      { field: 'department', headerName: 'Department', width: 180, filter: 'set' },
      { field: 'role', headerName: 'Role', width: 250, filter: true },
      { field: 'salary', headerName: 'Salary', width: 120, filter: 'number' },
    ],
    rowData: generateData(50),
    height: '500px',
    width: '100%',
    theme: themeQuartz,
    gridOptions: {
      sideBar: true,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Side bar with default configuration (Columns and Filters tool panels).',
      },
    },
  },
};

export const RangeSelection: Story = {
  args: {
    columnDefs: [
      { field: 'id', headerName: 'ID', width: 80 },
      { field: 'name', headerName: 'Name', width: 200 },
      { field: 'department', headerName: 'Department', width: 180 },
      { field: 'role', headerName: 'Role', width: 250 },
      { field: 'salary', headerName: 'Salary', width: 120 },
      { field: 'location', headerName: 'Location', width: 150 },
    ],
    rowData: generateData(50),
    height: '400px',
    width: '100%',
    theme: themeQuartz,
    gridOptions: {
      enableRangeSelection: true,
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Enable range selection to select multiple cells by clicking and dragging. Use Ctrl+C to copy selected range.',
      },
    },
  },
};

export const FullFeatures: Story = {
  args: {
    columnDefs: [
      { field: 'id', headerName: 'ID', width: 80, filter: true, sortable: true },
      { field: 'name', headerName: 'Name', width: 200, filter: true, sortable: true },
      {
        field: 'department',
        headerName: 'Department',
        width: 180,
        filter: 'set',
        sortable: true,
        rowGroup: true,
      },
      { field: 'role', headerName: 'Role', width: 250, filter: true },
      { field: 'salary', headerName: 'Salary', width: 120, filter: 'number', sortable: true },
      { field: 'location', headerName: 'Location', width: 150, filter: 'set' },
    ],
    rowData: generateData(100),
    height: '500px',
    width: '100%',
    theme: themeQuartz,
    gridOptions: {
      floatingFilter: true,
      enableRangeSelection: true,
      sideBar: true,
      autoGroupColumnDef: {
        headerName: 'Organization',
        width: 250,
        pinned: 'left',
      },
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Full-featured grid with sorting, filtering, floating filters, range selection, side bar, and row grouping.',
      },
    },
  },
};
