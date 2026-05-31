import { BrowserModule } from '@angular/platform-browser';
import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { ArgentGridComponent, ArgentGridModule, themeQuartz } from '../public-api';
import { StatusCellRendererComponent } from './custom-cell-renderer.component';
import { STORY_LOCATIONS } from './story-utils';

interface Employee {
  id: number;
  name: string;
  department: string;
  role: string;
  salary: number;
  location: string;
  status: string;
}

function generateStaticData(count: number): Employee[] {
  const departments = ['Engineering', 'Sales', 'Marketing', 'HR', 'Finance'];
  const roles = ['Engineer', 'Manager', 'Director', 'VP', 'Intern'];
  const locations = STORY_LOCATIONS;
  const statuses = ['Active', 'On Leave', 'Remote', 'Travel'];

  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `Employee ${i + 1}`,
    department: departments[i % departments.length],
    role: roles[i % roles.length],
    salary: 50000 + i * 1000,
    location: locations[i % locations.length],
    status: statuses[(i * 3) % statuses.length],
  }));
}

const meta: Meta<ArgentGridComponent<Employee>> = {
  title: 'Features/CustomCellRenderer',
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

export const AngularStatusBadge: Story = {
  args: {
    columnDefs: [
      { field: 'id', headerName: 'ID', width: 80 },
      { field: 'name', headerName: 'Name', width: 200 },
      { field: 'department', headerName: 'Department', width: 180 },
      {
        field: 'status',
        headerName: 'Status (Custom)',
        width: 150,
        cellRenderer: StatusCellRendererComponent,
      },
      { field: 'location', headerName: 'Location', width: 150 },
      { field: 'salary', headerName: 'Salary', width: 120 },
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
          'Custom Angular component rendered as a DOM overlay on top of the Canvas viewport. ' +
          'The `cellRenderer` property is set to an Angular component class that implements `ICellRendererAngularComp`. ' +
          'This enables full Angular template syntax, dependency injection, and styling while keeping the Canvas fast path for other columns.',
      },
    },
  },
};

export const MixedRenderers: Story = {
  args: {
    columnDefs: [
      { field: 'id', headerName: 'ID', width: 80 },
      { field: 'name', headerName: 'Name', width: 180 },
      {
        field: 'status',
        headerName: 'Status (DOM)',
        width: 150,
        cellRenderer: StatusCellRendererComponent,
      },
      {
        field: 'department',
        headerName: 'Department',
        width: 150,
        badgeOptions: {
          colorMap: {
            Engineering: { fill: '#dbeafe', text: '#2563eb' },
            Sales: { fill: '#dcfce7', text: '#16a34a' },
            Marketing: { fill: '#fef3c7', text: '#d97706' },
            HR: { fill: '#f3e8ff', text: '#9333ea' },
            Finance: { fill: '#ffe4e6', text: '#e11d48' },
          },
          defaultColors: { fill: '#f3f4f6', text: '#6b7280' },
        },
      },
      {
        field: 'salary',
        headerName: 'Salary',
        width: 120,
        valueFormatter: (params: any) => (params.value ? `$${params.value.toLocaleString()}` : ''),
      },
    ],
    rowData: generateStaticData(200),
    height: 'calc(100vh - 60px)',
    width: '100%',
    theme: themeQuartz,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Mix of Canvas-native renderers (badge, valueFormatter) and custom DOM overlay renderer (Status column). ' +
          'The grid uses Canvas for fast columns and DOM overlays only for the custom component column.',
      },
    },
  },
};
