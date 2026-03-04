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
    startDate: '2020-01-01',
  }));
}

export const TextFilter: Story = {
  args: {
    columnDefs: [
      { field: 'id', headerName: 'ID', width: 80 },
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
        headerName: 'Department 🔤',
        width: 180,
        filter: 'text',
        floatingFilter: true,
        headerComponentParams: { filterIcon: '🔤' },
        valueFormatter: departmentValueFormatter,
      },
      {
        field: 'role',
        headerName: 'Role 🔤',
        width: 250,
        filter: 'text',
        floatingFilter: true,
        headerComponentParams: { filterIcon: '🔤' },
        valueFormatter: roleValueFormatter,
      },
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
        headerName: 'ID',
        width: 80,
        filter: 'number',
        floatingFilter: true,
        headerComponentParams: { filterIcon: '🔢' },
      },
      { field: 'name', headerName: 'Name', width: 200 },
      {
        field: 'department',
        headerName: 'Department',
        width: 180,
        valueFormatter: departmentValueFormatter,
      },
      {
        field: 'salary',
        headerName: 'Salary 🔢',
        width: 120,
        filter: 'number',
        floatingFilter: true,
        headerComponentParams: { filterIcon: '🔢' },
      },
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
        floatingFilter: true,
        headerComponentParams: { filterIcon: '☑️' },
        valueFormatter: departmentValueFormatter,
      },
      { field: 'role', headerName: 'Role', width: 250, valueFormatter: roleValueFormatter },
      { field: 'salary', headerName: 'Salary', width: 120 },
      {
        field: 'location',
        headerName: 'Location ☑️',
        width: 150,
        filter: 'set',
        floatingFilter: true,
        headerComponentParams: { filterIcon: '☑️' },
        valueFormatter: locationValueFormatter,
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
          'Set filters on Department and Location columns. **Filter inputs visible in header**. Click the filter input to see a dropdown list of unique values with checkboxes for multi-select.',
      },
    },
  },
};

export const HiddenFloatingFilters: Story = {
  args: {
    columnDefs: [
      { field: 'id', headerName: 'ID', width: 80 },
      { field: 'name', headerName: 'Name', width: 200, filter: 'text' },
      {
        field: 'department',
        headerName: 'Department',
        width: 180,
        filter: 'text',
        valueFormatter: departmentValueFormatter,
      },
      {
        field: 'role',
        headerName: 'Role',
        width: 250,
        filter: 'text',
        valueFormatter: roleValueFormatter,
      },
      { field: 'salary', headerName: 'Salary', width: 120, filter: 'number' },
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
          'Filtering enabled but **floating filters are hidden**. Use the column header menu (3 dots) to change filter types and values.',
      },
    },
  },
};

export const AllFilterTypes: Story = {
  args: {
    columnDefs: [
      {
        field: 'id',
        headerName: 'ID',
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
        valueFormatter: departmentValueFormatter,
      },
      {
        field: 'startDate',
        headerName: 'Start Date 📅',
        width: 150,
        filter: 'date',
        floatingFilter: true,
        headerComponentParams: { filterIcon: '📅' },
      },
      {
        field: 'salary',
        headerName: 'Salary 🔢',
        width: 120,
        filter: 'number',
        floatingFilter: true,
        headerComponentParams: { filterIcon: '🔢' },
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
          '**All filter types in one grid** with floating filters enabled. Each column shows its filter type with an emoji indicator (🔤 Text, 🔢 Number, ☑️ Set, 📅 Date). Filter inputs are visible in the header row for easy access.',
      },
    },
  },
};

export const MultiFilter: Story = {
  args: {
    columnDefs: [
      { field: 'id', headerName: 'ID', width: 80 },
      {
        field: 'name',
        headerName: 'Name',
        width: 200,
        filter: 'text',
        floatingFilter: true,
      },
      {
        field: 'department',
        headerName: 'Dept (Set + Text)',
        width: 220,
        filter: ['set', 'text'],
        floatingFilter: true,
        valueFormatter: departmentValueFormatter,
      },
      {
        field: 'role',
        headerName: 'Role (Set + Text)',
        width: 220,
        filter: ['set', 'text'],
        floatingFilter: true,
        valueFormatter: roleValueFormatter,
      },
      {
        field: 'salary',
        headerName: 'Salary',
        width: 150,
        filter: 'number',
        floatingFilter: true,
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
          '**Multi-Filter Support**: Columns like Department and Role have both a **Set Filter** and a **Text Filter**. ' +
          'Users can select specific values from the dropdown AND further refine results by typing in the text input. ' +
          'Both filters must pass for a row to be displayed (AND logic).',
      },
    },
  },
};
