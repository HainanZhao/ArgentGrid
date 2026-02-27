import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ElementRef, ViewChild, ChangeDetectionStrategy, AfterViewInit, OnChanges, SimpleChanges, ChangeDetectorRef, Inject } from '@angular/core';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { GridApi, GridOptions, ColDef, ColGroupDef, IRowNode, Column, CellRange } from '../types/ag-grid-types';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { GridService } from '../services/grid.service';
import { CanvasRenderer } from '../rendering/canvas-renderer';

@Component({
  selector: 'argent-grid',
  templateUrl: './argent-grid.component.html',
  styleUrls: ['./argent-grid.component.css'],
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
    if (this.gridApi) return this.gridApi.getTotalHeight();
    return (this.rowData?.length || 0) * this.rowHeight;
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

  // Range Selection state
  isRangeSelecting = false;
  private rangeStartCell: { rowIndex: number, colId: string } | null = null;

  // Side Bar state
  sideBarVisible = false;
  activeToolPanel: 'columns' | 'filters' | null = null;

  // Context Menu state
  activeContextMenu = false;
  contextMenuPosition = { x: 0, y: 0 };
  private contextMenuCell: { rowNode: IRowNode<TData>, column: Column } | null = null;
  private initialColumnDefs: (ColDef<TData> | ColGroupDef<TData>)[] | null = null;

  private gridApi!: GridApi<TData>;
  private canvasRenderer!: CanvasRenderer;
  private destroy$ = new Subject<void>();
  private gridService = new GridService<TData>();
  private horizontalScrollListener?: (e: Event) => void;
  private resizeObserver?: ResizeObserver;

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

      // Range Selection Logic
      this.canvasRenderer.onMouseDown = (event, rowIndex, colId) => {
        if (event.button !== 0 || !colId || rowIndex === -1) return;
        
        const rangeSelectionEnabled = this.gridApi?.getGridOption('enableRangeSelection');
        if (!rangeSelectionEnabled) return;

        this.isRangeSelecting = true;
        this.rangeStartCell = { rowIndex, colId };
        
        // Clear previous selection if not holding Shift/Ctrl
        if (!event.shiftKey && !event.ctrlKey && !event.metaKey) {
          this.gridApi?.clearRangeSelection();
        }
      };

      this.canvasRenderer.onMouseMove = (event, rowIndex, colId) => {
        if (!this.isRangeSelecting || !this.rangeStartCell || !colId || rowIndex === -1) return;

        const start = this.rangeStartCell;
        const end = { rowIndex, colId };

        const columns = this.canvasRenderer.getAllColumns();
        const startColIdx = columns.findIndex(c => c.colId === start.colId);
        const endColIdx = columns.findIndex(c => c.colId === end.colId);

        if (startColIdx === -1 || endColIdx === -1) return;

        const range: CellRange = {
          startRow: Math.min(start.rowIndex, end.rowIndex),
          endRow: Math.max(start.rowIndex, end.rowIndex),
          startColumn: columns[Math.min(startColIdx, endColIdx)].colId,
          endColumn: columns[Math.max(startColIdx, endColIdx)].colId,
          columns: columns.slice(Math.min(startColIdx, endColIdx), Math.max(startColIdx, endColIdx) + 1)
        };

        this.gridApi?.addCellRange(range);
      };

      this.canvasRenderer.onMouseUp = () => {
        this.isRangeSelecting = false;
      };
    }

    // Setup viewport dimensions and resize observer
    if (this.viewportRef) {
      const rect = this.viewportRef.nativeElement.getBoundingClientRect();
      this.viewportHeight = rect.height || 500;
      this.canvasRenderer?.setViewportDimensions(rect.width, this.viewportHeight);
      this.canvasRenderer?.setTotalRowCount(this.rowData?.length || 0);

      // Synchronize horizontal scroll with DOM header
      this.horizontalScrollListener = () => {
        if (this.headerScrollableRef) {
          this.headerScrollableRef.nativeElement.scrollLeft = this.viewportRef.nativeElement.scrollLeft;
        }
        if (this.headerScrollableFilterRef) {
          this.headerScrollableFilterRef.nativeElement.scrollLeft = this.viewportRef.nativeElement.scrollLeft;
        }
      };
      
      this.viewportRef.nativeElement.addEventListener('scroll', this.horizontalScrollListener, { passive: true });

      // Add ResizeObserver to handle sidebar toggling and other size changes
      if (typeof ResizeObserver !== 'undefined') {
        this.resizeObserver = new ResizeObserver(entries => {
          for (const entry of entries) {
            const { width, height } = entry.contentRect;
            this.viewportHeight = height;
            this.canvasRenderer?.setViewportDimensions(width, height);
            this.canvasRenderer?.render();
            this.cdr.detectChanges();
          }
        });
        this.resizeObserver.observe(this.viewportRef.nativeElement);
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    // Remove horizontal scroll listener
    if (this.viewportRef && this.horizontalScrollListener) {
      this.viewportRef.nativeElement.removeEventListener('scroll', this.horizontalScrollListener);
    }

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }

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

    // Sidebar state
    this.sideBarVisible = !!this.gridOptions?.sideBar;
    if (this.sideBarVisible && !this.activeToolPanel) {
      this.activeToolPanel = 'columns';
    }

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

  // Side Bar Methods
  toggleToolPanel(panel: 'columns' | 'filters'): void {
    if (this.activeToolPanel === panel) {
      this.activeToolPanel = null;
    } else {
      this.activeToolPanel = panel;
    }
    this.cdr.detectChanges();
  }

  toggleColumnVisibility(col: Column): void {
    const colDef = this.getColumnDefForColumn(col);
    if (colDef) {
      colDef.hide = col.visible; // Toggle
      this.initializeGrid(); // Re-initialize to handle visibility changes correctly
      this.canvasRenderer?.render();
      this.cdr.detectChanges();
    }
  }

  getAllColumns(): Column[] {
    return this.gridApi?.getAllColumns() || [];
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

  hasRangeSelection(): boolean {
    return (this.gridApi?.getCellRanges()?.length || 0) > 0;
  }

  copyRangeWithHeaders(): void {
    const ranges = this.gridApi?.getCellRanges();
    if (!ranges || ranges.length === 0) return;

    const range = ranges[0];
    const columns = range.columns;
    
    let text = columns.map(c => this.getHeaderName(c)).join('\t') + '\n';

    for (let i = range.startRow; i <= range.endRow; i++) {
      const node = this.gridApi.getDisplayedRowAtIndex(i);
      if (node) {
        text += columns.map(c => {
          const val = (node.data as any)[c.field || ''];
          return val !== null && val !== undefined ? String(val) : '';
        }).join('\t') + '\n';
      }
    }

    navigator.clipboard.writeText(text).catch(err => {
      console.error('Failed to copy range: ', err);
    });
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

  getLastFrameTime(): number {
    return this.canvasRenderer?.lastFrameTime || 0;
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
