import { BrowserModule } from '@angular/platform-browser';
import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { ArgentGridComponent, ArgentGridModule, themeQuartz } from '../public-api';
import {
  departmentValueFormatter,
  locationValueFormatter,
  roleValueFormatter,
  STORY_DEPARTMENTS,
  STORY_LOCATIONS,
  STORY_ROLES,
} from './story-utils';

interface Employee {
  id: number;
  name: string;
  department: string;
  role: string;
  salary: number;
  location: string;
  performance: number;
}

const meta: Meta<ArgentGridComponent<Employee>> = {
  title: 'Features/Advanced',
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
  const departments = STORY_DEPARTMENTS;
  const roles = STORY_ROLES;
  const locations = STORY_LOCATIONS;

  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `Employee ${i + 1}`,
    department: departments[i % departments.length],
    role: roles[i % roles.length],
    salary: 50000 + i * 1000,
    location: locations[i % locations.length],
    performance: 80,
  }));
}

export const SideBar: Story = {
  args: {
    columnDefs: [
      { field: 'id', headerName: 'ID', width: 80, filter: true },
      { field: 'name', headerName: 'Name', width: 200, filter: true },
      {
        field: 'department',
        headerName: 'Department',
        width: 180,
        filter: 'set',
        valueFormatter: departmentValueFormatter,
      },
      {
        field: 'role',
        headerName: 'Role',
        width: 250,
        filter: true,
        valueFormatter: roleValueFormatter,
      },
      { field: 'salary', headerName: 'Salary', width: 120, filter: 'number' },
      {
        field: 'location',
        headerName: 'Location',
        width: 150,
        filter: 'set',
        valueFormatter: locationValueFormatter,
      },
      { field: 'performance', headerName: 'Performance', width: 120, filter: 'number' },
    ],
    rowData: generateStaticData(50),
    height: 'calc(100vh - 60px)',
    width: '100%',
    theme: themeQuartz,
    gridOptions: {
      sideBar: {
        toolPanels: [
          {
            id: 'columns',
            labelDefault: 'Columns',
            labelKey: 'columns',
            iconKey: 'columns',
            toolPanel: 'agColumnsToolPanel',
          },
          {
            id: 'filters',
            labelDefault: 'Filters',
            labelKey: 'filters',
            iconKey: 'filter',
            toolPanel: 'agFiltersToolPanel',
          },
        ],
      },
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Side bar with Columns and Filters panels. Click the sidebar toggle button in the grid toolbar to show/hide.',
      },
    },
  },
};

export const SideBarDefault: Story = {
  args: {
    columnDefs: [
      { field: 'id', headerName: 'ID', width: 80, filter: true },
      { field: 'name', headerName: 'Name', width: 200, filter: true },
      {
        field: 'department',
        headerName: 'Department',
        width: 180,
        filter: 'set',
        valueFormatter: departmentValueFormatter,
      },
      {
        field: 'role',
        headerName: 'Role',
        width: 250,
        filter: true,
        valueFormatter: roleValueFormatter,
      },
      { field: 'salary', headerName: 'Salary', width: 120, filter: 'number' },
    ],
    rowData: generateStaticData(50),
    height: 'calc(100vh - 60px)',
    width: '100%',
    theme: themeQuartz,
    gridOptions: {
      sideBar: true,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Side bar with default configuration (Columns and Filters tool panels).',
      },
    },
  },
};

export const RangeSelection: Story = {
  args: {
    columnDefs: [
      { field: 'id', headerName: 'ID', width: 80 },
      { field: 'name', headerName: 'Name', width: 200 },
      {
        field: 'department',
        headerName: 'Department',
        width: 180,
        valueFormatter: departmentValueFormatter,
      },
      { field: 'role', headerName: 'Role', width: 250, valueFormatter: roleValueFormatter },
      { field: 'salary', headerName: 'Salary', width: 120 },
      {
        field: 'location',
        headerName: 'Location',
        width: 150,
        valueFormatter: locationValueFormatter,
      },
    ],
    rowData: generateStaticData(50),
    height: 'calc(100vh - 60px)',
    width: '100%',
    theme: themeQuartz,
    gridOptions: {
      enableRangeSelection: true,
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Enable range selection to select multiple cells by clicking and dragging. Use Ctrl+C to copy selected range.',
      },
    },
  },
};

