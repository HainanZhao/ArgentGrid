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
}

const meta: Meta<ArgentGridComponent<Employee>> = {
  title: 'Features/Grouping',
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
  }));
}

const baseColumnDefs = [
  { field: 'id', headerName: 'ID', width: 80 },
  { field: 'name', headerName: 'Name', width: 200 },
  { field: 'department', headerName: 'Department', width: 180 },
  { field: 'role', headerName: 'Role', width: 250 },
  { field: 'salary', headerName: 'Salary', width: 120 },
  { field: 'location', headerName: 'Location', width: 150 },
];

export const RowGrouping: Story = {
  args: {
    columnDefs: [
      { field: 'id', headerName: 'ID', width: 80 },
      { field: 'name', headerName: 'Name', width: 200 },
      { field: 'department', headerName: 'Department', width: 180, rowGroup: true },
      { field: 'role', headerName: 'Role', width: 250 },
      { field: 'salary', headerName: 'Salary', width: 120 },
      { field: 'location', headerName: 'Location', width: 150 },
    ],
    rowData: generateData(100),
    height: '500px',
    width: '100%',
    theme: themeQuartz,
    gridOptions: {
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
          'Row grouping by Department column. Drag column headers to group by multiple columns.',
      },
    },
  },
};

export const MultiLevelGrouping: Story = {
  args: {
    columnDefs: [
      { field: 'id', headerName: 'ID', width: 80 },
      { field: 'name', headerName: 'Name', width: 200 },
      { field: 'department', headerName: 'Department', width: 150, rowGroup: true },
      { field: 'location', headerName: 'Location', width: 150, rowGroup: true },
      { field: 'role', headerName: 'Role', width: 250 },
      { field: 'salary', headerName: 'Salary', width: 120 },
    ],
    rowData: generateData(100),
    height: '500px',
    width: '100%',
    theme: themeQuartz,
    gridOptions: {
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
        story: 'Multi-level row grouping by Department and Location.',
      },
    },
  },
};

export const GroupingWithAggregation: Story = {
  args: {
    columnDefs: [
      { field: 'id', headerName: 'ID', width: 80 },
      { field: 'name', headerName: 'Name', width: 200 },
      { field: 'department', headerName: 'Department', width: 180, rowGroup: true },
      { field: 'role', headerName: 'Role', width: 250 },
      {
        field: 'salary',
        headerName: 'Salary',
        width: 120,
        aggFunc: 'sum',
        valueFormatter: (params: any) => `$${params.value?.toLocaleString()}`,
      },
    ],
    rowData: generateData(100),
    height: '500px',
    width: '100%',
    theme: themeQuartz,
    gridOptions: {
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
        story: 'Row grouping with salary aggregation (sum) at group level.',
      },
    },
  },
};

export const NoGrouping: Story = {
  args: {
    columnDefs: baseColumnDefs,
    rowData: generateData(50),
    height: '400px',
    width: '100%',
    theme: themeQuartz,
  },
  parameters: {
    docs: {
      description: {
        story: 'Regular grid without any grouping for reference.',
      },
    },
  },
};
