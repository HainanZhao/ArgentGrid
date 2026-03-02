import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, Input, OnDestroy, ViewChild } from '@angular/core';
import { ArgentGridComponent, ArgentGridModule, ColDef, GridApi, themeQuartz } from '../public-api';
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
}

@Component({
  selector: 'app-benchmark-wrapper',
  standalone: true,
  imports: [CommonModule, ArgentGridModule],
  template: `
    <div class="benchmark-container">
      <div class="controls">
        <button (click)="runBenchmark()" [disabled]="isRunning">
          {{ isRunning ? 'Running...' : 'Run Benchmark' }}
        </button>
        <button (click)="reloadData()">Reload Data</button>
        <span class="row-count">{{ rowCount | number }} rows</span>
      </div>

      <div class="benchmark-info">
        <strong>What does this benchmark measure?</strong>
        <ul>
          <li><b>Initial Render</b> — time to paint the first visible frame of the grid</li>
          <li><b>Selection Update</b> — time to select and deselect all {{ rowCount | number }} rows</li>
          <li><b>Grouping Toggle</b> — time to enable then revert row grouping on the Department column</li>
          <li><b>Avg Scroll Frame</b> — average canvas render time across 30 scroll frames (100 px each)</li>
          <li><b>Total</b> — total wall-clock time for the entire benchmark run</li>
        </ul>
      </div>

      <div class="results" *ngIf="results">
        <div class="result-item" title="Time to paint the first visible frame of the grid">
          <span class="label">Initial Render:</span>
          <span class="value">{{ results.initialRender }}ms</span>
        </div>
        <div class="result-item" title="Time to select and deselect all rows">
          <span class="label">Selection Update:</span>
          <span class="value">{{ results.selectionUpdateTime }}ms</span>
        </div>
        <div class="result-item" title="Time to toggle row grouping on the Department column">
          <span class="label">Grouping Toggle:</span>
          <span class="value">{{ results.groupingUpdateTime }}ms</span>
        </div>
        <div class="result-item" title="Average canvas render time per scroll frame (30 frames, 100px each)">
          <span class="label">Avg Scroll Frame:</span>
          <span class="value">{{ results.scrollFrameAverage }}ms</span>
        </div>
        <div class="result-item total" title="Total wall-clock time for the full benchmark run">
          <span class="label">Total:</span>
          <span class="value">{{ results.totalTime }}ms</span>
        </div>
      </div>

      <argent-grid
        #grid
        [columnDefs]="columnDefs"
        [rowData]="rowData"
        [height]="height"
        [width]="width"
        [theme]="theme"
        [gridOptions]="gridOptions"
        (gridReady)="onGridReady($event)"
      />
    </div>
  `,
  styles: [
    `
    .benchmark-container {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .controls {
      display: flex;
      gap: 8px;
      align-items: center;
    }
    .controls button {
      padding: 8px 16px;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    }
    .controls button:disabled {
      background: #9ca3af;
      cursor: not-allowed;
    }
    .controls button:hover:not(:disabled) {
      background: #2563eb;
    }
    .row-count {
      margin-left: auto;
      font-size: 14px;
      color: #6b7280;
    }
    .results {
      display: flex;
      gap: 16px;
      padding: 12px;
      background: #f9fafb;
      border-radius: 4px;
      flex-wrap: wrap;
    }
    .result-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .result-item .label {
      font-size: 12px;
      color: #6b7280;
    }
    .result-item .value {
      font-size: 18px;
      font-weight: 600;
      color: #111827;
    }
    .result-item.total .value {
      color: #059669;
    }
    .benchmark-info {
      padding: 10px 14px;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 4px;
      font-size: 13px;
      color: #1e40af;
    }
    .benchmark-info strong {
      display: block;
      margin-bottom: 6px;
    }
    .benchmark-info ul {
      margin: 0;
      padding-left: 18px;
    }
    .benchmark-info li {
      margin-bottom: 3px;
    }
  `,
  ],
})
export class BenchmarkWrapperComponent implements AfterViewInit, OnDestroy {
  @ViewChild('grid') gridComponent!: ArgentGridComponent;

  @Input() rowCount = 100000;

  columnDefs: ColDef<Employee>[] = [
    { field: 'id', headerName: 'ID', width: 80, sortable: true },
    { field: 'name', headerName: 'Name', width: 200, sortable: true },
    {
      field: 'department',
      headerName: 'Department',
      width: 180,
      sortable: true,
      valueFormatter: departmentValueFormatter,
    },
    {
      field: 'role',
      headerName: 'Role',
      width: 250,
      filter: true,
      valueFormatter: roleValueFormatter,
    },
    { field: 'salary', headerName: 'Salary', width: 120, sortable: true, filter: 'number' },
    {
      field: 'location',
      headerName: 'Location',
      width: 150,
      filter: true,
      valueFormatter: locationValueFormatter,
    },
  ];

