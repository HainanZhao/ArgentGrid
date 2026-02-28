import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { ArgentGridComponent, ArgentGridModule, colorSchemeDark, themeQuartz } from '../public-api';

interface Employee {
  id: number;
  name: string;
  department: string;
  role: string;
  salary: number;
  location: string;
}

const meta: Meta<ArgentGridComponent<Employee>> = {
  title: 'Features/Theming',
  component: ArgentGridComponent,
  decorators: [
    moduleMetadata({
      imports: [ArgentGridModule, BrowserModule, BrowserAnimationsModule],
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

const columnDefs = [
  { field: 'id', headerName: 'ID', width: 80 },
  { field: 'name', headerName: 'Name', width: 200 },
  { field: 'department', headerName: 'Department', width: 180 },
  { field: 'role', headerName: 'Role', width: 250 },
  { field: 'salary', headerName: 'Salary', width: 120 },
  { field: 'location', headerName: 'Location', width: 150 },
];

export const LightMode: Story = {
  args: {
    columnDefs,
    rowData: generateData(50),
    height: '400px',
    width: '100%',
    theme: themeQuartz,
  },
  parameters: {
    docs: {
      description: {
        story: 'Default light theme using Quartz theme.',
      },
    },
  },
};

export const DarkMode: Story = {
  args: {
    columnDefs,
    rowData: generateData(50),
    height: '400px',
    width: '100%',
    theme: themeQuartz.withPart(colorSchemeDark),
  },
  parameters: {
    docs: {
      description: {
        story: 'Dark mode using Quartz theme with dark color scheme.',
      },
    },
  },
};

export const CompactMode: Story = {
  args: {
    columnDefs,
    rowData: generateData(50),
    height: '400px',
    width: '100%',
    theme: themeQuartz.withParams({ rowHeight: 32, fontSize: 12, spacing: 4 }),
  },
  parameters: {
    docs: {
      description: {
        story: 'Compact mode with smaller row height and font size.',
      },
    },
  },
};

export const CompactDarkMode: Story = {
  args: {
    columnDefs,
    rowData: generateData(50),
    height: '400px',
    width: '100%',
    theme: themeQuartz
      .withParams({ rowHeight: 32, fontSize: 12, spacing: 4 })
      .withPart(colorSchemeDark),
  },
  parameters: {
    docs: {
      description: {
        story: 'Combined compact and dark mode for dense data display.',
      },
    },
  },
};
