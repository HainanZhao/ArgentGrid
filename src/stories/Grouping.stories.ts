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

export const RowGrouping: Story = {
  args: {
    columnDefs: [
      { field: 'id', headerName: 'ID', width: 80 },
      { field: 'name', headerName: 'Name', width: 200 },
      { 
        field: 'department', 
        headerName: 'Department 📁', 
        width: 180, 
        rowGroup: true,
        headerComponentParams: { groupIcon: '📁' }
      },
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
        headerName: 'Organization 📁',
        width: 250,
        pinned: 'left',
      },
      groupDefaultExpanded: 1, // Expand first level by default
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          '**Row grouping by Department** column. Grouped columns show a 📁 icon. Click the **▶ expand/collapse arrows** in the group rows to show/hide items. **Drag column headers** to the left panel to group by multiple columns.',
      },
    },
  },
};

export const MultiLevelGrouping: Story = {
  args: {
    columnDefs: [
      { field: 'id', headerName: 'ID', width: 80 },
      { field: 'name', headerName: 'Name', width: 200 },
      { 
        field: 'department', 
        headerName: 'Department 📁', 
        width: 150, 
        rowGroup: true,
        headerComponentParams: { groupIcon: '📁' }
      },
      { 
        field: 'location', 
        headerName: 'Location 📁', 
        width: 150, 
        rowGroup: true,
        headerComponentParams: { groupIcon: '📁' }
      },
      { field: 'role', headerName: 'Role', width: 250 },
      { field: 'salary', headerName: 'Salary', width: 120 },
    ],
    rowData: generateData(100),
    height: '500px',
    width: '100%',
    theme: themeQuartz,
    gridOptions: {
      autoGroupColumnDef: {
        headerName: 'Organization 📁📁',
        width: 300,
        pinned: 'left',
      },
      groupDefaultExpanded: 2, // Expand first 2 levels by default
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          '**Multi-level grouping** by Department AND Location. Each grouped column shows a 📁 icon. Groups are **expanded by default** to show the hierarchy. Click **▶ arrows** to collapse/expand. Notice the nested structure: Department → Location → Employees.',
      },
    },
  },
};

export const GroupingWithAggregation: Story = {
  args: {
    columnDefs: [
      { field: 'id', headerName: 'ID', width: 80 },
      { field: 'name', headerName: 'Name', width: 200 },
      { 
        field: 'department', 
        headerName: 'Department 📁', 
        width: 180, 
        rowGroup: true,
        headerComponentParams: { groupIcon: '📁' }
      },
      { field: 'role', headerName: 'Role', width: 250 },
      { 
        field: 'salary', 
        headerName: 'Salary 💰', 
        width: 120,
        aggFunc: 'sum' // Show sum in group rows
      },
      { field: 'location', headerName: 'Location', width: 150 },
    ],
    rowData: generateData(100),
    height: '500px',
    width: '100%',
    theme: themeQuartz,
    gridOptions: {
      autoGroupColumnDef: {
        headerName: 'Organization 📁',
        width: 250,
        pinned: 'left',
      },
      groupDefaultExpanded: 1,
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          '**Grouping with aggregation**. Salary column shows **sum (💰)** for each department group. Look at the group rows to see aggregated values. Supported aggregations: sum, avg, min, max, count.',
      },
    },
  },
};

export const DragAndDropGrouping: Story = {
  args: {
    columnDefs: [
      { field: 'id', headerName: 'ID', width: 80 },
      { field: 'name', headerName: 'Name', width: 200 },
      { 
        field: 'department', 
        headerName: 'Department 📁 (drag me!)', 
        width: 180,
        rowGroup: false, // Not pre-grouped - user can drag
        headerComponentParams: { draggable: true }
      },
      { 
        field: 'location', 
        headerName: 'Location 📁 (drag me!)', 
        width: 150,
        rowGroup: false,
        headerComponentParams: { draggable: true }
      },
      { field: 'role', headerName: 'Role', width: 250 },
      { field: 'salary', headerName: 'Salary', width: 120 },
    ],
    rowData: generateData(100),
    height: '500px',
    width: '100%',
    theme: themeQuartz,
    gridOptions: {
      rowGroupPanelShow: 'always', // Always show group panel
      autoGroupColumnDef: {
        headerName: 'Groups 📁',
        width: 250,
        pinned: 'left',
      },
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          '**Drag-and-drop grouping**. See the **"Drag me!"** labels? **Drag column headers** (Department, Location) to the **"Groups" panel on the left** to create groups dynamically. Drop columns back to ungroup. Multiple columns can be grouped at once.',
      },
    },
  },
};
