import { Component, signal, OnInit, AfterViewInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

interface RowData {
  id: number;
  name: string;
  department: string;
  role: string;
  salary: number;
  location: string;
  startDate: string;
  performance: number;
}

interface Column {
  field: keyof RowData;
  header: string;
  width: number;
}

@Component({
  selector: 'app-demo-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './demo-page.component.html',
  styleUrls: ['./demo-page.component.css'],
})
export class DemoPageComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('gridCanvas') canvasRef?: ElementRef<HTMLCanvasElement>;

  readonly rowData = signal<RowData[]>([]);
  renderTime = 0;
  fps = 0;
  isLoading = false;
  rowCount = 100000;

  private ctx?: CanvasRenderingContext2D;
  private animationFrameId?: number;
  private lastFrameTime = 0;
  private scrollTop = 0;
  private visibleStart = 0;
  private visibleEnd = 0;

  columns: Column[] = [
    { field: 'id', header: 'ID', width: 80 },
    { field: 'name', header: 'Name', width: 200 },
    { field: 'department', header: 'Department', width: 180 },
    { field: 'role', header: 'Role', width: 250 },
    { field: 'salary', header: 'Salary', width: 120 },
    { field: 'location', header: 'Location', width: 150 },
    { field: 'startDate', header: 'Start Date', width: 130 },
    { field: 'performance', header: 'Performance', width: 120 },
  ];

  rowHeight = 32;
  headerHeight = 40;

  ngOnInit(): void {
    this.loadData(100000);
  }

  ngAfterViewInit(): void {
    if (this.canvasRef) {
      this.ctx = this.canvasRef.nativeElement.getContext('2d')!;
      this.resizeCanvas();
      this.startRenderLoop();
    }
  }

  resizeCanvas(): void {
    if (!this.canvasRef || !this.ctx) return;

    const canvas = this.canvasRef.nativeElement;
    const container = canvas.parentElement;
    if (!container) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = container.clientWidth * dpr;
    canvas.height = container.clientHeight * dpr;
    canvas.style.width = `${container.clientWidth}px`;
    canvas.style.height = `${container.clientHeight}px`;

    this.ctx.scale(dpr, dpr);
    this.viewportWidth = container.clientWidth;
    this.viewportHeight = container.clientHeight;
  }

  private viewportWidth = 0;
  private viewportHeight = 0;

  startRenderLoop(): void {
    const loop = (timestamp: number) => {
      if (!this.lastFrameTime) this.lastFrameTime = timestamp;
      const delta = timestamp - this.lastFrameTime;
      this.fps = Math.round(1000 / delta);
      this.lastFrameTime = timestamp;

      this.render();

      this.animationFrameId = requestAnimationFrame(loop);
    };

    this.animationFrameId = requestAnimationFrame(loop);
  }

  render(): void {
    if (!this.ctx || !this.canvasRef) return;

    const ctx = this.ctx;
    const data = this.rowData();
    
    // Clear canvas
    ctx.clearRect(0, 0, this.viewportWidth, this.viewportHeight);

    // Calculate visible rows
    const totalRows = data.length;
    const visibleRowCount = Math.ceil(this.viewportHeight / this.rowHeight);
    const visibleStart = Math.floor(this.scrollTop / this.rowHeight);
    const visibleEnd = Math.min(visibleStart + visibleRowCount + 5, totalRows);

    this.visibleStart = visibleStart;
    this.visibleEnd = visibleEnd;

    // Draw header
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, this.viewportWidth, this.headerHeight);
    ctx.fillStyle = '#333';
    ctx.font = '600 13px Inter, sans-serif';

    let x = 0;
    for (const col of this.columns) {
      ctx.fillStyle = '#333';
      ctx.fillText(col.header, x + 12, this.headerHeight / 2 + 5);
      ctx.strokeStyle = '#e0e0e0';
      ctx.beginPath();
      ctx.moveTo(x + col.width, 0);
      ctx.lineTo(x + col.width, this.headerHeight);
      ctx.stroke();
      x += col.width;
    }

    // Draw rows
    ctx.font = '12px Inter, sans-serif';
    for (let i = visibleStart; i < visibleEnd; i++) {
      const row = data[i];
      const y = this.headerHeight + (i * this.rowHeight) - this.scrollTop;

      // Row background
      ctx.fillStyle = i % 2 === 0 ? '#fff' : '#fafafa';
      ctx.fillRect(0, y, this.viewportWidth, this.rowHeight);

      // Row border
      ctx.strokeStyle = '#e0e0e0';
      ctx.beginPath();
      ctx.moveTo(0, y + this.rowHeight);
      ctx.lineTo(this.viewportWidth, y + this.rowHeight);
      ctx.stroke();

      // Cell content
      x = 0;
      for (const col of this.columns) {
        let value = row[col.field];
        if (col.field === 'salary') {
          value = `$${(value as number).toLocaleString()}`;
        } else if (col.field === 'performance') {
          // Performance badge
          const perf = value as number;
          const badgeColor = perf >= 80 ? '#22c55e' : perf >= 60 ? '#eab308' : '#ef4444';
          ctx.fillStyle = badgeColor;
          ctx.fillRect(x + 12, y + 6, 50, 20);
          ctx.fillStyle = '#fff';
          ctx.fillText(`${perf}%`, x + 18, y + 20);
          x += col.width;
          continue;
        }

        ctx.fillStyle = '#333';
        ctx.fillText(String(value), x + 12, y + 20);
        x += col.width;
      }
    }

    // Draw total count
    ctx.fillStyle = '#666';
    ctx.font = '12px Inter, sans-serif';
    ctx.fillText(`Showing rows ${visibleStart + 1}-${visibleEnd} of ${totalRows.toLocaleString()}`, 12, this.viewportHeight - 10);
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

    const data: RowData[] = [];

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
      this.rowData.set(data);
      const endTime = performance.now();
      this.renderTime = Math.round(endTime - startTime);
      this.rowCount = count;
      this.isLoading = false;
      console.log(`Loaded ${count} rows in ${this.renderTime}ms`);
    }, 100);
  }

  ngOnDestroy(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }
}
