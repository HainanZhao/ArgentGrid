import { BrowserModule } from '@angular/platform-browser';
import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { ArgentGridComponent, ArgentGridModule, themeQuartz } from '../public-api';
import { STORY_LOCATIONS } from './story-utils';

interface Employee {
  id: number;
  name: string;
  department: string;
  role: string;
  salary: number;
  salaryTrend: number[];
  location: string;
  performance: number;
  status: string;
}

const meta: Meta<ArgentGridComponent<Employee>> = {
  title: 'Features/CellRenderers',
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
    salaryTrend: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((v) => (v + i * 5) % 100),
    location: locations[i % locations.length],
    // Use deterministic "semi-random" patterns based on index for stable E2E screenshots
    performance: 60 + ((i * 7) % 40),
    status: statuses[(i * 3) % statuses.length],
  }));
}

export const SparklineArea: Story = {
  args: {
    columnDefs: [
      { field: 'id', headerName: 'ID', width: 80 },
      { field: 'name', headerName: 'Name', width: 200 },
      { field: 'department', headerName: 'Department', width: 180 },
      {
        field: 'salaryTrend',
        headerName: 'Salary Trend',
        width: 200,
        cellRenderer: 'sparkline',
        sparklineOptions: {
          type: 'area',
          area: {
            fill: 'rgba(74, 222, 128, 0.2)',
            stroke: '#4ade80',
            strokeWidth: 2,
          },
        },
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
        story: 'Area sparkline showing salary trend data over time.',
      },
    },
  },
};

export const SparklineLine: Story = {
  args: {
    columnDefs: [
      { field: 'id', headerName: 'ID', width: 80 },
      { field: 'name', headerName: 'Name', width: 200 },
      { field: 'department', headerName: 'Department', width: 180 },
      {
        field: 'salaryTrend',
        headerName: 'Trend',
        width: 150,
        cellRenderer: 'sparkline',
        sparklineOptions: {
          type: 'line',
          line: {
            stroke: '#3b82f6',
            strokeWidth: 2,
          },
        },
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
        story: 'Line sparkline showing trend data.',
      },
    },
  },
};

export const SparklineBar: Story = {
  args: {
    columnDefs: [
      { field: 'id', headerName: 'ID', width: 80 },
      { field: 'name', headerName: 'Name', width: 200 },
      { field: 'department', headerName: 'Department', width: 180 },
      {
        field: 'salaryTrend',
        headerName: 'Salary Trend',
        width: 200,
        cellRenderer: 'sparkline',
        sparklineOptions: {
          type: 'bar',
          bar: {
            fill: '#6366f1',
            strokeWidth: 0,
          },
        },
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
        story: 'Bar sparkline showing salary trend data as a series of vertical bars.',
      },
    },
  },
};

export const ProgressBar: Story = {
  args: {
    columnDefs: [
      { field: 'id', headerName: 'ID', width: 80 },
      { field: 'name', headerName: 'Name', width: 200 },
      { field: 'department', headerName: 'Department', width: 180 },
      {
        field: 'performance',
        headerName: 'Performance',
        width: 180,
        progressOptions: {
          min: 0,
          max: 100,
          fill: (value: number) => (value >= 80 ? '#22c55e' : value >= 60 ? '#eab308' : '#ef4444'),
          showLabel: true,
        },
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
          'Built-in progress bar cell renderer with traffic-light color coding (green ≥ 80, yellow ≥ 60, red < 60).',
      },
    },
  },
};

export const StatusBadge: Story = {
  args: {
    columnDefs: [
      { field: 'id', headerName: 'ID', width: 80 },
      { field: 'name', headerName: 'Name', width: 200 },
      { field: 'department', headerName: 'Department', width: 180 },
      {
        field: 'status',
        headerName: 'Status',
        width: 120,
        badgeOptions: {
          colorMap: {
            Active: { fill: '#dcfce7', text: '#16a34a' },
            'On Leave': { fill: '#fef3c7', text: '#d97706' },
            Remote: { fill: '#dbeafe', text: '#2563eb' },
            Travel: { fill: '#f3e8ff', text: '#9333ea' },
          },
          defaultColors: { fill: '#f3f4f6', text: '#6b7280' },
        },
      },
      { field: 'salary', headerName: 'Salary', width: 120 },
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
          'Built-in badge cell renderer with per-value color mapping (green = Active, yellow = On Leave, blue = Remote, purple = Travel).',
      },
    },
  },
};

