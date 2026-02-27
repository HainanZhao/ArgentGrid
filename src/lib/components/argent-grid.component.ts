import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ElementRef, ViewChild, ChangeDetectionStrategy, AfterViewInit, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { GridApi, GridOptions, ColDef, ColGroupDef, IRowNode, Column } from '../types/ag-grid-types';
import { GridService } from '../services/grid.service';
import { CanvasRenderer } from '../rendering/canvas-renderer';
import { Subject } from 'rxjs';

@Component({
  selector: 'argent-grid',
  template: `
    <div class="argent-grid-container" [style.height]="height" [style.width]="width">
      <!-- Header Layer (DOM-based for accessibility) -->
      <div class="argent-grid-header">
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
          <div
            *ngFor="let col of getLeftPinnedColumns()"
            class="argent-grid-header-cell argent-grid-header-cell-pinned-left"
            [style.width.px]="getColumnWidth(col)"
            [class.sortable]="isSortable(col)"
            (click)="onHeaderClick(col)">
            {{ getHeaderName(col) }}
            <span class="sort-indicator" *ngIf="getSortIndicator(col)">{{ getSortIndicator(col) }}</span>
          </div>
          
          <!-- Scrollable Columns -->
          <div class="argent-grid-header-scrollable">
            <div class="argent-grid-header-row">
              <div
                *ngFor="let col of getNonPinnedColumns()"
                class="argent-grid-header-cell"
                [style.width.px]="getColumnWidth(col)"
                [class.sortable]="isSortable(col)"
                (click)="onHeaderClick(col)">
                {{ getHeaderName(col) }}
                <span class="sort-indicator" *ngIf="getSortIndicator(col)">{{ getSortIndicator(col) }}</span>
              </div>
            </div>
          </div>
          
          <!-- Right Pinned Columns -->
          <div
            *ngFor="let col of getRightPinnedColumns()"
            class="argent-grid-header-cell argent-grid-header-cell-pinned-right"
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
        <!-- Spacer to create scrollbars for virtual scrolling -->
        <div class="argent-grid-scroll-spacer" [style.height.px]="totalHeight" [style.width.px]="totalWidth"></div>
        
        <canvas #gridCanvas class="argent-grid-canvas"></canvas>
        
        <!-- Cell Editor Overlay -->
        <div class="argent-grid-cell-editor" 
             *ngIf="isEditing"
             [style.top.px]="editorPosition.y"
             [style.left.px]="editorPosition.x"
             [style.width.px]="editorPosition.width"
             [style.height.px]="editorPosition.height">
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
    </div>
  `,
  styles: [`
    .argent-grid-container {
      position: relative;
      overflow: hidden;
      border: 1px solid #e0e0e0;
      background: #fff;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      display: flex;
      flex-direction: column;
    }

    .argent-grid-header {
      border-bottom: 1px solid #e0e0e0;
      background: #f5f5f5;
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

    .argent-grid-header-cell {
      padding: 8px 12px;
      border-right: 1px solid #e0e0e0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      cursor: pointer;
      user-select: none;
      flex-shrink: 0;
    }

    .argent-grid-header-cell-pinned-left {
      position: sticky;
      left: 0;
      z-index: 10;
      border-right: 2px solid #ccc;
    }

    .argent-grid-header-cell-pinned-right {
      position: sticky;
      right: 0;
      z-index: 10;
      border-left: 2px solid #ccc;
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
  @ViewChild('editorInput') editorInputRef!: ElementRef<HTMLInputElement>;

  canvasHeight = 0;
  showOverlay = false;
  private viewportHeight = 500;

  get totalHeight(): number {
    return (this.rowData?.length || 0) * this.rowHeight;
  }

  get totalWidth(): number {
    if (!this.columnDefs) return 0;
    return this.columnDefs.reduce((sum, col) => sum + this.getColumnWidth(col), 0);
  }

  // Selection state
  showSelectionColumn = false;
  selectionColumnWidth = 50;
  isAllSelected = false;
  isIndeterminateSelection = false;

  // Cell editing state
  isEditing = false;
  editingValue = '';
  editorPosition = { x: 0, y: 0, width: 100, height: 32 };
  private editingRowNode: IRowNode<TData> | null = null;
  private editingColDef: ColDef<TData> | null = null;

  private gridApi!: GridApi<TData>;
  private canvasRenderer!: CanvasRenderer;
  private destroy$ = new Subject<void>();
  private gridService = new GridService<TData>();

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
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
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.gridApi?.destroy();
    this.canvasRenderer?.destroy();
  }

  private initializeGrid(): void {
    console.log('[ArgentGrid] initializeGrid:', { columnDefs: this.columnDefs?.length, rowData: this.rowData?.length });

    // Initialize grid API
    this.gridApi = this.gridService.createApi(this.columnDefs, this.rowData);

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
    console.log('[ArgentGrid] onRowDataChanged:', newData?.length);
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
  }
  
  getColumnWidth(col: ColDef<TData> | ColGroupDef<TData>): number {
    if ('children' in col) {
      // Column group - sum children widths
      return col.children.reduce((sum, child) => sum + this.getColumnWidth(child), 0);
    }
    return col.width || 150;
  }

  getLeftPinnedColumns(): (ColDef<TData> | ColGroupDef<TData>)[] {
    if (!this.columnDefs) return [];
    return this.columnDefs.filter(col => {
      if ('children' in col) return false;
      return col.pinned === 'left';
    });
  }

  getRightPinnedColumns(): (ColDef<TData> | ColGroupDef<TData>)[] {
    if (!this.columnDefs) return [];
    return this.columnDefs.filter(col => {
      if ('children' in col) return false;
      return col.pinned === 'right';
    });
  }

  getNonPinnedColumns(): (ColDef<TData> | ColGroupDef<TData>)[] {
    if (!this.columnDefs) return [];
    return this.columnDefs.filter(col => {
      if ('children' in col) return false;
      return !col.pinned;
    });
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

  // Cell Editing Methods
  startEditing(rowIndex: number, colId: string): void {
    const rowNode = this.gridApi.getDisplayedRowAtIndex(rowIndex);
    const column = this.gridApi.getColumn(colId);
    
    if (!rowNode || !column || !column.field) return;
    
    // Check if cell is editable
    const colDef = this.getColumnDefForColumn(column);
    if (colDef && colDef.editable === false) return;
    
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
      x: x - this.canvasRenderer?.['scrollLeft'] || 0,
      y: (rowIndex * this.rowHeight) - (this.canvasRenderer?.['scrollTop'] || 0),
      width: column.width,
      height: this.rowHeight
    };
    
    this.isEditing = true;
    
    // Focus input after view update
    setTimeout(() => {
      if (this.editorInputRef) {
        this.editorInputRef.nativeElement.focus();
        this.editorInputRef.nativeElement.select();
      }
    }, 0);
  }

  stopEditing(save: boolean = true): void {
    if (!this.isEditing || !this.editingRowNode || !this.editingColDef) return;
    
    if (save && this.editingColDef && this.editingRowNode) {
      const newValue = this.editingValue;
      const colDef = this.editingColDef;
      
      // Apply valueParser if provided
      let parsedValue: any = newValue;
      if (typeof colDef.valueParser === 'function') {
        parsedValue = colDef.valueParser({
          value: this.editingRowNode.data,
          newValue,
          data: this.editingRowNode.data,
          node: this.editingRowNode,
          colDef,
          api: this.gridApi
        });
      }

      // Apply valueSetter if provided
      if (typeof colDef.valueSetter === 'function') {
        colDef.valueSetter({
          value: parsedValue,
          newValue: parsedValue,
          data: this.editingRowNode.data,
          node: this.editingRowNode,
          colDef,
          api: this.gridApi
        });
      } else if (colDef.field) {
        // Default: update data directly
        (this.editingRowNode.data as any)[colDef.field] = parsedValue;
      }
      
      // Update via transaction
      this.gridApi.applyTransaction({
        update: [this.editingRowNode.data]
      });
      
      // Trigger callback
      if (colDef.onCellValueChanged) {
        const column = this.gridApi.getColumn(colDef.colId || colDef.field?.toString() || '');
        if (column) {
          colDef.onCellValueChanged({
            newValue: parsedValue,
            oldValue: (this.editingRowNode.data as any)[colDef.field],
            data: this.editingRowNode.data,
            node: this.editingRowNode,
            column
          });
        }
      }
      
      this.canvasRenderer?.render();
    }
    
    this.isEditing = false;
    this.editingRowNode = null;
    this.editingColDef = null;
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
      this.stopEditing(true);
      // TODO: Move to next cell
    }
  }

  onEditorBlur(): void {
    // Delay to allow click events to propagate
    setTimeout(() => {
      if (this.isEditing) {
        this.stopEditing(true);
      }
    }, 100);
  }

  private getColumnDefForColumn(column: Column): ColDef<TData> | null {
    if (!this.columnDefs) return null;
    
    for (const def of this.columnDefs) {
      if ('children' in def) {
        const found = def.children.find(c => 'colId' in c && c.colId === column.colId);
        if (found && 'colId' in found) return found as ColDef<TData>;
      } else if (def.colId === column.colId) {
        return def;
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
