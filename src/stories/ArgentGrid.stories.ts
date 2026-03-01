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
  const departments = ['Engineering', 'Sales', 'Marketing', 'HR', 'Finance'];
  const roles = ['Engineer', 'Manager', 'Director', 'VP', 'Intern'];
  const locations = ['New York', 'San Francisco', 'London', 'Singapore', 'Remote'];

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
      { field: 'department', headerName: 'Department', width: 180 },
      { field: 'role', headerName: 'Role', width: 250 },
      { field: 'salary', headerName: 'Salary', width: 120 },
      { field: 'location', headerName: 'Location', width: 150 },
      { field: 'startDate', headerName: 'Start Date', width: 130 },
      { field: 'performance', headerName: 'Performance', width: 120 },
    ],
    rowData: generateStaticData(100),
    height: '500px',
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
      { field: 'department', headerName: 'Department', width: 180 },
      { field: 'role', headerName: 'Role', width: 250 },
      { field: 'salary', headerName: 'Salary', width: 120 },
    ],
    rowData: generateStaticData(100000),
    height: '500px',
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
        headerName: 'ID ↕️',
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
    height: '400px',
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
      {
        field: 'id',
        headerName: 'ID ☑️',
        width: 80,
        checkboxSelection: true,
        headerComponentParams: { selectionIcon: '☑️' },
      },
      { field: 'name', headerName: 'Name', width: 200 },
      { field: 'department', headerName: 'Department', width: 180 },
      { field: 'role', headerName: 'Role', width: 250 },
    ],
    rowData: generateStaticData(50),
    rowSelection: 'multiple',
    height: '400px',
    width: '100%',
    theme: themeQuartz,
  },
  parameters: {
    docs: {
      description: {
        story:
          '**Row selection with checkboxes**. The first column shows **☑️ checkboxes** in every row. **Click checkboxes** to select/deselect rows. **Header checkbox** selects/deselects all visible rows.',
      },
    },
  },
};

export const WithFiltering: Story = {
  args: {
    columnDefs: [
      {
        field: 'id',
        headerName: 'ID 🔢',
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
      },
      {
        field: 'role',
        headerName: 'Role 🔤',
        width: 250,
        filter: 'text',
        floatingFilter: true,
        headerComponentParams: { filterIcon: '🔤' },
      },
    ],
    rowData: generateStaticData(50),
    height: '500px',
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
    height: '300px',
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
    height: '400px',
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
