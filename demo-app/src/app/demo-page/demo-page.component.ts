import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ArgentGridModule, ArgentGridComponent } from 'argentgrid';
import { GridApi, ColDef, IRowNode } from 'argentgrid';

interface Employee {
  id: number;
  name: string;
  department: string;
  role: string;
  salary: number;
  salaryTrend: number[];
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
  @ViewChild(ArgentGridComponent) gridComponent!: ArgentGridComponent<Employee>;

  rowData: Employee[] = [];
  renderTime = 0;
  canvasFrameTime = 0;
  fps = 0;
  isLoading = false;
  rowCount = 100000;
  isGrouped = false;
  isFloatingFilterShown = true;
  isBenchmarking = false;
  isMasterDetail = false;
  isPivotMode = false;
  isSideBarVisible = true;
  benchmarkResults: any = null;

  columnDefs: ColDef<Employee>[] = [
    { field: 'id', headerName: 'ID', width: 80, sortable: true, filter: 'number' },
    { field: 'name', headerName: 'Name', width: 200, sortable: true, filter: 'text' },
    { field: 'department', headerName: 'Department', width: 180, sortable: true, filter: 'text', rowGroup: false },
    { field: 'role', headerName: 'Role', width: 250, filter: 'text' },
    {
      field: 'salary',
      headerName: 'Salary',
      width: 120,
      sortable: true,
      filter: 'number',
      valueFormatter: (params: any) => `$${params.value?.toLocaleString()}`,
    },
    {
      field: 'salaryTrend',
      headerName: 'Salary Trend',
      width: 150,
      sparklineOptions: {
        type: 'area',
        area: {
          fill: 'rgba(74, 222, 128, 0.2)',
          stroke: '#4ade80',
          strokeWidth: 2
        }
      }
    },
    { field: 'location', headerName: 'Location', width: 150, filter: 'text' },
    { field: 'startDate', headerName: 'Start Date', width: 130, filter: 'date' },
    {
      field: 'performance',
      headerName: 'Performance',
      width: 120,
      filter: 'number',
      cellRenderer: (params: any) => {
        const value = params.value;
        const color = value >= 80 ? '#22c55e' : value >= 60 ? '#eab308' : '#ef4444';
        return `<span style="color: ${color}; font-weight: bold; padding: 4px 8px; background: ${color}20; border-radius: 4px;">${value}%</span>`;
      },
    },
  ];

  gridOptions: any = {
    floatingFilter: true,
    enableRangeSelection: true,
    sideBar: true,
    autoGroupColumnDef: {
      headerName: 'Organization',
      width: 250,
      pinned: 'left'
    }
  };

  private gridApi?: GridApi<Employee>;
  private fpsInterval?: number;
  private lastFrameTime = 0;
  private fpsUpdateTimer = 0;

  constructor(
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadData(100000);
    this.startFPSCounter();
  }

  ngAfterViewInit(): void {
    // Grid is ready after view init
  }

  toggleGrouping(): void {
    this.isGrouped = !this.isGrouped;
    this.columnDefs = this.columnDefs.map(col => {
      if (col.field === 'department') {
        return { ...col, rowGroup: this.isGrouped };
      }
      return col;
    });
    
    if (this.gridApi) {
      this.gridApi.setColumnDefs(this.columnDefs);
      this.gridApi.onFilterChanged(); // Trigger re-processing
    }

    this.cdr.detectChanges();
  }

  toggleFloatingFilter(): void {
    this.isFloatingFilterShown = !this.isFloatingFilterShown;
    if (this.gridApi) {
      this.gridApi.setGridOption('floatingFilter', this.isFloatingFilterShown);
    }
    this.cdr.detectChanges();
  }

  toggleMasterDetail(): void {
    this.isMasterDetail = !this.isMasterDetail;
    if (this.gridApi) {
      this.gridApi.setGridOption('masterDetail', this.isMasterDetail);
      this.gridApi.setGridOption('isRowMaster', (data: any) => data.id % 2 === 0);
      this.gridApi.setRowData([...this.rowData]); // Force refresh
    }
    this.cdr.detectChanges();
  }

  togglePivotMode(): void {
    this.isPivotMode = !this.isPivotMode;
    if (this.gridApi) {
      this.columnDefs = this.columnDefs.map(col => {
        if (col.field === 'location') {
          return { ...col, pivot: this.isPivotMode };
        }
        if (col.field === 'salary') {
          return { ...col, aggFunc: 'sum' };
        }
        return col;
      });
      this.gridApi.setColumnDefs(this.columnDefs);
      this.gridApi.setPivotMode(this.isPivotMode);
    }
    this.cdr.detectChanges();
  }

