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
  const locations = ['New York', 'San Francisco', 'London', 'Singapore', 'Remote'];
  const statuses = ['Active', 'On Leave', 'Remote', 'Travel'];

  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `Employee ${i + 1}`,
    department: departments[i % departments.length],
    role: roles[i % roles.length],
    salary: 50000 + i * 1000,
    salaryTrend: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((v) => (v + i * 5) % 100),
    location: locations[i % locations.length],
    performance: 60 + (i % 40),
    status: statuses[i % statuses.length],
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
    height: '400px',
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
    height: '400px',
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

export const CustomCellRenderer: Story = {
  args: {
    columnDefs: [
      { field: 'id', headerName: 'ID', width: 80 },
      { field: 'name', headerName: 'Name', width: 200 },
      { field: 'department', headerName: 'Department', width: 180 },
      {
        field: 'performance',
        headerName: 'Performance',
        width: 150,
        cellRenderer: (params: any) => {
          const value = params.value;
          const color = value >= 80 ? '#22c55e' : value >= 60 ? '#eab308' : '#ef4444';
          return `<div style="display: flex; align-items: center; gap: 8px;">
            <div style="flex: 1; height: 8px; background: #e5e7eb; border-radius: 4px; overflow: hidden;">
              <div style="width: ${value}%; height: 100%; background: ${color}; border-radius: 4px;"></div>
            </div>
            <span style="color: ${color}; font-weight: 600; min-width: 40px;">${value}%</span>
          </div>`;
        },
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
        story: 'Custom cell renderer showing performance as a progress bar with color coding.',
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
        cellRenderer: (params: any) => {
          const status = params.value;
          const colors: Record<string, { bg: string; text: string }> = {
            Active: { bg: '#dcfce7', text: '#16a34a' },
            'On Leave': { bg: '#fef3c7', text: '#d97706' },
            Remote: { bg: '#dbeafe', text: '#2563eb' },
            Travel: { bg: '#f3e8ff', text: '#9333ea' },
          };
          const { bg, text } = colors[status] || { bg: '#f3f4f6', text: '#6b7280' };
          return `<span style="padding: 4px 12px; background: ${bg}; color: ${text}; border-radius: 9999px; font-size: 12px; font-weight: 500;">${status}</span>`;
        },
      },
      { field: 'salary', headerName: 'Salary', width: 120 },
    ],
    rowData: generateStaticData(50),
    height: '400px',
    width: '100%',
    theme: themeQuartz,
  },
  parameters: {
    docs: {
      description: {
        story: 'Custom status badge cell renderer with different colors for each status type.',
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
    height: '400px',
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
