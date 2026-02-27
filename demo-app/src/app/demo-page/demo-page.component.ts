import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ArgentGridModule } from '../../../../src/lib/argent-grid.module';
import { GridApi, ColDef, IRowNode } from '../../../../src/lib/types/ag-grid-types';

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

@Component({
  selector: 'app-demo-page',
  standalone: true,
  imports: [CommonModule, ArgentGridModule],
  templateUrl: './demo-page.component.html',
  styleUrls: ['./demo-page.component.css'],
})
export class DemoPageComponent implements OnInit, AfterViewInit, OnDestroy {
  rowData: Employee[] = [];
  renderTime = 0;
  fps = 0;
  isLoading = false;
  rowCount = 100000;

  columnDefs: ColDef<Employee>[] = [
    { field: 'id', headerName: 'ID', width: 80, sortable: true },
    { field: 'name', headerName: 'Name', width: 200, sortable: true },
    { field: 'department', headerName: 'Department', width: 180, sortable: true, filter: true },
    { field: 'role', headerName: 'Role', width: 250 },
    {
      field: 'salary',
      headerName: 'Salary',
      width: 120,
      sortable: true,
      valueFormatter: (params: any) => `$${params.value?.toLocaleString()}`,
    },
    { field: 'location', headerName: 'Location', width: 150 },
    { field: 'startDate', headerName: 'Start Date', width: 130 },
    {
      field: 'performance',
      headerName: 'Performance',
      width: 120,
      cellRenderer: (params: any) => {
        const value = params.value;
        const color = value >= 80 ? '#22c55e' : value >= 60 ? '#eab308' : '#ef4444';
        return `<span style="color: ${color}; font-weight: bold; padding: 4px 8px; background: ${color}20; border-radius: 4px;">${value}%</span>`;
      },
    },
  ];

  private gridApi?: GridApi<Employee>;
  private fpsInterval?: number;
  private lastFrameTime = 0;

  ngOnInit(): void {
    this.loadData(100000);
    this.startFPSCounter();
  }

  ngAfterViewInit(): void {
    // Grid is ready after view init
  }

  startFPSCounter(): void {
    const countFPS = () => {
      const now = performance.now();
      if (this.lastFrameTime) {
        const delta = now - this.lastFrameTime;
        this.fps = Math.round(1000 / delta);
      }
      this.lastFrameTime = now;
      this.fpsInterval = requestAnimationFrame(countFPS);
    };
    this.fpsInterval = requestAnimationFrame(countFPS);
  }

  loadData(count: number): void {
    this.isLoading = true;
    const startTime = performance.now();

    const departments = ['Engineering', 'Sales', 'Marketing', 'HR', 'Finance', 'Operations', 'Support', 'Product'];
    const roles = [
      'Software Engineer', 'Senior Engineer', 'Staff Engineer', 'Principal Engineer',
      'Engineering Manager', 'Sales Rep', 'Account Executive', 'Marketing Manager',
      'HR Specialist', 'Financial Analyst', 'Operations Manager', 'Support Specialist',
      'Product Manager', 'Senior PM', 'Director',
    ];
    const locations = ['New York', 'San Francisco', 'London', 'Singapore', 'Tokyo', 'Berlin', 'Remote'];

    const data: Employee[] = [];

    for (let i = 0; i < count; i++) {
      const dept = departments[Math.floor(Math.random() * departments.length)];
      const role = roles[Math.floor(Math.random() * roles.length)];
      const location = locations[Math.floor(Math.random() * locations.length)];

      data.push({
        id: i + 1,
        name: `Employee ${i + 1}`,
        department: dept,
        role: `${dept} - ${role}`,
        salary: Math.floor(Math.random() * 150000) + 50000,
        location,
        startDate: new Date(Date.now() - Math.random() * 5 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        performance: Math.floor(Math.random() * 40) + 60,
      });
    }

    setTimeout(() => {
      this.rowData = data;
      const endTime = performance.now();
      this.renderTime = Math.round(endTime - startTime);
      this.rowCount = count;
      this.isLoading = false;

      console.log(`Loaded ${count} rows in ${this.renderTime}ms`);
    }, 100);
  }

  onGridReady(api: GridApi<Employee>): void {
    this.gridApi = api;
    console.log('Grid ready:', api);
  }

  onRowClicked(event: { data: Employee; node: IRowNode<Employee> }): void {
    console.log('Row clicked:', event.data);
  }

  ngOnDestroy(): void {
    if (this.fpsInterval) {
      cancelAnimationFrame(this.fpsInterval);
    }
  }
}
