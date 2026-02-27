import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ElementRef, ViewChild, ChangeDetectionStrategy, AfterViewInit, OnChanges, SimpleChanges, ChangeDetectorRef, Inject } from '@angular/core';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { GridApi, GridOptions, ColDef, ColGroupDef, IRowNode, Column } from '../types/ag-grid-types';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { GridService } from '../services/grid.service';
import { CanvasRenderer } from '../rendering/canvas-renderer';

@Component({
  selector: 'argent-grid',
  template: `
    <div class="argent-grid-container" [style.height]="height" [style.width]="width" (click)="onContainerClick($event)">
      <!-- Header Layer (DOM-based for accessibility) -->
      <div class="argent-grid-header">
        <!-- Main Header Row -->
        <div class="argent-grid-header-row">
          <!-- Selection Column Header -->
          <div
            *ngIf="showSelectionColumn"
            class="argent-grid-header-cell argent-grid-selection-header"
            [style.width.px]="selectionColumnWidth"
            (click)="onSelectionHeaderClick()">
            <input type="checkbox"
                   [checked]="isAllSelected"
                   [indeterminate]="isIndeterminateSelection"
                   (change)="onSelectionHeaderChange($event)" />
          </div>
        
          <!-- Left Pinned Columns -->
          <div class="argent-grid-header-pinned-left-container"
               cdkDropList
               id="left-pinned"
               [cdkDropListConnectedTo]="['scrollable', 'right-pinned']"
               cdkDropListOrientation="horizontal"
               (cdkDropListDropped)="onColumnDropped($event, 'left')">
            <div
              *ngFor="let col of getLeftPinnedColumns(); trackBy: trackByColumn"
              class="argent-grid-header-cell argent-grid-header-cell-pinned-left"
              [style.width.px]="getColumnWidth(col)"
              [class.sortable]="isSortable(col)"
              (click)="onHeaderClick(col)"
              cdkDrag
              [cdkDragData]="col">
              <div class="argent-grid-header-content" cdkDragHandle>
                <span class="header-text">{{ getHeaderName(col) }}</span>
                <span class="sort-indicator" *ngIf="getSortIndicator(col)">{{ getSortIndicator(col) }}</span>
              </div>
              <div class="argent-grid-header-menu-icon" (click)="onHeaderMenuClick($event, col)" *ngIf="hasHeaderMenu(col)">
                &#8942;
              </div>
              <div class="argent-grid-header-resize-handle" 
                   *ngIf="isResizable(col)" 
                   [class.resizing]="isResizing && resizeColumn === col"
                   (mousedown)="onResizeMouseDown($event, col)">
              </div>
            </div>
          </div>
          
          <!-- Scrollable Columns -->
          <div class="argent-grid-header-scrollable"
               #headerScrollable
               cdkDropList
               id="scrollable"
               [cdkDropListConnectedTo]="['left-pinned', 'right-pinned']"
               cdkDropListOrientation="horizontal"
               (cdkDropListDropped)="onColumnDropped($event, 'none')">
            <div class="argent-grid-header-row">
              <div
                *ngFor="let col of getNonPinnedColumns(); trackBy: trackByColumn"
                class="argent-grid-header-cell"
                [style.width.px]="getColumnWidth(col)"
                [class.sortable]="isSortable(col)"
                (click)="onHeaderClick(col)"
                cdkDrag
                [cdkDragData]="col">
                <div class="argent-grid-header-content" cdkDragHandle>
                  <span class="header-text">{{ getHeaderName(col) }}</span>
                  <span class="sort-indicator" *ngIf="getSortIndicator(col)">{{ getSortIndicator(col) }}</span>
                </div>
                <div class="argent-grid-header-menu-icon" (click)="onHeaderMenuClick($event, col)" *ngIf="hasHeaderMenu(col)">
                  &#8942;
                </div>
                <div class="argent-grid-header-resize-handle" 
                     *ngIf="isResizable(col)" 
                     [class.resizing]="isResizing && resizeColumn === col"
                     (mousedown)="onResizeMouseDown($event, col)">
                </div>
              </div>
            </div>
          </div>
          
          <!-- Right Pinned Columns -->
          <div class="argent-grid-header-pinned-right-container"
               cdkDropList
               id="right-pinned"
               [cdkDropListConnectedTo]="['left-pinned', 'scrollable']"
               cdkDropListOrientation="horizontal"
               (cdkDropListDropped)="onColumnDropped($event, 'right')">
            <div
              *ngFor="let col of getRightPinnedColumns(); trackBy: trackByColumn"
              class="argent-grid-header-cell argent-grid-header-cell-pinned-right"
              [style.width.px]="getColumnWidth(col)"
              [class.sortable]="isSortable(col)"
              (click)="onHeaderClick(col)"
              cdkDrag
              [cdkDragData]="col">
              <div class="argent-grid-header-content" cdkDragHandle>
                <span class="header-text">{{ getHeaderName(col) }}</span>
                <span class="sort-indicator" *ngIf="getSortIndicator(col)">{{ getSortIndicator(col) }}</span>
              </div>
              <div class="argent-grid-header-menu-icon" (click)="onHeaderMenuClick($event, col)" *ngIf="hasHeaderMenu(col)">
                &#8942;
              </div>
              <div class="argent-grid-header-resize-handle" 
                   *ngIf="isResizable(col)" 
                   [class.resizing]="isResizing && resizeColumn === col"
                   (mousedown)="onResizeMouseDown($event, col)">
              </div>
            </div>
          </div>
        </div>

        <!-- Floating Filter Row -->
        <div class="argent-grid-header-row floating-filter-row" *ngIf="hasFloatingFilters()">
          <!-- Selection Column Padding -->
          <div *ngIf="showSelectionColumn" class="argent-grid-header-cell" [style.width.px]="selectionColumnWidth"></div>

          <!-- Left Pinned Filters -->
          <div class="argent-grid-header-pinned-left-container">
            <div
              *ngFor="let col of getLeftPinnedColumns(); trackBy: trackByColumn"
              class="argent-grid-header-cell argent-grid-header-cell-pinned-left"
              [style.width.px]="getColumnWidth(col)">
              <div class="floating-filter-container" *ngIf="isFloatingFilterEnabled(col)">
                <input #filterInput
                       class="floating-filter-input"
                       [type]="getFilterInputType(col)"
                       [value]="getFloatingFilterValue(col)"
                       (input)="onFloatingFilterInput($event, col)"
                       [placeholder]="'Filter...'" />
                <span class="floating-filter-clear"
                      *ngIf="hasFilterValue(col, filterInput)"
                      (click)="clearFloatingFilter(col, filterInput)">✕</span>
              </div>
            </div>
          </div>

          <!-- Scrollable Filters -->
          <div class="argent-grid-header-scrollable" #headerScrollableFilter>
            <div class="argent-grid-header-row">
              <div
                *ngFor="let col of getNonPinnedColumns(); trackBy: trackByColumn"
                class="argent-grid-header-cell"
                [style.width.px]="getColumnWidth(col)">
                <div class="floating-filter-container" *ngIf="isFloatingFilterEnabled(col)">
                  <input #filterInput
                         class="floating-filter-input"
                         [type]="getFilterInputType(col)"
                         [value]="getFloatingFilterValue(col)"
                         (input)="onFloatingFilterInput($event, col)"
                         [placeholder]="'Filter...'" />
                  <span class="floating-filter-clear"
                        *ngIf="hasFilterValue(col, filterInput)"
                        (click)="clearFloatingFilter(col, filterInput)">✕</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Right Pinned Filters -->
          <div class="argent-grid-header-pinned-right-container">
            <div
              *ngFor="let col of getRightPinnedColumns(); trackBy: trackByColumn"
              class="argent-grid-header-cell argent-grid-header-cell-pinned-right"
              [style.width.px]="getColumnWidth(col)">
              <div class="floating-filter-container" *ngIf="isFloatingFilterEnabled(col)">
                <input #filterInput
                       class="floating-filter-input"
                       [type]="getFilterInputType(col)"
                       [value]="getFloatingFilterValue(col)"
                       (input)="onFloatingFilterInput($event, col)"
                       [placeholder]="'Filter...'" />
                <span class="floating-filter-clear"
                      *ngIf="hasFilterValue(col, filterInput)"
                      (click)="clearFloatingFilter(col, filterInput)">✕</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Canvas Layer for Data Viewport with virtual scrolling -->
      <div class="argent-grid-viewport" #viewport>
        <!-- Spacer to create scrollbars for virtual scrolling -->
        <div class="argent-grid-scroll-spacer" [style.height.px]="totalHeight" [style.width.px]="totalWidth"></div>
        
        <canvas #gridCanvas class="argent-grid-canvas" (contextmenu)="onCanvasContextMenu($event)"></canvas>
        
        <!-- Cell Editor Overlay -->
        <div class="argent-grid-cell-editor" 
             *ngIf="isEditing"
             [style.top.px]="editorPosition.y"
             [style.left.px]="editorPosition.x"
             [style.width.px]="editorPosition.width"
             [style.height.px]="editorPosition.height"
             (click)="$event.stopPropagation()">
          <input #editorInput
                 type="text"
                 class="argent-grid-editor-input"
                 [value]="editingValue"
                 (input)="onEditorInput($event)"
                 (keydown)="onEditorKeydown($event)"
                 (blur)="onEditorBlur()"
                 autofocus />
        </div>
      </div>

      <!-- Overlay for loading/no rows -->
      <div class="argent-grid-overlay" *ngIf="showOverlay">
        <ng-content select="[overlay]"></ng-content>
      </div>

      <!-- Header Menu Overlay -->
      <div class="argent-grid-header-menu" 
           *ngIf="activeHeaderMenu"
           [style.top.px]="headerMenuPosition.y"
           [style.left.px]="headerMenuPosition.x"
           (click)="$event.stopPropagation()">
        <div class="menu-item" (click)="sortColumnMenu('asc')">
          <span class="menu-icon">↑</span> Sort Ascending
        </div>
        <div class="menu-item" (click)="sortColumnMenu('desc')">
          <span class="menu-icon">↓</span> Sort Descending
        </div>
        <div class="menu-item" (click)="sortColumnMenu(null)">
          <span class="menu-icon">✕</span> Clear Sort
        </div>
        <div class="menu-divider"></div>
        <div class="menu-item" (click)="hideColumnMenu()">
          <span class="menu-icon">ø</span> Hide Column
        </div>
        <div class="menu-item" (click)="pinColumnMenu('left')">
          <span class="menu-icon">«</span> Pin Left
        </div>
        <div class="menu-item" (click)="pinColumnMenu('right')">
          <span class="menu-icon">»</span> Pin Right
        </div>
        <div class="menu-item" (click)="pinColumnMenu(null)">
          <span class="menu-icon">↺</span> Unpin
        </div>
      </div>

      <!-- Context Menu Overlay -->
      <div class="argent-grid-context-menu" 
           *ngIf="activeContextMenu"
           [style.top.px]="contextMenuPosition.y"
           [style.left.px]="contextMenuPosition.x"
           (click)="$event.stopPropagation()">
        <div class="menu-item" (click)="copyContextMenuCell()">
          <span class="menu-icon">📋</span> Copy Cell
        </div>
        <div class="menu-divider"></div>
        <div class="menu-item" (click)="exportCSV()">
          <span class="menu-icon">⤓</span> Export CSV
        </div>
        <div class="menu-item" (click)="exportExcel()">
          <span class="menu-icon">⤓</span> Export Excel
        </div>
        <div class="menu-divider"></div>
        <div class="menu-item" (click)="resetColumns()">
          <span class="menu-icon">⟲</span> Reset Columns
        </div>
      </div>
    </div>
  `,
  styles: [`
    .argent-grid-container {
      box-sizing: border-box;
      position: relative;
      overflow: hidden;
      border: 1px solid #babed1;
      background: #fff;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      display: flex;
      flex-direction: column;
    }

    .argent-grid-container *, .argent-grid-container *:before, .argent-grid-container *:after {
      box-sizing: inherit;
    }

    .argent-grid-header {
      border-bottom: 1px solid #babed1;
      background: #f8f9fa;
      font-weight: 600;
    }

    .argent-grid-header-row {
      display: flex;
      white-space: nowrap;
    }

    .argent-grid-header-scrollable {
      overflow: hidden;
      flex: 1;
    }

    .argent-grid-header-pinned-left-container,
    .argent-grid-header-pinned-right-container {
      display: flex;
    }

    .cdk-drag-preview {
      box-sizing: border-box;
      border-radius: 4px;
      box-shadow: 0 5px 5px -3px rgba(0, 0, 0, 0.2),
                  0 8px 10px 1px rgba(0, 0, 0, 0.14),
                  0 3px 14px 2px rgba(0, 0, 0, 0.12);
      background: #f5f5f5;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 8px 12px;
      font-weight: 600;
      opacity: 0.8;
    }

    .cdk-drag-placeholder {
      opacity: 0.3;
    }

    .cdk-drag-animating {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }

    .argent-grid-header-cell.cdk-drop-list-dragging .argent-grid-header-cell:not(.cdk-drag-placeholder) {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }

    .argent-grid-header-cell {
      padding: 8px 12px;
      border-right: 1px solid #babed1;
      display: flex;
      align-items: center;
      justify-content: space-between;
      cursor: pointer;
      user-select: none;
      flex-shrink: 0;
      position: relative;
      height: 100%;
    }

    .argent-grid-header-cell:hover .argent-grid-header-menu-icon {
      opacity: 1;
    }

    .argent-grid-header-content {
      display: flex;
      align-items: center;
      overflow: hidden;
      flex: 1;
      height: 100%;
    }
    
    .header-text {
      overflow: hidden;
      text-overflow: ellipsis;
      padding-right: 4px;
    }

    .argent-grid-header-menu-icon {
      opacity: 0;
      padding: 0 6px;
      color: #666;
      transition: opacity 0.2s;
      font-size: 16px;
      line-height: 1;
    }

    .argent-grid-header-menu-icon:hover {
      color: #000;
      background: #e0e0e0;
      border-radius: 4px;
    }

    .argent-grid-header-resize-handle {
      position: absolute;
      right: 0;
      top: 0;
      bottom: 0;
      width: 4px;
      cursor: col-resize;
      z-index: 5;
      transition: background-color 0.2s;
    }

    .argent-grid-header-resize-handle:hover,
    .argent-grid-header-resize-handle.resizing {
      background-color: #2196f3;
    }

    .argent-grid-header-cell-pinned-left {
      position: sticky;
      left: 0;
      z-index: 10;
      background: #f8f9fa;
    }

    .argent-grid-header-cell-pinned-right {
      position: sticky;
      right: 0;
      z-index: 10;
      background: #f8f9fa;
    }

    .argent-grid-header-cell.sortable:hover {
      background: #e8e8e8;
    }

    .sort-indicator {
      margin-left: 4px;
      font-size: 12px;
    }

    .argent-grid-viewport {
      position: relative;
      overflow: auto;
      contain: strict;
      will-change: scroll-position;
      flex: 1;
      min-height: 0;
    }

    .argent-grid-canvas {
      position: sticky;
      top: 0;
      left: 0;
      display: block;
      width: 100%;
      image-rendering: -webkit-optimize-contrast;
      image-rendering: crisp-edges;
      z-index: 1;
    }

    .argent-grid-scroll-spacer {
      position: absolute;
      top: 0;
      left: 0;
      width: 1px;
      visibility: hidden;
      pointer-events: none;
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

    .argent-grid-cell-editor {
      position: absolute;
      z-index: 100;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    }

    .argent-grid-editor-input {
      width: 100%;
      height: 100%;
      border: 2px solid #2196f3;
      outline: none;
      padding: 4px 8px;
      font-size: 13px;
      font-family: inherit;
      box-sizing: border-box;
    }

    .argent-grid-header-menu, .argent-grid-context-menu {
      position: fixed;
      background: #ffffff;
      border: 1px solid #babed1;
      box-shadow: 0 3px 10px 0 rgba(0, 0, 0, 0.2);
      border-radius: 3px;
      padding: 4px 0;
      z-index: 10000;
      min-width: 200px;
      font-size: 13px;
      color: #181d1f;
    }
    
    .menu-item {
      padding: 6px 12px;
      cursor: pointer;
      display: flex;
      align-items: center;
      transition: background-color 0.1s;
    }
    
    .menu-item:hover {
      background-color: #f0f2f5;
    }
    
    .menu-icon {
      width: 24px;
      display: flex;
      justify-content: center;
      align-items: center;
      margin-right: 8px;
      font-size: 14px;
      color: #555;
    }

    .menu-divider {
      height: 1px;
      background-color: #babed1;
      margin: 4px 0;
      opacity: 0.5;
    }

    .floating-filter-row {
      background: #fafafa;
      border-top: 1px solid #e0e0e0;
    }

    .floating-filter-container {
      width: 100%;
      padding: 2px 4px;
      box-sizing: border-box;
      position: relative;
      display: flex;
      align-items: center;
    }

    .floating-filter-input {
      width: 100%;
      height: 24px;
      border: 1px solid #d0d0d0;
      border-radius: 2px;
      padding: 0 20px 0 6px;
      font-size: 12px;
      outline: none;
      box-sizing: border-box;
    }

    .floating-filter-clear {
      position: absolute;
      right: 8px;
      cursor: pointer;
      color: #999;
      font-size: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      transition: background-color 0.2s, color 0.2s;
    }

    .floating-filter-clear:hover {
      background-color: #eee;
      color: #333;
    }

    .floating-filter-input:focus {
      border-color: #2196f3;
      box-shadow: 0 0 2px rgba(33, 150, 243, 0.2);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ArgentGridComponent<TData = any> implements OnInit, OnDestroy, AfterViewInit, OnChanges {
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
  @ViewChild('headerScrollable') headerScrollableRef!: ElementRef<HTMLDivElement>;
  @ViewChild('headerScrollableFilter') headerScrollableFilterRef!: ElementRef<HTMLDivElement>;
  @ViewChild('editorInput') editorInputRef!: ElementRef<HTMLInputElement>;

  canvasHeight = 0;
  showOverlay = false;
  private viewportHeight = 500;

  get totalHeight(): number {
    return (this.gridApi?.getDisplayedRowCount() || 0) * this.rowHeight;
  }

  get totalWidth(): number {
    if (!this.gridApi) return 0;
    return this.gridApi.getAllColumns()
      .filter(col => col.visible)
      .reduce((sum, col) => sum + col.width, 0);
  }

  // Selection state
  showSelectionColumn = false;
  selectionColumnWidth = 50;
  isAllSelected = false;
  isIndeterminateSelection = false;

  trackByColumn(index: number, col: Column | ColDef<TData> | ColGroupDef<TData>): string {
    return (col as any).colId || (col as any).field?.toString() || index.toString();
  }

  // Cell editing state
  isEditing = false;
  editingValue = '';
  editorPosition = { x: 0, y: 0, width: 100, height: 32 };
  private editingRowNode: IRowNode<TData> | null = null;
  private editingColDef: ColDef<TData> | null = null;

  // Header Menu state
  activeHeaderMenu: Column | ColDef<TData> | ColGroupDef<TData> | null = null;
  headerMenuPosition = { x: 0, y: 0 };

  // Resizing state
  isResizing = false;
  resizeColumn: Column | null = null;
  private resizeStartX = 0;
  private resizeStartWidth = 0;

  // Context Menu state
  activeContextMenu = false;
  contextMenuPosition = { x: 0, y: 0 };
  private contextMenuCell: { rowNode: IRowNode<TData>, column: Column } | null = null;
  private initialColumnDefs: (ColDef<TData> | ColGroupDef<TData>)[] | null = null;

  private gridApi!: GridApi<TData>;
  private canvasRenderer!: CanvasRenderer;
  private destroy$ = new Subject<void>();
  private gridService = new GridService<TData>();

  constructor(@Inject(ChangeDetectorRef) private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.initialColumnDefs = this.columnDefs ? JSON.parse(JSON.stringify(this.columnDefs)) : null;
    this.initializeGrid();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Handle rowData changes after initialization
    if (changes['rowData'] && !changes['rowData'].firstChange) {
      this.onRowDataChanged(changes['rowData'].currentValue);
    }

    // Handle columnDefs changes
    if (changes['columnDefs'] && !changes['columnDefs'].firstChange) {
      this.onColumnDefsChanged(changes['columnDefs'].currentValue);
    }

    // Handle gridOptions changes
    if (changes['gridOptions'] && !changes['gridOptions'].firstChange) {
      this.onGridOptionsChanged(changes['gridOptions'].currentValue);
    }
  }

  ngAfterViewInit(): void {
    // Setup canvas renderer after view is initialized
    if (this.canvasRef && !this.canvasRenderer) {
      this.canvasRenderer = new CanvasRenderer(
        this.canvasRef.nativeElement,
        this.gridApi,
        this.rowHeight
      );

      // Wire up cell editing callback
      this.canvasRenderer.onCellDoubleClick = (rowIndex, colId) => {
        this.startEditing(rowIndex, colId);
      };

      // Wire up row click for selection
      this.canvasRenderer.onRowClick = (rowIndex, event) => {
        this.onRowClick(rowIndex, event);
      };
    }

    // Setup viewport dimensions after view init
    if (this.viewportRef) {
      const rect = this.viewportRef.nativeElement.getBoundingClientRect();
      this.viewportHeight = rect.height || 500;
      this.canvasRenderer?.setViewportDimensions(rect.width, this.viewportHeight);
      this.canvasRenderer?.setTotalRowCount(this.rowData?.length || 0);

      // Synchronize horizontal scroll with DOM header
      this.viewportRef.nativeElement.addEventListener('scroll', () => {
        if (this.headerScrollableRef) {
          this.headerScrollableRef.nativeElement.scrollLeft = this.viewportRef.nativeElement.scrollLeft;
        }
        if (this.headerScrollableFilterRef) {
          this.headerScrollableFilterRef.nativeElement.scrollLeft = this.viewportRef.nativeElement.scrollLeft;
        }
      }, { passive: true });
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
    this.gridApi = this.gridService.createApi(this.columnDefs, this.rowData, this.gridOptions);

    // Listen for grid state changes from API (filters, sorts, options)
    this.gridService.gridStateChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.canvasRenderer?.render();
        this.cdr.detectChanges();
      });

    // Check if any column has checkbox selection
    this.showSelectionColumn = this.columnDefs?.some(col =>
      !('children' in col) && col.checkboxSelection
    ) || false;

    // Canvas renderer will be initialized in ngAfterViewInit

    // Emit grid ready event
    this.gridReady.emit(this.gridApi);

    // Update overlay state
    this.showOverlay = !this.rowData || this.rowData.length === 0;

    // Update selection state
    this.updateSelectionState();
  }

  private onRowDataChanged(newData: TData[] | null): void {
    this.rowData = newData;

    if (this.gridApi) {
      this.gridApi.setRowData(newData || []);
      this.canvasRenderer?.setTotalRowCount(newData?.length || 0);
      this.canvasRenderer?.render();
    }

    this.showOverlay = !newData || newData.length === 0;
    this.updateSelectionState();

    // Trigger change detection with OnPush
    this.cdr.detectChanges();
  }

  private onColumnDefsChanged(newColumnDefs: (ColDef<TData> | ColGroupDef<TData>)[] | null): void {
    this.columnDefs = newColumnDefs;

    if (this.gridApi) {
      this.gridApi.setColumnDefs(newColumnDefs);
      this.canvasRenderer?.render();
    }
    
    this.cdr.detectChanges();
  }

  private onGridOptionsChanged(newOptions: GridOptions<TData> | null): void {
    this.gridOptions = newOptions;
    if (this.gridApi && newOptions) {
      // Update all options in the API
      Object.keys(newOptions).forEach(key => {
        this.gridApi.setGridOption(key as any, (newOptions as any)[key]);
      });
      this.canvasRenderer?.render();
    }
    this.cdr.detectChanges();
  }
  
  getColumnWidth(col: Column | ColDef<TData> | ColGroupDef<TData>): number {
    if ('children' in col) {
      // Column group - sum children widths
      return col.children.reduce((sum, child) => sum + this.getColumnWidth(child), 0);
    }
    return col.width || 150;
  }

  getLeftPinnedColumns(): Column[] {
    if (!this.gridApi) return [];
    return this.gridApi.getAllColumns().filter(col => {
      return col.visible && col.pinned === 'left';
    });
  }

  getRightPinnedColumns(): Column[] {
    if (!this.gridApi) return [];
    return this.gridApi.getAllColumns().filter(col => {
      return col.visible && col.pinned === 'right';
    });
  }

  getNonPinnedColumns(): Column[] {
    if (!this.gridApi) return [];
    return this.gridApi.getAllColumns().filter(col => {
      return col.visible && !col.pinned;
    });
  }
  
  isSortable(col: Column | ColDef<TData> | ColGroupDef<TData>): boolean {
    // If it has children, it's a group and cannot be sorted directly
    if ('children' in col) return false;

    // Check if the object itself has sortable property (ColDef)
    if ('sortable' in col && col.sortable !== undefined) {
      return !!col.sortable;
    }

    // It's likely a Column object, look up its ColDef
    const colDef = this.getColumnDefForColumn(col as any);
    return colDef ? (colDef.sortable !== false) : true;
  }
  
  getHeaderName(col: Column | ColDef<TData> | ColGroupDef<TData>): string {
    if ('children' in col) {
      return col.headerName || '';
    }
    return col.headerName || (col as any).field?.toString() || '';
  }
  
  getSortIndicator(col: Column | ColDef<TData> | ColGroupDef<TData>): string {
    if ('children' in col || !col.sort) {
      return '';
    }
    return col.sort === 'asc' ? '▲' : '▼';
  }
  
  onHeaderClick(col: Column | ColDef<TData> | ColGroupDef<TData>): void {
    if (!this.isSortable(col) || 'children' in col) {
      return;
    }
    
    // Toggle sort
    const currentSort = col.sort;
    const newSort = currentSort === 'asc' ? 'desc' : currentSort === 'desc' ? null : 'asc';
    
    const colId = (col as any).colId || (col as any).field?.toString() || '';
    
    // Update the column directly if it's a Column object
    if ('colId' in col && !(col as any).children) {
      (col as any).sort = newSort;
    }

    this.gridApi.setSortModel(newSort ? [{ colId, sort: newSort }] : []);
    this.canvasRenderer?.render();
  }

  // --- Header Menu Logic ---

  hasHeaderMenu(col: Column | ColDef<TData> | ColGroupDef<TData>): boolean {
    if ('children' in col) return false;
    const colDef = this.getColumnDefForColumn(col as any);
    return colDef ? colDef.suppressHeaderMenuButton !== true : true;
  }

  onHeaderMenuClick(event: MouseEvent, col: Column | ColDef<TData> | ColGroupDef<TData>): void {
    event.stopPropagation();
    
    if (this.activeHeaderMenu === col) {
      this.closeHeaderMenu();
      return;
    }

    this.activeHeaderMenu = col;
    
    // Position menu below the icon using fixed (viewport) coordinates
    const target = event.target as HTMLElement;
    const rect = target.getBoundingClientRect();
    
    let x = rect.right - 200; // Align right, assuming menu width ~200px
    let y = rect.bottom + 4;

    // Prevent menu from going off-screen
    if (x < 0) x = 0;
    if (x + 200 > window.innerWidth) x = window.innerWidth - 200;
    if (y + 250 > window.innerHeight) { // Assuming max menu height ~250px
      y = rect.top - 250; // Show above if overflows bottom
    }
    
    this.headerMenuPosition = { x, y };
    
    this.cdr.detectChanges();
  }

  closeHeaderMenu(): void {
    this.activeHeaderMenu = null;
    this.cdr.detectChanges();
  }

  onContainerClick(event: MouseEvent): void {
    if (this.activeHeaderMenu) {
      this.closeHeaderMenu();
    }
    if (this.activeContextMenu) {
      this.closeContextMenu();
    }
    // Handle closing editor on click outside
    if (this.isEditing) {
      const target = event.target as HTMLElement;
      if (!target.closest('.argent-grid-cell-editor')) {
        this.stopEditing(true);
      }
    }
  }

  onCanvasContextMenu(event: MouseEvent): void {
    event.preventDefault();
    
    // Get hit test from canvas renderer to know which cell was clicked
    const hitTest = this.canvasRenderer.getHitTestResult(event);
    if (!hitTest || hitTest.rowIndex === -1) return;
    
    const rowNode = this.gridApi.getDisplayedRowAtIndex(hitTest.rowIndex);
    const columns = this.gridApi.getAllColumns().filter(col => col.visible);
    const column = columns[hitTest.columnIndex];
    
    if (!rowNode || !column) return;
    
    this.contextMenuCell = { rowNode, column };
    this.activeContextMenu = true;
    
    // Position menu at mouse coordinates (fixed/viewport)
    let x = event.clientX;
    let y = event.clientY;

    // Prevent menu from going off-screen
    if (x + 200 > window.innerWidth) x = window.innerWidth - 200;
    if (y + 200 > window.innerHeight) y = window.innerHeight - 200;

    this.contextMenuPosition = { x, y };
    
    // Select the row
    this.gridApi.deselectAll();
    rowNode.selected = true;
    this.updateSelectionState();
    this.canvasRenderer?.render();
    this.selectionChanged.emit(this.gridApi.getSelectedRows());
    
    this.cdr.detectChanges();
  }

  closeContextMenu(): void {
    this.activeContextMenu = false;
    this.contextMenuCell = null;
    this.cdr.detectChanges();
  }

  copyContextMenuCell(): void {
    if (!this.contextMenuCell || !this.contextMenuCell.column.field) return;
    
    const val = (this.contextMenuCell.rowNode.data as any)[this.contextMenuCell.column.field];
    if (val !== undefined && val !== null) {
      navigator.clipboard.writeText(String(val)).catch(err => {
        console.error('Failed to copy text: ', err);
      });
    }
    this.closeContextMenu();
  }

  exportCSV(): void {
    this.gridApi.exportDataAsCsv();
    this.closeContextMenu();
  }

  exportExcel(): void {
    this.gridApi.exportDataAsExcel();
    this.closeContextMenu();
  }

  resetColumns(): void {
    if (this.initialColumnDefs) {
      // Deep copy back the original defs
      const restored = JSON.parse(JSON.stringify(this.initialColumnDefs));
      this.onColumnDefsChanged(restored);
      
      // Also clear sort model
      this.gridApi.setSortModel([]);
    }
    this.closeContextMenu();
  }

  sortColumnMenu(direction: 'asc' | 'desc' | null): void {
    if (!this.activeHeaderMenu) return;
    
    const col = this.activeHeaderMenu as any;
    const colId = col.colId || col.field?.toString() || '';
    
    // Update original ColDef to ensure persistence
    const colDef = this.getColumnDefForColumn(col);
    if (colDef) {
      colDef.sort = direction;
    }

    this.gridApi.setSortModel(direction ? [{ colId, sort: direction }] : []);
    this.canvasRenderer?.render();
    
    this.closeHeaderMenu();
  }

  hideColumnMenu(): void {
    if (!this.activeHeaderMenu) return;
    
    const col = this.activeHeaderMenu as any;
    
    // Update the original column definition
    const colDef = this.getColumnDefForColumn(col);
    if (colDef) {
      colDef.hide = true;
    }
    
    // Create new array to trigger change detection and API update
    if (this.columnDefs) {
      this.onColumnDefsChanged([...this.columnDefs]);
    }
    
    this.closeHeaderMenu();
  }

  pinColumnMenu(pin: 'left' | 'right' | null): void {
    if (!this.activeHeaderMenu) return;
    
    const col = this.activeHeaderMenu as any;
    
    // Update the original column definition
    const colDef = this.getColumnDefForColumn(col);
    if (colDef) {
      colDef.pinned = pin as any;
    }
    
    if (this.columnDefs) {
      this.onColumnDefsChanged([...this.columnDefs]);
    }
    
    this.closeHeaderMenu();
  }

  onColumnDropped(event: CdkDragDrop<any[]>, pinType: 'left' | 'right' | 'none'): void {
    if (!this.columnDefs) return;

    // Get current groups (using internal Columns)
    const left = [...this.getLeftPinnedColumns()];
    const center = [...this.getNonPinnedColumns()];
    const right = [...this.getRightPinnedColumns()];

    const containerMap: { [key: string]: any[] } = {
      'left-pinned': left,
      'scrollable': center,
      'right-pinned': right
    };

    const previousContainerData = containerMap[event.previousContainer.id];
    const currentContainerData = containerMap[event.container.id];

    if (event.previousContainer === event.container) {
      moveItemInArray(currentContainerData, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        previousContainerData,
        currentContainerData,
        event.previousIndex,
        event.currentIndex
      );

      // Update pinned state of the moved column in its original definition
      const movedCol = currentContainerData[event.currentIndex] as Column;
      const colDef = this.getColumnDefForColumn(movedCol);
      if (colDef) {
        colDef.pinned = pinType === 'none' ? null : pinType as any;
      }
    }

    // Map internal Columns back to their original ColDefs in the new order
    const orderedVisibleColDefs: (ColDef<TData> | ColGroupDef<TData>)[] = [];
    [...left, ...center, ...right].forEach(col => {
      const def = this.getColumnDefForColumn(col);
      if (def) orderedVisibleColDefs.push(def);
    });

    // Reconstruct full columnDefs array, maintaining hidden columns
    const hidden = this.columnDefs.filter(c => {
      if ('children' in c) return false;
      return (c as ColDef).hide;
    });
    
    const newDefs = [...orderedVisibleColDefs, ...hidden];
    
    this.onColumnDefsChanged(newDefs);
  }

  // --- Column Resizing Logic ---

  isResizable(col: Column | ColDef<TData> | ColGroupDef<TData>): boolean {
    if ('children' in col) return false;
    const colDef = this.getColumnDefForColumn(col as any);
    return colDef ? colDef.resizable !== false : true;
  }

  onResizeMouseDown(event: MouseEvent, col: Column): void {
    event.stopPropagation();
    event.preventDefault();

    this.isResizing = true;
    this.resizeColumn = col;
    this.resizeStartX = event.clientX;
    this.resizeStartWidth = col.width;

    const mouseMoveHandler = (e: MouseEvent) => this.onResizeMouseMove(e);
    const mouseUpHandler = () => {
      this.onResizeMouseUp();
      window.removeEventListener('mousemove', mouseMoveHandler);
      window.removeEventListener('mouseup', mouseUpHandler);
    };

    window.addEventListener('mousemove', mouseMoveHandler);
    window.addEventListener('mouseup', mouseUpHandler);
  }

  private onResizeMouseMove(event: MouseEvent): void {
    if (!this.isResizing || !this.resizeColumn) return;

    const deltaX = event.clientX - this.resizeStartX;
    const newWidth = Math.max(20, this.resizeStartWidth + deltaX);
    
    // Update internal column width
    this.resizeColumn.width = newWidth;
    
    // Update original ColDef
    const colDef = this.getColumnDefForColumn(this.resizeColumn);
    if (colDef) {
      colDef.width = newWidth;
    }

    // Force re-render
    this.canvasRenderer?.render();
    this.cdr.detectChanges();
  }

  private onResizeMouseUp(): void {
    this.isResizing = false;
    this.resizeColumn = null;
  }

  // --- Floating Filter Logic ---

  hasFloatingFilters(): boolean {
    if (this.gridApi?.getGridOption('floatingFilter')) return true;
    
    if (!this.columnDefs) return false;
    return this.columnDefs.some(col => {
      if ('children' in col) {
        return col.children.some(child => 'floatingFilter' in child && child.floatingFilter);
      }
      return col.floatingFilter;
    });
  }

  isFloatingFilterEnabled(col: Column | ColDef<TData> | ColGroupDef<TData>): boolean {
    const colDef = this.getColumnDefForColumn(col as any);
    if (!colDef || 'children' in colDef) return false;
    if (!colDef.filter) return false;
    
    if (colDef.floatingFilter === true) return true;
    if (colDef.floatingFilter === false) return false;
    
    return !!this.gridApi?.getGridOption('floatingFilter');
  }

  isFilterable(col: Column | ColDef<TData> | ColGroupDef<TData>): boolean {
    const colDef = this.getColumnDefForColumn(col as any);
    if (!colDef || 'children' in colDef) return false;
    return !!colDef.filter;
  }

  getFilterInputType(col: Column | ColDef<TData> | ColGroupDef<TData>): string {
    const colDef = this.getColumnDefForColumn(col as any);
    if (!colDef || 'children' in colDef) return 'text';
    const filter = colDef.filter;
    if (filter === 'number') return 'number';
    if (filter === 'date') return 'date';
    return 'text';
  }

  private filterTimeout: any;
  onFloatingFilterInput(event: Event, col: Column | ColDef<TData> | ColGroupDef<TData>): void {
    const colDef = this.getColumnDefForColumn(col as any);
    if (!colDef || 'children' in colDef) return;
    
    const input = event.target as HTMLInputElement;
    const value = input.value;
    const colId = (col as any).colId || (col as any).field?.toString() || '';

    this.cdr.detectChanges(); // Update clear button visibility immediately

    clearTimeout(this.filterTimeout);
    this.filterTimeout = setTimeout(() => {
      const currentModel = this.gridApi.getFilterModel();
      
      if (!value) {
        delete currentModel[colId];
      } else {
        const filterType = this.getFilterTypeFromCol(colDef);
        currentModel[colId] = {
          filterType: filterType as any,
          type: filterType === 'text' ? 'contains' : 'equals',
          filter: value
        };
      }

      this.gridApi.setFilterModel(currentModel);
      this.canvasRenderer?.render();
    }, 300);
  }

  private getFilterTypeFromCol(col: ColDef<TData>): string {
    const filter = col.filter;
    if (filter === 'number') return 'number';
    if (filter === 'date') return 'date';
    if (filter === 'boolean') return 'boolean';
    return 'text';
  }

  getFloatingFilterValue(col: Column | ColDef<TData> | ColGroupDef<TData>): string {
    if (!this.gridApi) return '';
    const colId = (col as any).colId || (col as any).field?.toString() || '';
    const model = this.gridApi.getFilterModel();
    return model[colId]?.filter || '';
  }

  hasFilterValue(col: Column | ColDef<TData> | ColGroupDef<TData>, input: HTMLInputElement): boolean {
    return !!this.getFloatingFilterValue(col);
  }

  clearFloatingFilter(col: Column | ColDef<TData> | ColGroupDef<TData>, input: HTMLInputElement): void {
    const colDef = this.getColumnDefForColumn(col as any);
    if (!colDef || 'children' in colDef) return;
    
    input.value = '';
    const colId = (col as any).colId || (col as any).field?.toString() || '';
    
    const currentModel = this.gridApi.getFilterModel();
    delete currentModel[colId];
    
    this.gridApi.setFilterModel(currentModel);
    this.canvasRenderer?.render();
    this.cdr.detectChanges();
  }
  
  // Public API methods
  getApi(): GridApi<TData> {
    return this.gridApi;
  }

  refresh(): void {
    this.canvasRenderer?.render();
  }

  // Cell Editing Methods
  startEditing(rowIndex: number, colId: string): void {
    const rowNode = this.gridApi.getDisplayedRowAtIndex(rowIndex);
    const column = this.gridApi.getColumn(colId);
    
    // Prevent editing on group rows or missing data/column
    if (!rowNode || rowNode.group || !column || !column.field) return;
    
    // Check if cell is editable
    const colDef = this.getColumnDefForColumn(column);
    if (colDef && colDef.editable === false) return;
    
    // If already editing another cell, stop it first
    if (this.isEditing) {
      this.stopEditing(true);
    }

    const value = (rowNode.data as any)[column.field];
    
    this.editingRowNode = rowNode;
    this.editingColDef = colDef;
    this.editingValue = value !== null && value !== undefined ? String(value) : '';
    
    // Calculate editor position based on row and column
    const columns = this.gridApi.getAllColumns().filter(c => c.visible);
    let x = 0;
    for (const col of columns) {
      if (col.colId === colId) break;
      x += col.width;
    }
    
    this.editorPosition = {
      x: x - this.canvasRenderer.currentScrollLeft,
      y: (rowIndex * this.rowHeight) - this.canvasRenderer.currentScrollTop,
      width: column.width,
      height: this.rowHeight
    };
    
    this.isEditing = true;
    
    // Focus input after view update
    setTimeout(() => {
      if (this.editorInputRef) {
        const input = this.editorInputRef.nativeElement;
        input.focus();
        input.select();
      }
    }, 0);
  }

  stopEditing(save: boolean = true): void {
    if (!this.isEditing) return;
    
    const rowNode = this.editingRowNode;
    const colDef = this.editingColDef;

    // Capture current value from input directly if it exists, to be sure
    if (this.editorInputRef) {
      this.editingValue = this.editorInputRef.nativeElement.value;
    }

    if (save && colDef && rowNode) {
      const newValue = this.editingValue;
      const field = colDef.field as string;
      const oldValue = (rowNode.data as any)[field];

      // Apply valueParser if provided
      let parsedValue: any = newValue;
      if (typeof colDef.valueParser === 'function') {
        parsedValue = colDef.valueParser({
          value: rowNode.data,
          newValue,
          data: rowNode.data,
          node: rowNode,
          colDef,
          api: this.gridApi
        });
      }

      // Apply valueSetter if provided
      if (typeof colDef.valueSetter === 'function') {
        colDef.valueSetter({
          value: parsedValue,
          newValue: parsedValue,
          data: rowNode.data,
          node: rowNode,
          colDef,
          api: this.gridApi
        });
      } else if (field) {
        // Default: update data directly
        (rowNode.data as any)[field] = parsedValue;
      }

      // Update via transaction
      this.gridApi.applyTransaction({
        update: [rowNode.data]
      });
      
      // Trigger callback
      if (colDef.onCellValueChanged) {
        const column = this.gridApi.getColumn(colDef.colId || field || '');
        if (column) {
          colDef.onCellValueChanged({
            newValue: parsedValue,
            oldValue,
            data: rowNode.data,
            node: rowNode,
            column
          });
        }
      }
      
      this.canvasRenderer?.render();
    }
    
    this.isEditing = false;
    this.editingRowNode = null;
    this.editingColDef = null;
    this.cdr.detectChanges();
  }

  onEditorInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.editingValue = input.value;
  }

  onEditorKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.stopEditing(true);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.stopEditing(false);
    } else if (event.key === 'Tab') {
      event.preventDefault();
      const currentRowIndex = this.editingRowNode?.displayedRowIndex ?? -1;
      const currentColId = this.editingColDef?.colId || this.editingColDef?.field?.toString() || '';
      
      this.stopEditing(true);

      // Standard AG Grid Tab behavior: move to next cell
      if (currentRowIndex !== -1) {
        this.moveToNextCell(currentRowIndex, currentColId, event.shiftKey);
      }
    }
  }

  private moveToNextCell(rowIndex: number, colId: string, backwards: boolean): void {
    const columns = this.gridApi.getAllColumns().filter(c => c.visible);
    const colIndex = columns.findIndex(c => c.colId === colId);
    
    if (colIndex === -1) return;

    let nextColIndex = backwards ? colIndex - 1 : colIndex + 1;
    let nextRowIndex = rowIndex;

    if (nextColIndex >= columns.length) {
      nextColIndex = 0;
      nextRowIndex++;
    } else if (nextColIndex < 0) {
      nextColIndex = columns.length - 1;
      nextRowIndex--;
    }

    if (nextRowIndex >= 0 && nextRowIndex < this.gridApi.getDisplayedRowCount()) {
      const nextCol = columns[nextColIndex];
      this.startEditing(nextRowIndex, nextCol.colId);
    }
  }

  onEditorBlur(): void {
    // Save on blur, matching AG Grid default behavior
    if (this.isEditing) {
      this.stopEditing(true);
    }
  }
  private getColumnDefForColumn(column: Column | ColDef<TData> | ColGroupDef<TData>): ColDef<TData> | null {
    if (!this.columnDefs) return null;
    
    const colId = (column as any).colId || (column as any).field?.toString();
    if (!colId) return null;

    for (const def of this.columnDefs) {
      if ('children' in def) {
        const found = def.children.find(c => {
          const cDef = c as ColDef;
          return cDef.colId === colId || cDef.field?.toString() === colId;
        });
        if (found) return found as ColDef<TData>;
      } else {
        const cDef = def as ColDef;
        if (cDef.colId === colId || cDef.field?.toString() === colId) {
          return def as ColDef<TData>;
        }
      }
    }
    return null;
  }

  // Selection Methods
  onRowClick(rowIndex: number, event: MouseEvent): void {
    const rowNode = this.gridApi.getDisplayedRowAtIndex(rowIndex);
    if (!rowNode) return;

    // Handle multi-select with Ctrl/Cmd
    if (event.ctrlKey || event.metaKey) {
      rowNode.selected = !rowNode.selected;
    } else if (event.shiftKey) {
      // Range selection (TODO: implement)
      rowNode.selected = true;
    } else {
      // Single select - deselect all others
      this.gridApi.deselectAll();
      rowNode.selected = true;
    }

    this.updateSelectionState();
    this.canvasRenderer?.render();
    this.selectionChanged.emit(this.gridApi.getSelectedRows());
  }

  onSelectionHeaderClick(): void {
    // Toggle all
    if (this.isAllSelected) {
      this.gridApi.deselectAll();
    } else {
      this.gridApi.selectAll();
    }
    this.updateSelectionState();
    this.canvasRenderer?.render();
    this.selectionChanged.emit(this.gridApi.getSelectedRows());
  }

  onSelectionHeaderChange(event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    if (checkbox.checked) {
      this.gridApi.selectAll();
    } else {
      this.gridApi.deselectAll();
    }
    this.updateSelectionState();
    this.canvasRenderer?.render();
    this.selectionChanged.emit(this.gridApi.getSelectedRows());
  }

  updateSelectionState(): void {
    const selectedCount = this.gridApi.getSelectedRows().length;
    const totalCount = this.gridApi.getDisplayedRowCount();
    
    this.isAllSelected = selectedCount === totalCount && totalCount > 0;
    this.isIndeterminateSelection = selectedCount > 0 && selectedCount < totalCount;
  }
}
