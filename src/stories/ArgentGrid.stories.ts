import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { ArgentGridComponent, ArgentGridModule } from '../public-api';

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
    startDate: new Date(Date.now() - Math.random() * 5 * 365 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0],
    performance: Math.floor(Math.random() * 40) + 60,
  }));
}

export const Default: Story = {
  args: {
    columnDefs: [
      { field: 'id', headerName: 'ID', width: 80 },
      { field: 'name', headerName: 'Name', width: 200 },
      { field: 'department', headerName: 'Department', width: 180 },
      { field: 'role', headerName: 'Role', width: 250 },
      { field: 'salary', headerName: 'Salary', width: 120 },
      { field: 'location', headerName: 'Location', width: 150 },
      { field: 'startDate', headerName: 'Start Date', width: 130 },
      { field: 'performance', headerName: 'Performance', width: 120 },
    ],
    rowData: generateData(100),
    height: '500px',
    width: '100%',
  },
};

export const LargeDataset: Story = {
  args: {
    columnDefs: [
      { field: 'id', headerName: 'ID', width: 80 },
      { field: 'name', headerName: 'Name', width: 200 },
      { field: 'department', headerName: 'Department', width: 180 },
      { field: 'role', headerName: 'Role', width: 250 },
      { field: 'salary', headerName: 'Salary', width: 120 },
    ],
    rowData: generateData(100000),
    height: '500px',
    width: '100%',
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates performance with 100K rows. Scroll smoothly at 60fps.',
      },
    },
  },
};

export const WithSorting: Story = {
  args: {
    columnDefs: [
      { field: 'id', headerName: 'ID', width: 80, sortable: true },
      { field: 'name', headerName: 'Name', width: 200, sortable: true },
      { field: 'department', headerName: 'Department', width: 180, sortable: true },
      { field: 'salary', headerName: 'Salary', width: 120, sortable: true },
    ],
    rowData: generateData(50),
    height: '400px',
    width: '100%',
  },
};

export const WithSelection: Story = {
  args: {
    columnDefs: [
      { field: 'id', headerName: 'ID', width: 80, checkboxSelection: true },
      { field: 'name', headerName: 'Name', width: 200 },
      { field: 'department', headerName: 'Department', width: 180 },
      { field: 'role', headerName: 'Role', width: 250 },
    ],
    rowData: generateData(50),
    height: '400px',
    width: '100%',
  },
};

export const WithFiltering: Story = {
  args: {
    columnDefs: [
      { field: 'id', headerName: 'ID', width: 80, filter: true },
      { field: 'name', headerName: 'Name', width: 200, filter: true },
      { field: 'department', headerName: 'Department', width: 180, filter: 'set' },
      { field: 'role', headerName: 'Role', width: 250, filter: true },
    ],
    rowData: generateData(50),
    height: '400px',
    width: '100%',
  },
};

export const Empty: Story = {
  args: {
    columnDefs: [
      { field: 'id', headerName: 'ID', width: 80 },
      { field: 'name', headerName: 'Name', width: 200 },
    ],
    rowData: [],
    height: '300px',
    width: '100%',
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows the empty state overlay when no data is provided.',
      },
    },
  },
};
