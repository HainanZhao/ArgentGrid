import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ElementRef, ViewChild, ChangeDetectionStrategy, AfterViewInit } from '@angular/core';
import { GridApi, GridOptions, ColDef, ColGroupDef, IRowNode } from '../types/ag-grid-types';
import { GridService } from '../services/grid.service';
import { CanvasRenderer } from '../rendering/canvas-renderer';
import { Subject } from 'rxjs';

@Component({
  selector: 'argent-grid',
  template: `
    <div class="argent-grid-container" [style.height]="height" [style.width]="width">
      <!-- Header Layer (DOM-based for accessibility) -->
      <div class="argent-grid-header" *ngIf="columnDefs">
        <div class="argent-grid-header-row">
          <div
            *ngFor="let col of columnDefs"
            class="argent-grid-header-cell"
            [style.width.px]="getColumnWidth(col)"
            [class.sortable]="isSortable(col)"
            (click)="onHeaderClick(col)">
            {{ getHeaderName(col) }}
            <span class="sort-indicator" *ngIf="getSortIndicator(col)">{{ getSortIndicator(col) }}</span>
          </div>
        </div>
      </div>

      <!-- Canvas Layer for Data Viewport with virtual scrolling -->
      <div class="argent-grid-viewport" #viewport>
        <canvas #gridCanvas class="argent-grid-canvas"></canvas>
      </div>

      <!-- Overlay for loading/no rows -->
      <div class="argent-grid-overlay" *ngIf="showOverlay">
        <ng-content select="[overlay]"></ng-content>
      </div>
    </div>
  `,
  styles: [`
    .argent-grid-container {
      position: relative;
      overflow: hidden;
      border: 1px solid #e0e0e0;
      background: #fff;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
    }

    .argent-grid-header {
      border-bottom: 1px solid #e0e0e0;
      background: #f5f5f5;
      font-weight: 600;
    }

    .argent-grid-header-row {
      display: flex;
    }

    .argent-grid-header-cell {
      padding: 8px 12px;
      border-right: 1px solid #e0e0e0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      cursor: pointer;
      user-select: none;
    }

    .argent-grid-header-cell.sortable:hover {
      background: #e8e8e8;
    }

    .sort-indicator {
      margin-left: 4px;
      font-size: 12px;
    }

    .argent-grid-viewport {
      overflow: auto;
      contain: strict;
      will-change: scroll-position;
    }

    .argent-grid-canvas {
      display: block;
      width: 100%;
      image-rendering: -webkit-optimize-contrast;
      image-rendering: crisp-edges;
    }

    .argent-grid-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.9);
      z-index: 10;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ArgentGridComponent<TData = any> implements OnInit, OnDestroy, AfterViewInit {
  @Input() columnDefs: (ColDef<TData> | ColGroupDef<TData>)[] | null = null;
  @Input() rowData: TData[] | null = null;
  @Input() gridOptions: GridOptions<TData> | null = null;
  @Input() height = '500px';
  @Input() width = '100%';
  @Input() rowHeight = 32;
  
  @Output() gridReady = new EventEmitter<GridApi<TData>>();
  @Output() rowClicked = new EventEmitter<{ data: TData; node: IRowNode<TData> }>();
  @Output() selectionChanged = new EventEmitter<IRowNode<TData>[]>();
  
  @ViewChild('gridCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('viewport') viewportRef!: ElementRef<HTMLDivElement>;

  canvasHeight = 0;
  showOverlay = false;
  private viewportHeight = 500;

  private gridApi!: GridApi<TData>;
  private canvasRenderer!: CanvasRenderer;
  private destroy$ = new Subject<void>();

  constructor(private gridService: GridService<TData>) {}

  ngOnInit(): void {
    this.initializeGrid();
  }

  ngAfterViewInit(): void {
    // Setup viewport dimensions after view init
    if (this.viewportRef) {
      const rect = this.viewportRef.nativeElement.getBoundingClientRect();
      this.viewportHeight = rect.height || 500;
      this.canvasRenderer?.setViewportDimensions(rect.width, this.viewportHeight);
      this.canvasRenderer?.setTotalRowCount(this.rowData?.length || 0);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.gridApi?.destroy();
    this.canvasRenderer?.destroy();
  }

  private initializeGrid(): void {
    // Initialize grid API
    this.gridApi = this.gridService.createApi(this.columnDefs, this.rowData);

    // Initialize canvas renderer (will be configured in ngAfterViewInit)
    if (this.canvasRef) {
      this.canvasRenderer = new CanvasRenderer(
        this.canvasRef.nativeElement,
        this.gridApi,
        this.rowHeight
      );
    }

    // Emit grid ready event
    this.gridReady.emit(this.gridApi);

    // Update overlay state
    this.showOverlay = !this.rowData || this.rowData.length === 0;
  }
  
  getColumnWidth(col: ColDef<TData> | ColGroupDef<TData>): number {
    if ('children' in col) {
      // Column group - sum children widths
      return col.children.reduce((sum, child) => sum + this.getColumnWidth(child), 0);
    }
    return col.width || 150;
  }
  
  isSortable(col: ColDef<TData> | ColGroupDef<TData>): boolean {
    return 'sortable' in col ? !!col.sortable : true;
  }
  
  getHeaderName(col: ColDef<TData> | ColGroupDef<TData>): string {
    if ('children' in col) {
      return col.headerName || '';
    }
    return col.headerName || col.field?.toString() || '';
  }
  
  getSortIndicator(col: ColDef<TData> | ColGroupDef<TData>): string {
    if ('children' in col || !col.sort) {
      return '';
    }
    return col.sort === 'asc' ? '▲' : '▼';
  }
  
  onHeaderClick(col: ColDef<TData> | ColGroupDef<TData>): void {
    if (!this.isSortable(col) || 'children' in col) {
      return;
    }
    
    // Toggle sort
    const currentSort = col.sort;
    col.sort = currentSort === 'asc' ? 'desc' : currentSort === 'desc' ? null : 'asc';
    col.sortIndex = col.sort ? 0 : undefined;
    
    const colId = typeof col.colId === 'string' ? col.colId : col.field?.toString() || '';
    this.gridApi.setSortModel(col.sort ? [{ colId, sort: col.sort }] : []);
    this.canvasRenderer?.render();
  }
  
  // Public API methods
  getApi(): GridApi<TData> {
    return this.gridApi;
  }
  
  refresh(): void {
    this.canvasRenderer?.render();
  }
}
