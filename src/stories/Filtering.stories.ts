import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { ArgentGridComponent, ArgentGridModule, themeQuartz } from '../public-api';
import { BrowserModule } from '@angular/platform-browser';

interface Employee {
  id: number;
  name: string;
  department: string;
  role: string;
  salary: number;
  location: string;
  startDate: string;
}

const meta: Meta<ArgentGridComponent<Employee>> = {
  title: 'Features/Filtering',
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
  const departments = ['Engineering', 'Sales', 'Marketing', 'HR', 'Finance', 'Operations', 'Support'];
  const roles = ['Software Engineer', 'Manager', 'Director', 'VP', 'Intern', 'Analyst'];
  const locations = ['New York', 'San Francisco', 'London', 'Singapore', 'Remote', 'Berlin'];

  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `Employee ${i + 1}`,
    department: departments[Math.floor(Math.random() * departments.length)],
    role: roles[Math.floor(Math.random() * roles.length)],
    salary: Math.floor(Math.random() * 150000) + 50000,
    location: locations[Math.floor(Math.random() * locations.length)],
    startDate: new Date(Date.now() - Math.random() * 5 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  }));
}

export const TextFilter: Story = {
  args: {
    columnDefs: [
      { field: 'id', headerName: 'ID', width: 80 },
      { field: 'name', headerName: 'Name', width: 200, filter: 'text' },
      { field: 'department', headerName: 'Department', width: 180, filter: 'text' },
      { field: 'role', headerName: 'Role', width: 250, filter: 'text' },
      { field: 'salary', headerName: 'Salary', width: 120 },
      { field: 'location', headerName: 'Location', width: 150 },
    ],
    rowData: generateData(50),
    height: '400px',
    width: '100%',
    theme: themeQuartz,
  },
  parameters: {
    docs: {
      description: {
        story: 'Text filters on Name, Department, and Role columns. Click filter icon to open filter menu.',
      },
    },
  },
};

export const NumberFilter: Story = {
  args: {
    columnDefs: [
      { field: 'id', headerName: 'ID', width: 80, filter: 'number' },
      { field: 'name', headerName: 'Name', width: 200 },
      { field: 'department', headerName: 'Department', width: 180 },
      { field: 'salary', headerName: 'Salary', width: 120, filter: 'number' },
      { field: 'location', headerName: 'Location', width: 150 },
    ],
    rowData: generateData(50),
    height: '400px',
    width: '100%',
    theme: themeQuartz,
  },
  parameters: {
    docs: {
      description: {
        story: 'Number filters on ID and Salary columns. Supports equals, greater than, less than, etc.',
      },
    },
  },
};

export const SetFilter: Story = {
  args: {
    columnDefs: [
      { field: 'id', headerName: 'ID', width: 80 },
      { field: 'name', headerName: 'Name', width: 200 },
      { field: 'department', headerName: 'Department', width: 180, filter: 'set' },
      { field: 'role', headerName: 'Role', width: 250 },
      { field: 'salary', headerName: 'Salary', width: 120 },
      { field: 'location', headerName: 'Location', width: 150, filter: 'set' },
    ],
    rowData: generateData(50),
    height: '400px',
    width: '100%',
    theme: themeQuartz,
  },
  parameters: {
    docs: {
      description: {
        story: 'Set filters on Department and Location columns. Allows quick multi-select from a list of unique values.',
      },
    },
  },
};

export const DateFilter: Story = {
  args: {
    columnDefs: [
      { field: 'id', headerName: 'ID', width: 80 },
      { field: 'name', headerName: 'Name', width: 200 },
      { field: 'department', headerName: 'Department', width: 180 },
      { field: 'startDate', headerName: 'Start Date', width: 130, filter: 'date' },
      { field: 'salary', headerName: 'Salary', width: 120 },
    ],
    rowData: generateData(50),
    height: '400px',
    width: '100%',
    theme: themeQuartz,
  },
  parameters: {
    docs: {
      description: {
        story: 'Date filter on Start Date column. Supports date range selection.',
      },
    },
  },
};

export const FloatingFilters: Story = {
  args: {
    columnDefs: [
      { field: 'id', headerName: 'ID', width: 80, filter: 'number', floatingFilter: true },
      { field: 'name', headerName: 'Name', width: 200, filter: 'text', floatingFilter: true },
      { field: 'department', headerName: 'Department', width: 180, filter: 'set', floatingFilter: true },
      { field: 'role', headerName: 'Role', width: 250, filter: 'text', floatingFilter: true },
      { field: 'salary', headerName: 'Salary', width: 120, filter: 'number', floatingFilter: true },
      { field: 'location', headerName: 'Location', width: 150, filter: 'set', floatingFilter: true },
    ],
    rowData: generateData(50),
    height: '450px',
    width: '100%',
    theme: themeQuartz,
  },
  parameters: {
    docs: {
      description: {
        story: 'Floating filters appear below column headers for quick filtering without opening filter menus.',
      },
    },
  },
};

export const CombinedFilters: Story = {
  args: {
    columnDefs: [
      { field: 'id', headerName: 'ID', width: 80, filter: 'number', floatingFilter: true },
      { field: 'name', headerName: 'Name', width: 200, filter: 'text' },
      { field: 'department', headerName: 'Department', width: 180, filter: 'set', floatingFilter: true },
      { field: 'role', headerName: 'Role', width: 250, filter: 'text' },
      { field: 'salary', headerName: 'Salary', width: 120, filter: 'number', floatingFilter: true },
      { field: 'location', headerName: 'Location', width: 150, filter: 'set' },
    ],
    rowData: generateData(100),
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
        story: 'Combined filter types with side bar. Enable side bar for advanced filtering panel.',
      },
    },
  },
};