  toggleSideBar(): void {
    this.isSideBarVisible = !this.isSideBarVisible;
    if (this.gridApi) {
      this.gridApi.setGridOption('sideBar', this.isSideBarVisible);
    }
    this.cdr.detectChanges();
  }

  applyFilter(): void {
    if (this.gridApi) {
      this.gridApi.setFilterModel({
        department: { filterType: 'text', type: 'contains', filter: 'Eng' }
      });
    }
    this.cdr.detectChanges();
  }

  clearFilters(): void {
    if (this.gridApi) {
      this.gridApi.setFilterModel({});
    }
    this.cdr.detectChanges();
  }

  startFPSCounter(): void {
    const countFPS = () => {
      const now = performance.now();
      let changed = false;

      if (this.lastFrameTime) {
        const delta = now - this.lastFrameTime;
        
        // Update metrics only every 500ms to reduce change detection cycles
        if (now - this.fpsUpdateTimer > 500) {
          const newFps = Math.round(1000 / delta);
          if (newFps !== this.fps) {
            this.fps = newFps;
            changed = true;
          }

          // Update canvas frame time if available
          if (this.gridComponent) {
            const newFrameTime = Number(this.gridComponent.getLastFrameTime().toFixed(2));
            if (newFrameTime !== this.canvasFrameTime) {
              this.canvasFrameTime = newFrameTime;
              changed = true;
            }
          }
          
          this.fpsUpdateTimer = now;
        }
      }
      this.lastFrameTime = now;

      // In zoneless mode, we manually trigger change detection for these async updates
      if (changed) {
        this.cdr.detectChanges();
      }

      this.fpsInterval = requestAnimationFrame(countFPS);
    };
    this.fpsInterval = requestAnimationFrame(countFPS);
  }

  runBenchmark(): void {
    if (!this.gridApi || !this.gridComponent) return;
    
    this.isBenchmarking = true;
    this.benchmarkResults = null;
    this.cdr.detectChanges();
    
    const results = {
      initialRender: 0,
      scrollFrameAverage: 0,
      selectionUpdateTime: 0,
      groupingUpdateTime: 0,
      totalTime: 0
    };

    const startTime = performance.now();

    // 1. Initial render time (cached from last frame)
    results.initialRender = this.gridComponent.getLastFrameTime();

    // 2. Selection Update Time
    const selStart = performance.now();
    this.gridApi.selectAll();
    // Wait for render cycle
    setTimeout(() => {
      results.selectionUpdateTime = Number((performance.now() - selStart).toFixed(2));
      this.gridApi?.deselectAll();

      // 3. Grouping Update Time (Toggle grouping twice)
      const groupStart = performance.now();
      if (!this.isGrouped) {
        this.toggleGrouping(); // Turn on
        setTimeout(() => {
          this.toggleGrouping(); // Turn off
          results.groupingUpdateTime = Number((performance.now() - groupStart).toFixed(2));
          
          startScrolling();
        }, 100);
      } else {
        this.toggleGrouping(); // Turn off
        setTimeout(() => {
          this.toggleGrouping(); // Turn on
          results.groupingUpdateTime = Number((performance.now() - groupStart).toFixed(2));
          
          startScrolling();
        }, 100);
      }

      // 4. Scroll performance (programmatic scroll)
      const startScrolling = () => {
        const frameTimes: number[] = [];
        let scrollCount = 0;
        const totalScrollFrames = 30;
        const viewport = this.gridComponent.viewportRef.nativeElement;

        const runScroll = () => {
          if (scrollCount < totalScrollFrames) {
            viewport.scrollTop += 100;
            frameTimes.push(this.gridComponent.getLastFrameTime());
            scrollCount++;
            requestAnimationFrame(runScroll);
          } else {
                      // Finished scroll
                      results.scrollFrameAverage = Number((frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length).toFixed(2));
                      results.totalTime = Number((performance.now() - startTime).toFixed(2));
                      this.benchmarkResults = results;
                      this.isBenchmarking = false;
                      
                      // Scroll back up
                      viewport.scrollTop = 0;
                      this.cdr.detectChanges();
                    }
                  };        
        requestAnimationFrame(runScroll);
      };
    }, 100);
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
        salaryTrend: Array.from({ length: 10 }, () => Math.floor(Math.random() * 100)),
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

      this.cdr.detectChanges();
      console.log(`Loaded ${count} rows in ${this.renderTime}ms`);
    }, 100);
  }

  onGridReady(api: GridApi<Employee>): void {
    this.gridApi = api;
    (window as any).gridApi = api;
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