export const FullFeatures: Story = {
  args: {
    columnDefs: [
      { field: 'id', headerName: 'ID', width: 80, filter: true, sortable: true },
      { field: 'name', headerName: 'Name', width: 200, filter: true, sortable: true },
      {
        field: 'department',
        headerName: 'Department',
        width: 180,
        filter: 'set',
        sortable: true,
        rowGroup: true,
        valueFormatter: departmentValueFormatter,
      },
      {
        field: 'role',
        headerName: 'Role',
        width: 250,
        filter: true,
        valueFormatter: roleValueFormatter,
      },
      { field: 'salary', headerName: 'Salary', width: 120, filter: 'number', sortable: true },
      {
        field: 'location',
        headerName: 'Location',
        width: 150,
        filter: 'set',
        valueFormatter: locationValueFormatter,
      },
    ],
    rowData: generateStaticData(100),
    height: 'calc(100vh - 60px)',
    width: '100%',
    theme: themeQuartz,
    gridOptions: {
      floatingFilter: true,
      enableRangeSelection: true,
      sideBar: true,
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
          'Full-featured grid with sorting, filtering, floating filters, range selection, side bar, and row grouping.',
      },
    },
  },
};

export const ClipboardSupport: Story = {
  render: (args) => ({
    props: args,
    template: `
      <div style="display: flex; flex-direction: column; gap: 15px; height: 100%; padding: 10px; box-sizing: border-box;">
        <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; border: 1px solid #90caf9;">
          <h4 style="margin-top: 0;">Clipboard Support Instructions:</h4>
          <ul style="margin-bottom: 0;">
            <li><b>Range Copy:</b> Click and drag to select a range, then press <b>Ctrl+C</b> (or Cmd+C).</li>
            <li><b>Row Copy:</b> Click a row (or use checkboxes), then press <b>Ctrl+C</b>.</li>
            <li><b>Paste:</b> Select a cell or range, then press <b>Ctrl+V</b> to paste TSV data from Excel/Sheets.</li>
          </ul>
        </div>
        
        <div style="display: flex; gap: 15px; flex: 1; min-height: 0;">
          <div style="flex: 3; display: flex; flex-direction: column;">
            <argent-grid 
              style="flex: 1;"
              [columnDefs]="columnDefs" 
              [rowData]="rowData" 
              [height]="height" 
              [width]="width"
              [theme]="theme"
              [gridOptions]="gridOptions">
            </argent-grid>
          </div>
          
          <div style="flex: 1; display: flex; flex-direction: column; gap: 10px;">
            <label><b>Paste/External Data Area:</b></label>
            <textarea 
              placeholder="Paste from grid here, or copy from here to paste into grid (TSV format)..." 
              style="flex: 1; width: 100%; padding: 10px; font-family: monospace; font-size: 12px; border: 1px solid #ccc; border-radius: 4px; resize: none;"
            ></textarea>
            <div style="font-size: 11px; color: #666;">
              Example for pasting: <br>
              <code style="background: #eee; padding: 2px;">New Hire\tEngineering\t125000</code>
            </div>
          </div>
        </div>
      </div>
    `,
  }),
  args: {
    columnDefs: [
      { field: 'name', headerName: 'Name', width: 200, editable: true },
      {
        field: 'department',
        headerName: 'Department',
        width: 180,
        editable: true,
        valueFormatter: departmentValueFormatter,
      },
      { field: 'salary', headerName: 'Salary', width: 120, editable: true },
      {
        field: 'location',
        headerName: 'Location',
        width: 150,
        editable: true,
        valueFormatter: locationValueFormatter,
      },
    ],
    rowData: generateStaticData(20),
    height: '100%',
    width: '100%',
    theme: themeQuartz,
    gridOptions: {
      enableRangeSelection: true,
      rowSelection: 'multiple',
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          '**Enhanced Clipboard Support**: Copy ranges or rows in TSV format compatible with Excel/Google Sheets. ' +
          'Supports pasting data back into the grid, with automatic header detection and basic type conversion.',
      },
    },
  },
};
