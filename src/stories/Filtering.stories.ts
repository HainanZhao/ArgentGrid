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
  const departments = [
    'Engineering',
    'Sales',
    'Marketing',
    'HR',
    'Finance',
    'Operations',
    'Support',
  ];
  const roles = ['Software Engineer', 'Manager', 'Director', 'VP', 'Intern', 'Analyst'];
  const locations = ['New York', 'San Francisco', 'London', 'Singapore', 'Remote', 'Berlin'];

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
  }));
}

// Common column definitions with filter indicators
const filterIndicatorRenderer = (params: any) => {
  const filterType = params.colDef.filter || 'text';
  const icons: Record<string, string> = {
    text: '🔤',
    number: '🔢',
    date: '📅',
    set: '☑️',
    boolean: '✓',
  };
  return `<span style="float: right; opacity: 0.5;">${icons[filterType] || '🔍'}</span>`;
};

export const TextFilter: Story = {
  args: {
    columnDefs: [
      { field: 'id', headerName: 'ID', width: 80 },
      { 
        field: 'name', 
        headerName: 'Name 🔤', 
        width: 200, 
        filter: 'text',
        headerComponentParams: { filterIcon: '🔤' }
      },
      { 
        field: 'department', 
        headerName: 'Department 🔤', 
        width: 180, 
        filter: 'text',
        headerComponentParams: { filterIcon: '🔤' }
      },
      { 
        field: 'role', 
        headerName: 'Role 🔤', 
        width: 250, 
        filter: 'text',
        headerComponentParams: { filterIcon: '🔤' }
      },
      { field: 'salary', headerName: 'Salary', width: 120 },
      { field: 'location', headerName: 'Location', width: 150 },
    ],
    rowData: generateData(50),
    height: '500px',
    width: '100%',
    theme: themeQuartz,
    enableFloatingFilters: true, // Show filter inputs in header
  },
  parameters: {
    docs: {
      description: {
        story:
          'Text filters on Name, Department, and Role columns. **Filter inputs are visible in the header row** (floating filters). Type to filter results.',
      },
    },
  },
};

export const NumberFilter: Story = {
  args: {
    columnDefs: [
      { 
        field: 'id', 
        headerName: 'ID 🔢', 
        width: 80, 
        filter: 'number',
        headerComponentParams: { filterIcon: '🔢' }
      },
      { field: 'name', headerName: 'Name', width: 200 },
      { field: 'department', headerName: 'Department', width: 180 },
      { 
        field: 'salary', 
        headerName: 'Salary 🔢', 
        width: 120, 
        filter: 'number',
        headerComponentParams: { filterIcon: '🔢' }
      },
      { field: 'location', headerName: 'Location', width: 150 },
    ],
    rowData: generateData(50),
    height: '500px',
    width: '100%',
    theme: themeQuartz,
    enableFloatingFilters: true, // Show filter inputs in header
  },
  parameters: {
    docs: {
      description: {
        story:
          'Number filters on ID and Salary columns. **Filter inputs visible in header**. Supports equals, greater than, less than, etc. Try typing "> 100000" in Salary filter.',
      },
    },
  },
};

export const SetFilter: Story = {
  args: {
    columnDefs: [
      { field: 'id', headerName: 'ID', width: 80 },
      { field: 'name', headerName: 'Name', width: 200 },
      { 
        field: 'department', 
        headerName: 'Department ☑️', 
        width: 180, 
        filter: 'set',
        headerComponentParams: { filterIcon: '☑️' }
      },
      { field: 'role', headerName: 'Role', width: 250 },
      { field: 'salary', headerName: 'Salary', width: 120 },
      { 
        field: 'location', 
        headerName: 'Location ☑️', 
        width: 150, 
        filter: 'set',
        headerComponentParams: { filterIcon: '☑️' }
      },
    ],
    rowData: generateData(50),
    height: '500px',
    width: '100%',
    theme: themeQuartz,
    enableFloatingFilters: true, // Show filter inputs in header
  },
  parameters: {
    docs: {
      description: {
        story:
          'Set filters on Department and Location columns. **Filter inputs visible in header**. Click the filter input to see a dropdown list of unique values with checkboxes for multi-select.',
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
      { 
        field: 'startDate', 
        headerName: 'Start Date 📅', 
        width: 150, 
        filter: 'date',
        headerComponentParams: { filterIcon: '📅' }
      },
      { field: 'salary', headerName: 'Salary', width: 120 },
    ],
    rowData: generateData(50),
    height: '500px',
    width: '100%',
    theme: themeQuartz,
    enableFloatingFilters: true, // Show filter inputs in header
  },
  parameters: {
    docs: {
      description: {
        story:
          'Date filter on Start Date column. **Filter input visible in header**. Click the filter input to open a date picker. Supports date range selection.',
      },
    },
  },
};

export const AllFilterTypes: Story = {
  args: {
    columnDefs: [
      { 
        field: 'id', 
        headerName: 'ID 🔢', 
        width: 80, 
        filter: 'number',
        headerComponentParams: { filterIcon: '🔢' }
      },
      { 
        field: 'name', 
        headerName: 'Name 🔤', 
        width: 200, 
        filter: 'text',
        headerComponentParams: { filterIcon: '🔤' }
      },
      { 
        field: 'department', 
        headerName: 'Department ☑️', 
        width: 180, 
        filter: 'set',
        headerComponentParams: { filterIcon: '☑️' }
      },
      { 
        field: 'startDate', 
        headerName: 'Start Date 📅', 
        width: 150, 
        filter: 'date',
        headerComponentParams: { filterIcon: '📅' }
      },
      { 
        field: 'salary', 
        headerName: 'Salary 🔢', 
        width: 120, 
        filter: 'number',
        headerComponentParams: { filterIcon: '🔢' }
      },
    ],
    rowData: generateData(50),
    height: '500px',
    width: '100%',
    theme: themeQuartz,
    enableFloatingFilters: true, // Show ALL filter inputs in header
  },
  parameters: {
    docs: {
      description: {
        story:
          '**All filter types in one grid** with floating filters enabled. Each column shows its filter type with an emoji indicator (🔤 Text, 🔢 Number, ☑️ Set, 📅 Date). Filter inputs are visible in the header row for easy access.',
      },
    },
  },
};
