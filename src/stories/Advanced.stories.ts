import { BrowserModule } from '@angular/platform-browser';
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
    performance: 80,
  }));
}

export const SideBar: Story = {
  args: {
    columnDefs: [
      { field: 'id', headerName: 'ID', width: 80, filter: true },
      { field: 'name', headerName: 'Name', width: 200, filter: true },
      {
        field: 'department',
        headerName: 'Department',
        width: 180,
        filter: 'set',
        valueFormatter: departmentValueFormatter,
      },
      {
        field: 'role',
        headerName: 'Role',
        width: 250,
        filter: true,
        valueFormatter: roleValueFormatter,
      },
      { field: 'salary', headerName: 'Salary', width: 120, filter: 'number' },
      {
        field: 'location',
        headerName: 'Location',
        width: 150,
        filter: 'set',
        valueFormatter: locationValueFormatter,
      },
      { field: 'performance', headerName: 'Performance', width: 120, filter: 'number' },
    ],
    rowData: generateStaticData(50),
    height: 'calc(100vh - 60px)',
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
      {
        field: 'department',
        headerName: 'Department',
        width: 180,
        filter: 'set',
        valueFormatter: departmentValueFormatter,
      },
      {
        field: 'role',
        headerName: 'Role',
        width: 250,
        filter: true,
        valueFormatter: roleValueFormatter,
      },
      { field: 'salary', headerName: 'Salary', width: 120, filter: 'number' },
    ],
    rowData: generateStaticData(50),
    height: 'calc(100vh - 60px)',
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
        width: 150,
        valueFormatter: locationValueFormatter,
      },
    ],
    rowData: generateStaticData(50),
    height: 'calc(100vh - 60px)',
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
        valueFormatter: departmentValueFormatter,
      },
      {
        field: 'role',
        headerName: 'Role',
        width: 250,
        filter: true,
        valueFormatter: roleValueFormatter,
      },
      { field: 'salary', headerName: 'Salary', width: 120, filter: 'number', sortable: true },
      {
        field: 'location',
        headerName: 'Location',
        width: 150,
        filter: 'set',
        valueFormatter: locationValueFormatter,
      },
    ],
    rowData: generateStaticData(100),
    height: 'calc(100vh - 60px)',
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