  rowData: Employee[] = [];
  height = 'calc(100vh - 60px)';
  width = '100%';
  theme = themeQuartz;

  gridOptions = {
    floatingFilter: true,
    enableRangeSelection: true,
    defaultColDef: {
      filter: true,
      sortable: true,
      resizable: true,
    },
  };

  private gridApi?: GridApi<Employee>;
  private fpsInterval?: number;

  isRunning = false;
  results: {
    initialRender: number;
    selectionUpdateTime: number;
    groupingUpdateTime: number;
    scrollFrameAverage: number;
    totalTime: number;
  } | null = null;

  ngAfterViewInit(): void {
    this.reloadData();
  }

  generateData(count: number): Employee[] {
    const departments = STORY_DEPARTMENTS;
    const roles = STORY_ROLES;
    const locations = STORY_LOCATIONS;

    return Array.from({ length: count }, (_, i) => ({
      id: i + 1,
      name: `Employee ${i + 1}`,
      department: departments[Math.floor(Math.random() * departments.length)],
      role: roles[Math.floor(Math.random() * roles.length)],
      salary: Math.floor(Math.random() * 150000) + 50000,
      location: locations[Math.floor(Math.random() * locations.length)],
    }));
  }

  reloadData(): void {
    this.rowData = this.generateData(this.rowCount);
    this.results = null;
  }

  onGridReady(api: GridApi<Employee>): void {
    this.gridApi = api;
  }

  runBenchmark(): void {
    if (!this.gridApi || !this.gridComponent || this.isRunning) return;

    this.isRunning = true;
    this.results = null;

    const results = {
      initialRender: 0,
      selectionUpdateTime: 0,
      groupingUpdateTime: 0,
      scrollFrameAverage: 0,
      totalTime: 0,
    };

    const startTime = performance.now();

    // 1. Initial render time
    results.initialRender = this.gridComponent.getLastFrameTime();

    // 2. Selection Update Time
    const selStart = performance.now();
    this.gridApi.selectAll();
    setTimeout(() => {
      results.selectionUpdateTime = Number((performance.now() - selStart).toFixed(2));
      this.gridApi?.deselectAll();

      // 3. Grouping Toggle Time
      const groupStart = performance.now();
      const colDefs = this.gridApi.getColumnDefs() as ColDef<Employee>[];
      const deptCol = colDefs.find((c) => c.field === 'department');
      const wasGrouped = (deptCol as ColDef<Employee>)?.rowGroup;

      const newColDefs = colDefs.map((col: ColDef<Employee>) => {
        if (col.field === 'department') {
          return { ...col, rowGroup: !wasGrouped };
        }
        return col;
      });

      this.gridApi.setColumnDefs(newColDefs);

      setTimeout(() => {
        // Toggle back
        const revertColDefs = newColDefs.map((col: ColDef<Employee>) => {
          if (col.field === 'department') {
            return { ...col, rowGroup: wasGrouped ?? false };
          }
          return col;
        });
        this.gridApi.setColumnDefs(revertColDefs);

        results.groupingUpdateTime = Number((performance.now() - groupStart).toFixed(2));

        // 4. Scroll Test
        this.runScrollTest(results, startTime);
      }, 100);
    }, 100);
  }

  private runScrollTest(results: typeof this.results, startTime: number): void {
    const frameTimes: number[] = [];
    let scrollCount = 0;
    const totalScrollFrames = 30;
    const viewport = this.gridComponent.viewportRef?.nativeElement;

    if (!viewport) {
      this.finishBenchmark(results, startTime);
      return;
    }

    const runScroll = () => {
      if (scrollCount < totalScrollFrames) {
        viewport.scrollTop += 100;
        frameTimes.push(this.gridComponent.getLastFrameTime());
        scrollCount++;
        requestAnimationFrame(runScroll);
      } else {
        results.scrollFrameAverage = Number(
          (frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length).toFixed(2)
        );
        this.finishBenchmark(results, startTime);
      }
    };

    // Reset scroll position first
    viewport.scrollTop = 0;
    setTimeout(() => requestAnimationFrame(runScroll), 100);
  }

  private finishBenchmark(results: typeof this.results, startTime: number): void {
    results.totalTime = Number((performance.now() - startTime).toFixed(2));
    this.results = results;
    this.isRunning = false;

    // Reset scroll
    const viewport = this.gridComponent.viewportRef?.nativeElement;
    if (viewport) {
      viewport.scrollTop = 0;
    }
  }

  ngOnDestroy(): void {
    if (this.fpsInterval) {
      cancelAnimationFrame(this.fpsInterval);
    }
  }
}