export const ButtonCell: Story = {
  args: {
    columnDefs: [
      { field: 'id', headerName: 'ID', width: 80 },
      { field: 'name', headerName: 'Name', width: 200 },
      { field: 'department', headerName: 'Department', width: 180 },
      {
        field: 'status',
        headerName: 'Action',
        width: 140,
        buttonOptions: {
          label: 'View Details',
          variant: 'primary',
          onClick: (params: any) => {
            alert(`Clicked row ${params.node.rowIndex}: ${params.data.name}`);
          },
        },
      },
      {
        field: 'status',
        headerName: 'Delete',
        width: 120,
        buttonOptions: {
          label: 'Remove',
          variant: 'danger',
          onClick: (params: any) => {
            alert(`Delete ${params.data.name}?`);
          },
        },
      },
      {
        field: 'status',
        headerName: 'Export',
        width: 120,
        buttonOptions: {
          label: 'Export',
          variant: 'secondary',
          onClick: (params: any) => {
            alert(`Export ${params.data.name}`);
          },
        },
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
          'Built-in button cell renderer with `primary`, `danger`, and `secondary` variants. `onClick` receives AG Grid-compatible params: `{ value, data, node, api, colDef, event }`.',
      },
    },
  },
};

export const CurrencyFormatter: Story = {
  args: {
    columnDefs: [
      { field: 'id', headerName: 'ID', width: 80 },
      { field: 'name', headerName: 'Name', width: 200 },
      { field: 'department', headerName: 'Department', width: 180 },
      {
        field: 'salary',
        headerName: 'Salary',
        width: 130,
        valueFormatter: (params: any) => (params.value ? `$${params.value.toLocaleString()}` : ''),
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
        story: 'Currency formatter showing salary with dollar sign and comma separators.',
      },
    },
  },
};

export const CheckboxRenderer: Story = {
  args: {
    columnDefs: [
      { field: 'id', headerName: 'ID', width: 80 },
      { field: 'name', headerName: 'Name', width: 200 },
      {
        field: 'performance',
        headerName: 'High Perf?',
        width: 120,
        cellRenderer: 'checkbox',
        // Example: boolean logic for checkbox
        valueGetter: (params: any) => params.data.performance >= 80,
      },
      {
        field: 'status',
        headerName: 'Remote?',
        width: 120,
        cellRenderer: 'checkbox',
        valueGetter: (params: any) => params.data.status === 'Remote',
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
          'Dedicated **checkbox cell renderer**. Renders a boolean value as a centered checkbox. ' +
          'Can be used with `valueGetter` to derive boolean state from complex data.',
      },
    },
  },
};

export const RatingRenderer: Story = {
  args: {
    columnDefs: [
      { field: 'id', headerName: 'ID', width: 80 },
      { field: 'name', headerName: 'Name', width: 200 },
      {
        field: 'performance',
        headerName: 'Performance',
        width: 150,
        cellRenderer: 'rating',
        // Scale 60-100 to 0-5 stars
        valueGetter: (params: any) => (params.data.performance - 60) / 8,
        ratingOptions: {
          color: '#ffb400',
          size: 16,
        },
      },
      {
        field: 'performance',
        headerName: 'Stars (Small)',
        width: 120,
        cellRenderer: 'rating',
        valueGetter: (params: any) => (params.data.performance - 60) / 8,
        ratingOptions: {
          color: '#3b82f6',
          size: 10,
          max: 5,
        },
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
          '**Rating cell renderer** using SVG-style star shapes on Canvas. ' +
          'Supports custom colors, sizes, and max star count. ' +
          'Great for visualising scores or feedback.',
      },
    },
  },
};
