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
  email: string;
  phone: string;
  startDate: string;
  performance: number;
  skills: string;
  bio: string;
  manager: string;
  projects: number;
  vacationDays: number;
}

const meta: Meta<ArgentGridComponent<Employee>> = {
  title: 'Features/Tooltips',
  component: ArgentGridComponent,
  decorators: [
    moduleMetadata({
      imports: [ArgentGridModule, BrowserModule],
    }),
  ],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '**Cell Tooltips** — AG Grid-compatible `tooltipField` and `tooltipValueGetter` APIs. ' +
          'Hover over a cell for 500ms to reveal the tooltip overlay.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<ArgentGridComponent<Employee>>;

const departments = STORY_DEPARTMENTS;
const roles = STORY_ROLES;
const locations = STORY_LOCATIONS;
const skills: Record<string, string> = {
  Engineering: 'TypeScript, Angular, RxJS, Canvas API, WebGL',
  Sales: 'CRM, Negotiation, Salesforce, Pipeline Management',
  Marketing: 'SEO, Content Strategy, Google Analytics, A/B Testing',
  HR: 'Recruiting, HRIS, Onboarding, Conflict Resolution',
  Finance: 'Excel, SQL, Financial Modeling, SAP',
  Design: 'Figma, Sketch, CSS, User Research, Prototyping',
};
const managers: Record<string, string> = {
  Engineering: 'Alice Chen',
  Sales: 'Bob Martinez',
  Marketing: 'Carol White',
  HR: 'David Park',
  Finance: 'Eve Johnson',
  Design: 'Frank Lee',
};

function generateData(count: number): Employee[] {
  return Array.from({ length: count }, (_, i) => {
    const dept = departments[i % departments.length];
    const role = roles[i % roles.length];
    const location = locations[i % locations.length];
    return {
      id: i + 1,
      name: `Employee ${i + 1}`,
      department: dept,
      role,
      salary: 50000 + (i % 10) * 8000 + departments.indexOf(dept) * 5000,
      location,
      email: `employee${i + 1}@company.com`,
      phone: `+1-555-${String(1000 + i).slice(1)}-${String(5000 + i).slice(1)}`,
      startDate: `202${i % 5}-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
      performance: 60 + (i % 41),
      skills: skills[dept],
      bio: `${role} in ${dept} based in ${location}. ${i % 2 === 0 ? 'Team lead for Q4 initiative.' : 'Contributing to cross-functional projects.'}`,
      manager: managers[dept],
      projects: 1 + (i % 8),
      vacationDays: 10 + (i % 16),
    };
  });
}

const sampleData = generateData(50);

// ─── Story 1: tooltipField ────────────────────────────────────────────────────

export const TooltipField: Story = {
  args: {
    columnDefs: [
      { field: 'id', headerName: 'ID', width: 70 },
      {
        field: 'name',
        headerName: 'Name',
        width: 180,
        tooltipField: 'bio',
      },
      {
        field: 'department',
        headerName: 'Department',
        width: 160,
        tooltipField: 'skills',
        valueFormatter: departmentValueFormatter,
      },
      {
        field: 'role',
        headerName: 'Role',
        width: 140,
        tooltipField: 'manager',
        valueFormatter: roleValueFormatter,
      },
      {
        field: 'salary',
        headerName: 'Salary',
        width: 110,
        tooltipField: 'salary',
      },
      {
        field: 'location',
        headerName: 'Location',
        width: 150,
        tooltipField: 'email',
        valueFormatter: locationValueFormatter,
      },
    ],
    rowData: sampleData,
    height: 'calc(100vh - 60px)',
    width: '100%',
    theme: themeQuartz,
  },
  parameters: {
    docs: {
      description: {
        story:
          '**`tooltipField`** — the simplest tooltip API. Specify any field name and ' +
          'its value will appear as the tooltip when hovering over cells in that column. ' +
          'Hover over **Name** to see the employee bio, **Department** to see their skill set, ' +
          "or **Role** to see their manager's name.",
      },
    },
  },
};

// ─── Story 2: tooltipValueGetter ─────────────────────────────────────────────

export const TooltipValueGetter: Story = {
  args: {
    columnDefs: [
      { field: 'id', headerName: 'ID', width: 70 },
      {
        field: 'name',
        headerName: 'Name',
        width: 180,
        tooltipValueGetter: ({ data }: { data: Employee }) =>
          [
            `👤 ${data.name}`,
            `📧 ${data.email}`,
            `📞 ${data.phone}`,
            `🏢 Reports to: ${data.manager}`,
          ].join('\n'),
      },
      {
        field: 'department',
        headerName: 'Department',
        width: 160,
        tooltipValueGetter: ({ data }: { data: Employee }) =>
          `🏷 Department: ${data.department}\n🔧 Skills: ${data.skills}`,
        valueFormatter: departmentValueFormatter,
      },
      {
        field: 'salary',
        headerName: 'Salary',
        width: 110,
        tooltipValueGetter: ({ value, data }: { value: number; data: Employee }) => {
          const annual = value;
          const monthly = Math.round(annual / 12).toLocaleString();
          const daily = Math.round(annual / 260).toLocaleString();
          return `💰 Annual:  $${annual.toLocaleString()}\n📆 Monthly: $${monthly}\n📅 Daily:   $${daily}`;
        },
      },
      {
        field: 'performance',
        headerName: 'Performance',
        width: 130,
        tooltipValueGetter: ({ value, data }: { value: number; data: Employee }) => {
          const stars = '★'.repeat(Math.round(value / 20)) + '☆'.repeat(5 - Math.round(value / 20));
          const label =
            value >= 90
              ? 'Exceptional'
              : value >= 75
                ? 'Strong'
                : value >= 60
                  ? 'Meets Expectations'
                  : 'Needs Improvement';
          return `${stars}\n${value}/100 — ${label}\nProjects active: ${data.projects}`;
        },
      },
      {
        field: 'startDate',
        headerName: 'Start Date',
        width: 130,
        tooltipValueGetter: ({ value, data }: { value: string; data: Employee }) => {
          const start = new Date(value);
          const now = new Date();
          const months =
            (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
          const years = Math.floor(months / 12);
          const rem = months % 12;
          const tenure = years > 0 ? `${years}y ${rem}m` : `${rem} months`;
          return `📅 Joined: ${value}\n⏱  Tenure: ${tenure}\n🏖  Vacation days: ${data.vacationDays}`;
        },
      },
    ],
    rowData: sampleData,
    height: 'calc(100vh - 60px)',
    width: '100%',
    theme: themeQuartz,
  },
  parameters: {
    docs: {
      description: {
        story:
          '**`tooltipValueGetter`** — full control over tooltip content via a function. ' +
          'Receives `{ value, data, node, column }` and returns a string (newlines supported). ' +
          'Hover over **Name** for contact details, **Salary** for a pay breakdown, ' +
          '**Performance** for a star-rating, or **Start Date** for tenure info.',
      },
    },
  },
};

// ─── Story 3: Mixed (both APIs together) ─────────────────────────────────────

export const MixedTooltips: Story = {
  args: {
    columnDefs: [
      { field: 'id', headerName: 'ID', width: 70 },
      {
        field: 'name',
        headerName: 'Name',
        width: 180,
        // tooltipValueGetter takes priority over tooltipField
        tooltipField: 'bio',
        tooltipValueGetter: ({ data }: { data: Employee }) =>
          `👤 ${data.name}\n📧 ${data.email}\n📞 ${data.phone}`,
      },
      {
        field: 'department',
        headerName: 'Department',
        width: 160,
        // plain tooltipField
        tooltipField: 'skills',
        valueFormatter: departmentValueFormatter,
      },
      {
        field: 'salary',
        headerName: 'Salary',
        width: 110,
        tooltipValueGetter: ({ value }: { value: number }) =>
          `Monthly: $${Math.round(value / 12).toLocaleString()}`,
      },
      {
        field: 'performance',
        headerName: 'Performance',
        width: 130,
        // no tooltip — hovering shows nothing
      },
      {
        field: 'location',
        headerName: 'Location',
        width: 150,
        tooltipField: 'email',
        valueFormatter: locationValueFormatter,
      },
      {
        field: 'startDate',
        headerName: 'Start Date',
        width: 130,
        tooltipField: 'manager',
      },
    ],
    rowData: sampleData,
    height: 'calc(100vh - 60px)',
    width: '100%',
    theme: themeQuartz,
  },
  parameters: {
    docs: {
      description: {
        story:
          '**Mixed usage** — some columns use `tooltipField`, some use `tooltipValueGetter`, ' +
          'and some have no tooltip at all. When both are set on the same column, ' +
          '`tooltipValueGetter` takes priority (see **Name** column). ' +
          '**Performance** intentionally has no tooltip.',
      },
    },
  },
};

// ─── Story 4: Long / multi-line content ──────────────────────────────────────

export const LongTooltips: Story = {
  args: {
    columnDefs: [
      { field: 'id', headerName: 'ID', width: 70 },
      {
        field: 'name',
        headerName: 'Name',
        width: 180,
        tooltipValueGetter: ({ data }: { data: Employee }) =>
          [
            `Employee Profile`,
            `─────────────────────`,
            `Name:       ${data.name}`,
            `Role:       ${data.role}`,
            `Dept:       ${data.department}`,
            `Location:   ${data.location}`,
            `Manager:    ${data.manager}`,
            `Email:      ${data.email}`,
            `Phone:      ${data.phone}`,
            `Start Date: ${data.startDate}`,
            `Projects:   ${data.projects}`,
            `Salary:     $${data.salary.toLocaleString()}`,
            `Performance:${data.performance}/100`,
            `─────────────────────`,
            data.bio,
          ].join('\n'),
      },
      {
        field: 'department',
        headerName: 'Department',
        width: 160,
        tooltipValueGetter: ({ data }: { data: Employee }) =>
          `Skills required for ${data.department}:\n\n${data.skills
            .split(', ')
            .map((s) => `  • ${s}`)
            .join('\n')}`,
        valueFormatter: departmentValueFormatter,
      },
      { field: 'role', headerName: 'Role', width: 140, valueFormatter: roleValueFormatter },
      { field: 'salary', headerName: 'Salary', width: 110 },
      { field: 'performance', headerName: 'Perf', width: 80 },
      {
        field: 'location',
        headerName: 'Location',
        width: 150,
        valueFormatter: locationValueFormatter,
      },
    ],
    rowData: sampleData,
    height: 'calc(100vh - 60px)',
    width: '100%',
    theme: themeQuartz,
  },
  parameters: {
    docs: {
      description: {
        story:
          '**Multi-line / long tooltips** — hover over **Name** for a full employee profile card, ' +
          'or **Department** for a bulleted skills list. The tooltip supports `\\n` newlines and ' +
          'is capped at `max-width: 300px` with `white-space: pre-wrap`.',
      },
    },
  },
};
