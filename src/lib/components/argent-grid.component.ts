import { type CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import {
  type AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  type ComponentRef,
  ElementRef,
  EventEmitter,
  HostListener,
  Inject,
  Input,
  type OnChanges,
  type OnDestroy,
  type OnInit,
  Output,
  type SimpleChanges,
  type Type,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AriaRowMirror } from '../rendering/aria-row-mirror';
import { CanvasRenderer } from '../rendering/canvas-renderer';
import { CellOverlayManager } from '../rendering/cell-overlay-manager';
import {
  getCellValue,
  getFormattedValue,
  getTextLineHeight,
  groupIndicatorAreaWidth,
  resolveCellEditor,
  resolveFilterComponent,
  resolveHeaderComponent,
  wrapLines,
} from '../rendering/render/cells';
import { getColumnDef, isColumnVisible } from '../rendering/render/column-utils';
import { getFontFromTheme } from '../rendering/render/theme';
import { GridService } from '../services/grid.service';
import { applyThemeCSSVariables, convertThemeToGridTheme } from '../themes/theme-builder';
import type {
  CellRange,
  ColDef,
  ColGroupDef,
  Column,
  ColumnGroup,
  DefaultMenuItem,
  FilterModelItem,
  GetContextMenuItemsParams,
  GridApi,
  GridOptions,
  ICellEditorAngularComp,
  ICellEditorParams,
  IDoesFilterPassParams,
  IFilterAngularComp,
  IFilterParams,
  IHeaderAngularComp,
  IHeaderParams,
  IRowNode,
  MenuItemDef,
  RowSelectionOptions,
  SortDirection,
} from '../types/ag-grid-types';

@Component({
  selector: 'argent-grid',
  templateUrl: './argent-grid.component.html',
  styleUrls: ['./argent-grid.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArgentGridComponent<TData = any>
  implements OnInit, OnDestroy, AfterViewInit, OnChanges
{
  @Input() columnDefs: (ColDef<TData> | ColGroupDef<TData>)[] | null = null;
  @Input() rowData: TData[] | null = null;
  @Input() gridOptions: GridOptions<TData> | null = null;
  @Input() theme: any;
  @Input() height = '500px';
  @Input() width = '100%';
  @Input() rowHeight?: number;
  @Input() rowSelection: RowSelectionOptions | 'single' | 'multiple' | undefined;

  @Output() gridReady = new EventEmitter<GridApi<TData>>();
  @Output() rowClicked = new EventEmitter<{ data: TData; node: IRowNode<TData> }>();
  @Output() selectionChanged = new EventEmitter<IRowNode<TData>[]>();

  @ViewChild('gridCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('viewport') viewportRef!: ElementRef<HTMLDivElement>;
  @ViewChild('headerScrollable') headerScrollableRef!: ElementRef<HTMLDivElement>;
  @ViewChild('headerScrollableFilter') headerScrollableFilterRef!: ElementRef<HTMLDivElement>;
  @ViewChild('editorInput') editorInputRef!: ElementRef<HTMLInputElement>;
  @ViewChild('editorContainer') editorContainerRef?: ElementRef<HTMLDivElement>;
  @ViewChild('customFilterContainer') customFilterContainerRef?: ElementRef<HTMLDivElement>;
  @ViewChild('cellOverlayLayer') cellOverlayLayerRef!: ElementRef<HTMLDivElement>;
  @ViewChild('ariaLayer') ariaLayerRef?: ElementRef<HTMLDivElement>;

  canvasHeight = 0;
  showOverlay = false;
  activeOverlay: 'loading' | 'noRows' | null = null;
  private viewportHeight = 500;

  /**
   * Returns the current effective row height, prioritizing grid options, then the input property, and defaulting to 32.
   */
  get effectiveRowHeight(): number {
    return this.gridApi?.getGridOption('rowHeight') || this.rowHeight || 32;
  }

  /**
   * Returns the current effective header height, prioritizing grid options, then defaulting to effectiveRowHeight.
   */
  get effectiveHeaderHeight(): number {
    const headerHeight = this.gridApi?.getGridOption('headerHeight');
    return headerHeight !== undefined ? headerHeight : this.effectiveRowHeight;
  }

  get totalHeight(): number {
    if (this.gridApi) return this.gridApi.getTotalHeight();
    return (this.rowData?.length || 0) * (this.rowHeight || 32);
  }

  get totalWidth(): number {
    if (!this.gridApi) return 0;
    return this.gridApi
      .getAllColumns()
      .filter((col) => isColumnVisible(col))
      .reduce((sum, col) => sum + Math.floor(col.width || 150), 0);
  }

  // --- Accessibility (T2.4) ---
  /** Whether to emit grid/header/row ARIA semantics at all. */
  get accessibilityEnabled(): boolean {
    return !this.gridApi?.getGridOption('suppressAccessibility');
  }

  /** `treegrid` when the grid is hierarchical (tree data or row grouping), else `grid`. */
  get gridRole(): string | null {
    if (!this.accessibilityEnabled) return null;
    const treeData = this.gridApi?.getGridOption('treeData');
    return treeData || this.rowGroupColumns.length > 0 ? 'treegrid' : 'grid';
  }

  /** Accessible name for the grid root. */
  get ariaLabel(): string | null {
    if (!this.accessibilityEnabled) return null;
    return (this.gridApi?.getGridOption('ariaLabel') as string) || 'Data grid';
  }

  /** Total displayed rows + header rows (1-based ARIA convention). */
  get ariaRowCount(): number | null {
    if (!this.accessibilityEnabled || !this.gridApi) return null;
    return this.gridApi.getDisplayedRowCount() + this.gridApi.getHeaderDepth();
  }

  /** Total displayed (visible) columns. */
  get ariaColCount(): number | null {
    if (!this.accessibilityEnabled || !this.gridApi) return null;
    return this.gridApi.getAllColumns().filter((col) => isColumnVisible(col)).length;
  }

  /** `aria-activedescendant` target id — the focused cell's mirror node. */
  activeDescendantId: string | null = null;

  /** Map a column's sort state to the `aria-sort` token (none/ascending/descending). */
  getAriaSort(col: Column | ColDef<TData> | ColGroupDef<TData>): string | null {
    if (!this.accessibilityEnabled || 'children' in col || !this.isSortable(col)) return null;
    return col.sort === 'asc' ? 'ascending' : col.sort === 'desc' ? 'descending' : 'none';
  }

  /** Absolute 1-based ARIA column index for a header item, in displayed order. */
  getAriaColIndex(item: Column | ColumnGroup): number | null {
    if (!this.accessibilityEnabled || !this.gridApi) return null;
    const cols = this.gridApi.getAllColumns().filter((c) => isColumnVisible(c));
    const colId = (item as any).colId;
    const idx = cols.findIndex((c) => c.colId === colId);
    return idx >= 0 ? idx + 1 : null;
  }

  /** Recompute `aria-activedescendant` from the current focused cell. */
  private updateActiveDescendant(): void {
    const focused = this.gridApi?.getFocusedCell();
    this.activeDescendantId = focused?.column
      ? (this.ariaRowMirror?.getActiveDescendantId(focused.rowIndex, focused.column.colId) ?? null)
      : null;
  }

  // Selection state
  showSelectionColumn = false;
  selectionColumnWidth = 50;
  isAllSelected = false;
  isIndeterminateSelection = false;

  hasCheckboxSelection(col: Column): boolean {
    return col.colId === 'ag-Grid-SelectionColumn';
  }

  hasHeaderCheckbox(col: Column): boolean {
    return !!col.headerCheckboxSelection;
  }

  trackByColumn(index: number, col: Column | ColDef<TData> | ColGroupDef<TData>): string {
    return (col as any).colId || (col as any).field?.toString() || index.toString();
  }

  // Cell editing state
  isEditing = false;
  editingValue = '';
  editorPosition = { x: 0, y: 0, width: 100, height: 32 };
  private editingRowNode: IRowNode<TData> | null = null;
  private editingColDef: ColDef<TData> | null = null;
  /** Live instance of a custom `cellEditor` component, when one is in use. */
  private editingComponentRef: ComponentRef<ICellEditorAngularComp<TData>> | null = null;

  /** True while a custom `cellEditor` component (not the built-in input) is active. */
  get isComponentEditor(): boolean {
    return !!this.editingComponentRef;
  }

  // --- Custom header components (colDef.headerComponent) ---
  /** Resolved header component per colId (null = built-in header). Memoized so
   * template re-evaluation doesn't re-resolve; cleared when columns change. */
  private headerComponentCache = new Map<string, Type<IHeaderAngularComp> | null>();
  /** Stable IHeaderParams reference per colId so the outlet directive only
   * refreshes on `headerStateVersion` bumps, never on identity churn. */
  private headerParamsCache = new Map<string, IHeaderParams<TData>>();
  /** Bumped on sort/filter/column changes to trigger header `refresh()`. */
  headerStateVersion = 0;

  // Header Menu state
  activeHeaderMenu: Column | ColDef<TData> | ColGroupDef<TData> | null = null;
  headerMenuPosition = { x: 0, y: 0 };

  // Resizing state
  isResizing = false;
  resizeColumn: Column | null = null;
  resizeItem: Column | ColumnGroup | null = null;
  private resizeStartX = 0;
  private resizeStartWidth = 0;

  // Range Selection state
  isRangeSelecting = false;
  private rangeStartCell: { rowIndex: number; colId: string } | null = null;

  // Side Bar state
  sideBarVisible = false;
  activeToolPanel: 'columns' | 'filters' | null = null;

  // Row Group Panel state
  rowGroupPanelShow: 'always' | 'onlyWhenGrouping' | 'never' = 'never';
  rowGroupColumns: Column[] = [];

  // Context Menu state
  activeContextMenu = false;
  contextMenuPosition = { x: 0, y: 0 };
  contextMenuItems: MenuItemDef[] = [];
  private contextMenuCell: { rowNode: IRowNode<TData>; column: Column } | null = null;

  // Tooltip state
  tooltipVisible = false;
  tooltipText = '';
  tooltipPosition = { x: 0, y: 0 };
  private _tooltipTimer: any = null;

  // Set Filter
  activeSetFilter = false;
  setFilterPosition = { x: 0, y: 0 };
  setFilterValues: any[] = [];
  setFilterSelectedValues: any[] | null = null;
  setFilterValueFormatter?: (value: any) => string;
  private activeSetFilterColumn: Column | null = null;
  private initialColumnDefs: (ColDef<TData> | ColGroupDef<TData>)[] | null = null;

  // Custom filter components (colDef.filter = Angular component)
  activeCustomFilter = false;
  customFilterPosition = { x: 0, y: 0 };
  activeCustomFilterColumn: Column | null = null;
  /** Live filter instances, kept alive per colId so filter state persists
   * across popup opens (mirrors AG Grid). Created lazily, destroyed on teardown. */
  private customFilterInstances = new Map<string, ComponentRef<IFilterAngularComp<TData>>>();

  public gridApi!: GridApi<TData>;
  public isColumnVisible = isColumnVisible;
  public Math = Math;
  public scrollbarWidth = 0;
  private canvasRenderer!: CanvasRenderer;
  private cellOverlayManager?: CellOverlayManager<TData>;
  private ariaRowMirror?: AriaRowMirror<TData>;
  private destroy$ = new Subject<void>();
  private gridService = new GridService<TData>();
  private horizontalScrollListener?: (e: Event) => void;
  private resizeObserver?: ResizeObserver;

  constructor(
    @Inject(ChangeDetectorRef) private _cdr: ChangeDetectorRef,
    private _elementRef: ElementRef<HTMLElement>,
    private _viewContainerRef: ViewContainerRef
  ) {}

  ngOnInit(): void {
    this.initialColumnDefs = this.columnDefs ? JSON.parse(JSON.stringify(this.columnDefs)) : null;
    this.initializeGrid();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Handle rowData changes after initialization
    if (changes.rowData && !changes.rowData.firstChange) {
      this.onRowDataChanged(changes.rowData.currentValue);
    }

    // Handle columnDefs changes
    if (changes.columnDefs && !changes.columnDefs.firstChange) {
      this.onColumnDefsChanged(changes.columnDefs.currentValue);
    }

    // Handle gridOptions changes
    if (changes.gridOptions && !changes.gridOptions.firstChange) {
      this.onGridOptionsChanged(changes.gridOptions.currentValue);
    }

    // Handle rowSelection changes
    if (changes.rowSelection && !changes.rowSelection.firstChange) {
      if (this.gridApi) {
        this.gridApi.setGridOption('rowSelection', changes.rowSelection.currentValue);
      }
    }

    // Handle theme changes
    if (changes.theme && !changes.theme.firstChange) {
      // Apply theme CSS variables to the grid container
      if (changes.theme.currentValue) {
        applyThemeCSSVariables(changes.theme.currentValue, this._elementRef.nativeElement);
      }

      // Update canvas renderer theme if it's initialized
      if (this.canvasRenderer) {
        const convertedTheme = changes.theme.currentValue
          ? convertThemeToGridTheme(changes.theme.currentValue)
          : undefined;
        this.canvasRenderer.setTheme(convertedTheme);

        // Sync rowHeight and headerHeight to GridApi if provided by theme and NOT explicitly overridden by user
        if (this.gridApi) {
          if (convertedTheme?.rowHeight && this.rowHeight === undefined) {
            this.gridApi.setGridOption('rowHeight', convertedTheme.rowHeight);
          }
          if (convertedTheme?.headerHeight) {
            this.gridApi.setGridOption('headerHeight', convertedTheme.headerHeight);
          }
        }
        // Font/line-height may have changed → re-measure auto-height rows.
        this.setupAutoRowHeight();
      }
    }
  }

  ngAfterViewInit(): void {
    // Setup canvas renderer after view is initialized
    if (this.canvasRef && !this.canvasRenderer) {
      // Convert theme from ThemeBuilder format to internal GridTheme format
      const convertedTheme = this.theme ? convertThemeToGridTheme(this.theme) : undefined;

      // Apply theme CSS variables to the grid container
      if (this.theme) {
        applyThemeCSSVariables(this.theme, this._elementRef.nativeElement);
      }

      this.canvasRenderer = new CanvasRenderer(
        this.canvasRef.nativeElement,
        this.gridApi,
        this.effectiveRowHeight,
        convertedTheme
      );
      // Wire up cell editing callback
      this.canvasRenderer.onCellDoubleClick = (rowIndex, colId) => {
        this.startEditing(rowIndex, colId);
      };

      // Wire up row click for selection
      this.canvasRenderer.onRowClick = (rowIndex, event) => {
        this.onRowClick(rowIndex, event);
      };

      // Clicking a cell moves keyboard focus to it.
      this.canvasRenderer.onCellClick = (rowIndex, colId) => {
        this.gridApi.setFocusedCell(rowIndex, colId);
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

      this.canvasRenderer.onMouseMove = (_event, rowIndex, colId) => {
        if (!this.isRangeSelecting || !this.rangeStartCell || !colId || rowIndex === -1) return;

        const start = this.rangeStartCell;
        const end = { rowIndex, colId };

        const columns = this.canvasRenderer.getAllColumns();
        const startColIdx = columns.findIndex((c) => c.colId === start.colId);
        const endColIdx = columns.findIndex((c) => c.colId === end.colId);

        if (startColIdx === -1 || endColIdx === -1) return;

        const range: CellRange = {
          startRow: Math.min(start.rowIndex, end.rowIndex),
          endRow: Math.max(start.rowIndex, end.rowIndex),
          startColumn: columns[Math.min(startColIdx, endColIdx)].colId,
          endColumn: columns[Math.max(startColIdx, endColIdx)].colId,
          columns: columns.slice(
            Math.min(startColIdx, endColIdx),
            Math.max(startColIdx, endColIdx) + 1
          ),
        };

        this.gridApi?.addCellRange(range);
      };

      this.canvasRenderer.onMouseUp = () => {
        this.isRangeSelecting = false;
      };

      // DOM/Angular cell-renderer overlay: stays in lockstep with the canvas by
      // syncing on every paint (which already covers scroll/resize/sort/filter).
      if (this.cellOverlayLayerRef) {
        this.cellOverlayManager = new CellOverlayManager<TData>({
          container: this.cellOverlayLayerRef.nativeElement,
          gridApi: this.gridApi,
          viewContainerRef: this._viewContainerRef,
          // Resolve the effective ColDef through the SAME helper the canvas uses
          // for its skip decision (getColumnDef in renderer prep). Sharing one
          // resolver is what guarantees the overlay's mount decision can never
          // disagree with what the canvas chose not to paint — using a second
          // resolver risks leaving a cell blank (canvas skipped, overlay didn't
          // mount) or double-drawn.
          getColDef: (col) => getColumnDef(col, this.gridApi),
        });
        // Now that the renderer (and its theme) exists, wire up auto-height.
        this.setupAutoRowHeight();
      }

      // Off-screen ARIA mirror of the visible rows (a11y counterpart to the cell
      // overlay). Created independently of the cell overlay so it works even
      // when no component cells are present; skipped when accessibility is off.
      if (this.ariaLayerRef && !this.gridApi.getGridOption('suppressAccessibility')) {
        this.ariaRowMirror = new AriaRowMirror<TData>({
          container: this.ariaLayerRef.nativeElement,
          gridApi: this.gridApi,
          getColDef: (col) => getColumnDef(col, this.gridApi),
          headerRowCount: () => this.gridApi.getHeaderDepth(),
        });
      }

      // Single per-paint callback fans out to both DOM layers so they stay in
      // lockstep with the canvas (scroll/resize/sort/filter/data).
      this.canvasRenderer.onAfterRender = (layout) => {
        this.cellOverlayManager?.sync(layout);
        this.ariaRowMirror?.sync(layout);
      };
    }

    // Setup viewport dimensions and resize observer
    if (this.viewportRef) {
      const rect = this.viewportRef.nativeElement.getBoundingClientRect();
      this.viewportHeight = rect.height || 500;
      this.canvasRenderer?.setViewportDimensions(
        rect.width,
        this.viewportHeight,
        this.scrollbarWidth
      );

      const updateScrollbar = () => {
        const viewport = this.viewportRef?.nativeElement;
        if (!viewport) return;
        const newWidth = viewport.offsetWidth - viewport.clientWidth;
        if (this.scrollbarWidth !== newWidth) {
          this.scrollbarWidth = newWidth;
          this._cdr.detectChanges();
        }
      };

      // Synchronize horizontal scroll with DOM header
      this.horizontalScrollListener = () => {
        const viewport = this.viewportRef?.nativeElement;
        if (!viewport) return;

        updateScrollbar();

        if (this.headerScrollableRef) {
          this.headerScrollableRef.nativeElement.scrollLeft = viewport.scrollLeft;
        }
        if (this.headerScrollableFilterRef) {
          this.headerScrollableFilterRef.nativeElement.scrollLeft = viewport.scrollLeft;
        }
      };

      this.viewportRef.nativeElement.addEventListener('scroll', this.horizontalScrollListener, {
        passive: true,
      });

      // Add ResizeObserver to handle sidebar toggling and other size changes
      if (typeof ResizeObserver !== 'undefined') {
        let lastWidth = 0;
        let lastHeight = 0;
        this.resizeObserver = new ResizeObserver((entries) => {
          for (const entry of entries) {
            const { width, height } = entry.contentRect;
            if (Math.abs(width - lastWidth) < 1 && Math.abs(height - lastHeight) < 1) continue;

            lastWidth = width;
            lastHeight = height;
            this.viewportHeight = height;

            // Only update scrollbar if dimensions actually changed
            updateScrollbar();

            this.canvasRenderer?.setViewportDimensions(width, height, this.scrollbarWidth);
            // setViewportDimensions → updateCanvasSize already schedules a render.
            this._cdr.detectChanges();
          }
        });
        this.resizeObserver.observe(this.viewportRef.nativeElement);
      }

      // Initial calculation
      setTimeout(() => {
        updateScrollbar();
        if (this.canvasRenderer) {
          this.canvasRenderer.render();
        }
      });
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

    this.destroyCustomFilters();
    this.cellOverlayManager?.destroy();
    this.ariaRowMirror?.destroy();
    this.gridApi?.destroy();
    this.canvasRenderer?.destroy();
    this.onCanvasMouseLeave();
  }

  /** Destroy all live custom-filter instances and drop their predicates. Used on
   * teardown and when the column definitions are replaced. */
  private destroyCustomFilters(): void {
    for (const ref of this.customFilterInstances.values()) {
      ref.destroy();
    }
    this.customFilterInstances.clear();
    this.gridService?.clearCustomFilterEvaluators();
  }

  /** Offscreen 2D context used only to measure wrapped text for auto-height. */
  private measureCtx: CanvasRenderingContext2D | null = null;

  private getMeasureCtx(): CanvasRenderingContext2D | null {
    if (!this.measureCtx) {
      this.measureCtx = document.createElement('canvas').getContext('2d');
    }
    return this.measureCtx;
  }

  /**
   * Install (or clear) the auto-height measurer on the grid service. For columns
   * with `autoHeight`, each row's height is the tallest wrapped-text height
   * across those columns (clamped to at least the default row height). Reads
   * column widths live, so it stays correct across resizes when re-run. No-op
   * (and clears any prior measurer) when no column opts into auto-height.
   */
  private setupAutoRowHeight(): void {
    if (!this.gridApi || typeof this.canvasRenderer?.getTheme !== 'function') return;
    const theme = this.canvasRenderer.getTheme();
    const autoCols = this.gridApi
      .getAllColumns()
      .filter((c) => !!getColumnDef(c, this.gridApi)?.autoHeight);

    if (autoCols.length === 0) {
      this.gridService.setRowHeightCalculator(null);
      return;
    }

    const ctx = this.getMeasureCtx();
    if (!ctx) return;
    const lineH = getTextLineHeight(theme);
    const minH = theme.rowHeight;

    this.gridService.setRowHeightCalculator((node) => {
      if ((node as any).group || (node as any).detail) return null;
      ctx.font = getFontFromTheme(theme);
      let maxH: number | null = null;
      for (const col of autoCols) {
        if (!isColumnVisible(col)) continue;
        const colDef = getColumnDef(col, this.gridApi);
        const value = getCellValue(col, colDef, node, this.gridApi);
        const text = getFormattedValue(value, colDef, node.data, node, this.gridApi);
        // Mirror drawCellContent's available width: the auto-group/tree column
        // reserves room at the left for the indent + expand indicator, so the
        // measured wrap width must subtract the same offset or the row is sized
        // too short and the last wrapped line is clipped.
        const groupOffset =
          col.colId === 'ag-Grid-AutoColumn' && (node.group || node.level > 0)
            ? groupIndicatorAreaWidth(node.level, theme)
            : 0;
        const lines = wrapLines(ctx, text, (col.width || 0) - theme.cellPadding * 2 - groupOffset);
        const h = Math.max(1, lines.length) * lineH + theme.cellPadding * 2;
        maxH = maxH == null ? h : Math.max(maxH, h);
      }
      return maxH == null ? null : Math.max(maxH, minH);
    });
  }

  private initializeGrid(): void {
    // Merge individual inputs into grid options if provided
    const options = { ...this.gridOptions };
    if (this.rowSelection) {
      options.rowSelection = this.rowSelection;
    }

    // Prioritize explicit rowHeight input if provided
    if (this.rowHeight !== undefined) {
      options.rowHeight = this.rowHeight;
    } else if (this.theme) {
      // If no explicit rowHeight, but theme is provided, use theme's rowHeight
      const convertedTheme = convertThemeToGridTheme(this.theme);
      if (convertedTheme.rowHeight) {
        options.rowHeight = convertedTheme.rowHeight;
      }
      if (convertedTheme.headerHeight && options.headerHeight === undefined) {
        options.headerHeight = convertedTheme.headerHeight;
      }
    }

    // Initialize grid API
    this.gridApi = this.gridService.createApi(this.columnDefs, this.rowData, options);

    // Initial state sync
    this.rowGroupPanelShow = this.gridApi.getGridOption('rowGroupPanelShow') || 'never';
    this.updateRowGroupColumns();

    // Listen for grid state changes from API (filters, sorts, options)
    this.gridService.gridStateChanged$.pipe(takeUntil(this.destroy$)).subscribe((event) => {
      // Keep custom header components in step with header-affecting state.
      // The column set can change shape (resolved component / params), so drop
      // the per-column caches; sort/filter only changes state the component
      // re-reads, so just bump the refresh version.
      if (event.type === 'columnsChanged' || event.type === 'columnGroupExpanded') {
        this.headerComponentCache.clear();
        this.headerParamsCache.clear();
        this.headerStateVersion++;
      } else if (event.type === 'sortChanged' || event.type === 'filterChanged') {
        this.headerStateVersion++;
      }
      if (event.type === 'optionChanged' && event.key === 'sideBar') {
        this.sideBarVisible = !!event.value;
      }
      if (event.type === 'optionChanged' && event.key === 'rowGroupPanelShow') {
        this.rowGroupPanelShow = event.value || 'never';
      }
      if (event.type === 'selectionChanged') {
        this.updateSelectionState();

        // Mark all rows as potentially dirty for selection change to ensure canvas redraws
        // In a more optimized version, we'd only mark specific rows.
        if (this.canvasRenderer) {
          this.canvasRenderer.render(); // This calls markAllDirty and schedules render
        }
      } else if (event.type === 'columnsChanged' || event.type === 'columnGroupExpanded') {
        this.updateRowGroupColumns();
        this.canvasRenderer?.render();
      } else if (event.type === 'transactionApplied') {
        // Efficient rendering: only mark changed rows as dirty instead of full redraw.
        // Callers are responsible for throttling applyTransaction frequency (e.g. via RxJS).
        const changedIndices = (event as any).changedRowIndices as number[] | undefined;
        if (changedIndices && changedIndices.length > 0 && this.canvasRenderer) {
          for (const rowIndex of changedIndices) {
            this.canvasRenderer.invalidateRow(rowIndex);
          }
        } else {
          this.canvasRenderer?.render();
        }
      } else if (event.type === 'overlayChanged') {
        this.activeOverlay = event.value;
        this.showOverlay = !!this.activeOverlay;
      } else if (event.type === 'ensureIndexVisible') {
        this.canvasRenderer?.ensureIndexVisible(event.value.index, event.value.position);
      } else if (event.type === 'ensureColumnVisible') {
        this.canvasRenderer?.scrollToColumn(event.value.colId);
      } else if (event.type === 'focusChanged') {
        // Focus only moves the ring — a view change, not a data change. Repaint
        // without forcing every visible overlay cell to re-bind.
        this.canvasRenderer?.repaint();
        // Point aria-activedescendant at the focused cell's mirror node so AT
        // announces it. The id is computed (not a DOM lookup), so it's valid
        // even before the mirror's next frame mounts the cell.
        this.updateActiveDescendant();
      } else {
        // All other state changes (sort, filter, rangeSelection, etc.) go through the
        // rAF-coalesced scheduler. Multiple rapid events (e.g. rangeSelectionChanged
        // on every mousemove) collapse into at most one pending frame.
        this.canvasRenderer?.render();
      }
      this._cdr.detectChanges();
    });

    // Selection column is now handled within the data columns
    this.showSelectionColumn = false;

    // Canvas renderer will be initialized in ngAfterViewInit

    // Emit grid ready event
    this.gridReady.emit(this.gridApi);

    // Sidebar state
    this.sideBarVisible = !!this.gridOptions?.sideBar;
    if (this.sideBarVisible && !this.activeToolPanel) {
      this.activeToolPanel = 'columns';
    }

    // Update overlay state
    this.updateAutomaticOverlay();

    // Update selection state
    this.updateSelectionState();

    // On re-init (e.g. column visibility toggle) the renderer already exists and
    // the column set may have changed — re-bind the auto-height measurer. On the
    // very first init the renderer is created later (ngAfterViewInit wires it).
    if (this.canvasRenderer) {
      this.setupAutoRowHeight();
    }
  }

  private onRowDataChanged(newData: TData[] | null): void {
    this.rowData = newData;

    if (this.gridApi) {
      this.gridApi.setRowData(newData || []);
      if (this.canvasRenderer) {
        this.canvasRenderer.render();
      }
    }

    this.updateAutomaticOverlay();
    this.updateSelectionState();

    // Trigger change detection with OnPush
    this._cdr.detectChanges();
  }

  private onColumnDefsChanged(newColumnDefs: (ColDef<TData> | ColGroupDef<TData>)[] | null): void {
    this.columnDefs = newColumnDefs;
    // Column set replaced — old filter instances may no longer apply.
    this.destroyCustomFilters();

    if (this.gridApi) {
      this.gridApi.setColumnDefs(newColumnDefs);
      this.canvasRenderer?.render();
    }

    this._cdr.detectChanges();
  }

  private onGridOptionsChanged(newOptions: GridOptions<TData> | null): void {
    this.gridOptions = newOptions;
    if (this.gridApi && newOptions) {
      // Update all options in the API
      Object.keys(newOptions).forEach((key) => {
        this.gridApi.setGridOption(key as any, (newOptions as any)[key]);
      });

      if (newOptions.rowGroupPanelShow) {
        this.rowGroupPanelShow = newOptions.rowGroupPanelShow;
      }

      this.canvasRenderer?.render();
    }
    this._cdr.detectChanges();
  }

  updateAutomaticOverlay(): void {
    if (this.gridOptions?.loading) {
      this.activeOverlay = 'loading';
      this.showOverlay = true;
      return;
    }

    if (!this.rowData || this.rowData.length === 0) {
      if (!this.gridOptions?.suppressNoRowsOverlay) {
        this.activeOverlay = 'noRows';
        this.showOverlay = true;
      } else {
        this.showOverlay = false;
      }
    } else {
      this.showOverlay = !!this.activeOverlay;
    }
  }

  getOverlayType(): 'loading' | 'noRows' | null {
    return this.activeOverlay;
  }

  getOverlayContent(): string {
    if (this.activeOverlay === 'loading') {
      return this.gridOptions?.loadingOverlayComponent || 'Loading...';
    }
    if (this.activeOverlay === 'noRows') {
      return this.gridOptions?.noRowsOverlayComponent || 'No Rows To Show';
    }
    return '';
  }

  getHeaderRows(): (Column | ColumnGroup)[][] {
    if (!this.gridApi) return [];
    return this.gridApi.getHeaderRows();
  }

  getPinnedLeftItems(row: (Column | ColumnGroup)[]): (Column | ColumnGroup)[] {
    return row.filter((item) => item.pinned === 'left' && isColumnVisible(item));
  }

  getPinnedRightItems(row: (Column | ColumnGroup)[]): (Column | ColumnGroup)[] {
    return row.filter((item) => item.pinned === 'right' && isColumnVisible(item));
  }

  getNonPinnedItems(row: (Column | ColumnGroup)[]): (Column | ColumnGroup)[] {
    return row.filter((item) => !item.pinned && isColumnVisible(item));
  }

  getItemWidth(item: Column | ColumnGroup): number {
    if ('children' in item) {
      return item.children.reduce((sum, child) => {
        if (isColumnVisible(child)) {
          return sum + this.getItemWidth(child);
        }
        return sum;
      }, 0);
    }
    return Math.floor(item.width || 150);
  }

  getItemRowSpan(item: Column | ColumnGroup, rowIndex: number): number {
    if ('children' in item) {
      return 1;
    }
    // Leaf node spans until the bottom
    const totalRows = this.gridApi.getHeaderDepth();
    return totalRows - rowIndex;
  }

  isColumnGroup(item: Column | ColumnGroup): item is ColumnGroup {
    return 'children' in item;
  }

  trackByHeaderItem(
    index: number,
    entry: { item: Column | ColumnGroup; rowIndex: number }
  ): string {
    const item = entry.item;
    return 'groupId' in item ? item.groupId : item.colId || index.toString();
  }

  getItemColSpan(item: Column | ColumnGroup): number {
    if ('children' in item) {
      return item.children.reduce((sum, child) => {
        return sum + this.getItemColSpan(child);
      }, 0);
    }
    return 1;
  }

  getScrollableHeaderWidth(): number {
    return this.getNonPinnedColumns().reduce((sum, col) => sum + Math.floor(col.width || 150), 0);
  }

  getGridTemplateColumns(section: 'left' | 'right' | 'none'): string {
    if (!this.gridApi) return '';
    const allCols = this.gridApi.getAllColumns();
    const sectionCols = allCols.filter((c) => {
      if (section === 'left') return c.pinned === 'left';
      if (section === 'right') return c.pinned === 'right';
      return !c.pinned;
    });

    if (sectionCols.length === 0) return '';

    const indices = sectionCols.map((c) => c.colIndex || 0);
    const minIndex = Math.min(...indices);
    const maxIndex = Math.max(...indices);

    const widths = new Array(maxIndex - minIndex + 1).fill('0px');
    sectionCols.forEach((c) => {
      if (isColumnVisible(c)) {
        widths[(c.colIndex || 0) - minIndex] = `${Math.floor(c.width || 150)}px`;
      }
    });

    return widths.join(' ');
  }

  getColGridIndex(item: Column | ColumnGroup, section: 'left' | 'right' | 'none'): number {
    if (!this.gridApi) return 1;
    const allCols = this.gridApi.getAllColumns();
    const sectionCols = allCols.filter((c) => {
      if (section === 'left') return c.pinned === 'left';
      if (section === 'right') return c.pinned === 'right';
      return !c.pinned;
    });
    if (sectionCols.length === 0) return 1;
    const minIndex = Math.min(...sectionCols.map((c) => c.colIndex || 0));

    return (item.colIndex || 0) - minIndex + 1;
  }

  getScrollableColIndex(item: Column | ColumnGroup): number {
    return this.getColGridIndex(item, 'none');
  }

  getRightPinnedColIndex(item: Column | ColumnGroup): number {
    return this.getColGridIndex(item, 'right');
  }

  getLeftPinnedColIndex(item: Column | ColumnGroup): number {
    return this.getColGridIndex(item, 'left');
  }

  getSectionHeaderItems(
    section: 'left' | 'right' | 'none'
  ): { item: Column | ColumnGroup; rowIndex: number }[] {
    const items: { item: Column | ColumnGroup; rowIndex: number }[] = [];
    const rows = this.getHeaderRows();
    rows.forEach((row, i) => {
      let rowItems: (Column | ColumnGroup)[] = [];
      if (section === 'left') rowItems = this.getPinnedLeftItems(row);
      else if (section === 'right') rowItems = this.getPinnedRightItems(row);
      else rowItems = this.getNonPinnedItems(row);

      rowItems.forEach((item) => items.push({ item, rowIndex: i }));
    });
    return items;
  }

  hasExpansionToggle(item: ColumnGroup): boolean {
    return item.children.some(
      (child) => child.columnGroupShow === 'open' || child.columnGroupShow === 'closed'
    );
  }

  isRowGroupPanelVisible(): boolean {
    const show = this.rowGroupPanelShow;
    if (show === 'always') return true;
    if (show === 'onlyWhenGrouping') {
      return this.rowGroupColumns.length > 0;
    }
    return false;
  }

  // Pagination helpers
  isPaginationEnabled(): boolean {
    return !!this.gridApi?.getGridOption('pagination');
  }

  getCurrentPage(): number {
    return this.gridApi?.paginationGetCurrentPage() ?? 0;
  }

  getTotalPages(): number {
    return this.gridApi?.paginationGetTotalPages() ?? 1;
  }

  getPaginationTotalRows(): number {
    return this.gridApi?.getPaginationTotalRows() ?? 0;
  }

  getPaginationStart(): number {
    const page = this.getCurrentPage();
    const size = this.gridApi?.paginationGetPageSize() ?? 100;
    return this.getPaginationTotalRows() === 0 ? 0 : page * size + 1;
  }

  getPaginationEnd(): number {
    const page = this.getCurrentPage();
    const size = this.gridApi?.paginationGetPageSize() ?? 100;
    const total = this.getPaginationTotalRows();
    return Math.min((page + 1) * size, total);
  }

  isFirstPage(): boolean {
    return this.getCurrentPage() === 0;
  }

  isLastPage(): boolean {
    return this.getCurrentPage() >= this.getTotalPages() - 1;
  }

  paginationGoToFirstPage(): void {
    this.gridApi?.paginationGoToFirstPage();
  }

  paginationGoToPreviousPage(): void {
    this.gridApi?.paginationGoToPreviousPage();
  }

  paginationGoToNextPage(): void {
    this.gridApi?.paginationGoToNextPage();
  }

  paginationGoToLastPage(): void {
    this.gridApi?.paginationGoToLastPage();
  }

  trackByRowGroup(index: number, col: Column): string {
    return col.colId || index.toString();
  }

  private updateRowGroupColumns(): void {
    if (!this.gridApi) {
      this.rowGroupColumns = [];
      return;
    }
    const groupColIds = this.gridApi.getRowGroupColumns();
    this.rowGroupColumns = this.gridApi
      .getAllColumns()
      .filter((col) => groupColIds.includes(col.colId));
  }

  getRowGroupColumns(): Column[] {
    return this.rowGroupColumns;
  }

  onRowGroupDropped(event: CdkDragDrop<any[]>): void {
    const col = event.item.data as Column;
    if (col?.colId && col.colId !== 'ag-Grid-SelectionColumn') {
      this.gridApi.addRowGroupColumn(col.colId);
    }
  }
  removeRowGroup(col: Column): void {
    this.gridApi.removeRowGroupColumn(col.colId);
  }

  toggleGroup(item: ColumnGroup, event: MouseEvent): void {
    event.stopPropagation();
    this.gridApi.toggleColumnGroup(item.groupId, !item.expanded);
  }

  getColumnWidth(col: Column | ColDef<TData> | ColGroupDef<TData>): number {
    if ('children' in col) {
      // Column group - sum children widths
      return col.children.reduce((sum, child) => sum + this.getColumnWidth(child), 0);
    }
    return Math.floor(col.width || 150);
  }

  getLeftPinnedColumns(): Column[] {
    if (!this.gridApi) return [];
    return this.gridApi.getAllColumns().filter((col) => {
      return isColumnVisible(col) && col.pinned === 'left';
    });
  }

  getRightPinnedColumns(): Column[] {
    if (!this.gridApi) return [];
    return this.gridApi.getAllColumns().filter((col) => {
      return isColumnVisible(col) && col.pinned === 'right';
    });
  }

  getNonPinnedColumns(): Column[] {
    if (!this.gridApi) return [];
    return this.gridApi.getAllColumns().filter((col) => {
      return isColumnVisible(col) && !col.pinned;
    });
  }

  isSortable(col: Column | ColDef<TData> | ColGroupDef<TData>): boolean {
    const colId = (col as any).colId || (col as any).field?.toString();
    if (colId === 'ag-Grid-SelectionColumn') return false;

    // If it has children, it's a group and cannot be sorted directly
    if ('children' in col) return false;

    // Check if the object itself has sortable property (ColDef)
    if ('sortable' in col && col.sortable !== undefined) {
      return !!col.sortable;
    }

    // It's likely a Column object, look up its ColDef
    const colDef = this.getColumnDefForColumn(col as any);
    return colDef && this.isColDef(colDef) ? colDef.sortable !== false : true;
  }

  getHeaderName(col: Column | ColDef<TData> | ColGroupDef<TData>): string {
    if ('children' in col) {
      return col.headerName || '';
    }
    if ((col as any).colId === 'ag-Grid-SelectionColumn') {
      return '';
    }
    return col.headerName || (col as any).field?.toString() || '';
  }

  getSortIndicator(col: Column | ColDef<TData> | ColGroupDef<TData>): string {
    if ('children' in col || !col.sort) {
      return '';
    }

    const arrow = col.sort === 'asc' ? '▲' : '▼';
    const sortModel = this.gridApi?.getSortModel() || [];

    if (sortModel.length > 1) {
      const colId = (col as any).colId || (col as any).field?.toString() || '';
      const index = sortModel.findIndex((item) => item.colId === colId);
      if (index >= 0) {
        return `${arrow} ${index + 1}`;
      }
    }

    return arrow;
  }

  onHeaderClick(col: Column | ColDef<TData> | ColGroupDef<TData>, event: MouseEvent): void {
    if (this.isResizing) return;

    if ((col as any).colId === 'ag-Grid-SelectionColumn') {
      // Selection is now handled by the checkbox directly to avoid resizing interference
      return;
    }

    if (!this.isSortable(col) || 'children' in col) {
      return;
    }

    // A custom header component owns its own sort affordance (via params.setSort
    // / progressSort), so the default sort-on-click is disabled for it — exactly
    // like AG Grid.
    if (this.getHeaderComponent(col)) {
      return;
    }

    const colId = (col as any).colId || (col as any).field?.toString() || '';
    this.progressColumnSort(colId, event.shiftKey);
  }

  /** Advance a column's sort to its next state (asc → desc → none), reading the
   * latest sort from the API. Shared by header clicks and custom header params. */
  private progressColumnSort(colId: string, multiSort: boolean): void {
    const currentSort = this.gridApi?.getColumn(colId)?.sort || null;
    const newSort: SortDirection =
      currentSort === 'asc' ? 'desc' : currentSort === 'desc' ? null : 'asc';
    this.gridApi.setColumnSort(colId, newSort, multiSort);
    this.canvasRenderer?.render();
  }

  /**
   * Resolve the custom header component for a column (memoized per colId), or
   * null to use the built-in header. Column groups never have one.
   */
  getHeaderComponent(
    col: Column | ColDef<TData> | ColGroupDef<TData>
  ): Type<IHeaderAngularComp> | null {
    if ('children' in col || (col as any).colId === 'ag-Grid-SelectionColumn') {
      return null;
    }
    const colId = (col as any).colId || (col as any).field?.toString() || '';
    if (!colId) return null;
    if (this.headerComponentCache.has(colId)) {
      return this.headerComponentCache.get(colId) ?? null;
    }
    const colDef = this.getColumnDefForColumn(col as any);
    const component = resolveHeaderComponent<TData>(colDef as ColDef<TData>, this.gridApi);
    this.headerComponentCache.set(colId, component);
    return component;
  }

  /**
   * Build (and cache) the {@link IHeaderParams} for a column's custom header
   * component. The reference is stable per colId so the outlet directive only
   * refreshes on `headerStateVersion` bumps; the live `column` it carries always
   * reflects the current sort.
   */
  getHeaderComponentParams(col: Column | ColDef<TData> | ColGroupDef<TData>): IHeaderParams<TData> {
    const colId = (col as any).colId || (col as any).field?.toString() || '';
    const cached = this.headerParamsCache.get(colId);
    if (cached) return cached;

    const column = (this.gridApi?.getColumn(colId) || (col as Column)) as Column;
    const colDef = (this.getColumnDefForColumn(col as any) || {}) as ColDef<TData>;
    const extra = (colDef.headerComponentParams as Record<string, any>) || {};

    const params: IHeaderParams<TData> = {
      ...extra,
      column,
      colDef,
      displayName: this.getHeaderName(col),
      api: this.gridApi,
      enableSorting: this.isSortable(col),
      enableMenu: this.hasHeaderMenu(col),
      enableFilterButton: this.hasHeaderFilterButton(col),
      progressSort: (multiSort = false) => this.progressColumnSort(colId, multiSort),
      setSort: (sort: SortDirection, multiSort = false) => {
        this.gridApi.setColumnSort(colId, sort, multiSort);
        this.canvasRenderer?.render();
      },
      showColumnMenu: (source: HTMLElement) =>
        this.onHeaderMenuClick(this.syntheticEventFor(source), col),
      showFilter: (source: HTMLElement) =>
        this.onHeaderFilterClick(this.syntheticEventFor(source), col),
    };
    this.headerParamsCache.set(colId, params);
    return params;
  }

  /** A MouseEvent anchored at an element, for menu/filter opening from custom
   * header callbacks. `target` is pinned to the source element since the event
   * is never dispatched (the handlers read `event.target` for positioning). */
  private syntheticEventFor(source: HTMLElement): MouseEvent {
    const rect = source.getBoundingClientRect();
    const event = new MouseEvent('click', {
      clientX: rect.left,
      clientY: rect.bottom,
      bubbles: true,
    });
    Object.defineProperty(event, 'target', { value: source, enumerable: true });
    return event;
  }

  // --- Header Menu Logic ---

  headerMenuItems: MenuItemDef[] = [];

  hasHeaderMenu(col: Column | ColDef<TData> | ColGroupDef<TData>): boolean {
    if ((col as any).colId === 'ag-Grid-SelectionColumn') return false;
    if ('children' in col) return false;
    const colDef = this.getColumnDefForColumn(col as any);
    return colDef && this.isColDef(colDef) ? colDef.suppressHeaderMenuButton !== true : true;
  }

  hasHeaderFilterButton(col: Column | ColDef<TData> | ColGroupDef<TData>): boolean {
    if ((col as any).colId === 'ag-Grid-SelectionColumn') return false;
    if ('children' in col) return false;
    const colDef = this.getColumnDefForColumn(col as any);
    if (!colDef || !this.isColDef(colDef)) return false;
    if (!colDef.filter || colDef.suppressHeaderFilterButton === true) return false;
    // Don't show when floating filters are active — they already provide quick access
    if (colDef.floatingFilter) return false;
    return true;
  }

  isColumnFiltered(col: Column | ColDef<TData> | ColGroupDef<TData>): boolean {
    if (!this.gridApi) return false;
    const column = col as Column;
    const field = column.field || column.colId;
    if (!field) return false;
    const filterModel = this.gridApi.getFilterModel();
    return !!(filterModel as any)[field];
  }

  onHeaderFilterClick(event: MouseEvent, col: Column | ColDef<TData> | ColGroupDef<TData>): void {
    event.stopPropagation();
    const column = col as Column;
    const target = event.target as HTMLElement;
    // Use closest ancestor that has a bounding rect useful for positioning
    const iconEl = (target.closest('.argent-grid-header-filter-icon') as HTMLElement) ?? target;
    const rect = iconEl.getBoundingClientRect();
    const containerRect = this._elementRef.nativeElement.getBoundingClientRect();
    const position = {
      x: rect.left - containerRect.left,
      y: rect.bottom - containerRect.top + 4,
    };
    const colDef = this.getColumnDefForColumn(column);
    if (colDef && this.isColDef(colDef) && resolveFilterComponent(colDef, this.gridApi)) {
      this.openCustomFilter(column, position);
    } else if (colDef && this.isColDef(colDef) && colDef.filter === 'set') {
      this.openSetFilter(null, column, position);
    } else {
      this.openFilterPopup(null, column, position);
    }
  }

  onHeaderMenuClick(event: MouseEvent, col: Column | ColDef<TData> | ColGroupDef<TData>): void {
    event.stopPropagation();

    if (this.activeHeaderMenu === col) {
      this.closeHeaderMenu();
      return;
    }

    this.activeHeaderMenu = col;
    this.headerMenuItems = this.getHeaderMenuItems(col as Column);

    // Position menu below the icon using coordinates relative to the grid container
    const target = event.target as HTMLElement;
    const rect = target.getBoundingClientRect();
    const containerRect = this._elementRef.nativeElement.getBoundingClientRect();

    // Align left edge of menu with left edge of icon
    let x = rect.left - containerRect.left;
    let y = rect.bottom - containerRect.top + 4;

    // Prevent menu from going off-container bounds
    const containerWidth = this._elementRef.nativeElement.offsetWidth;
    const containerHeight = this._elementRef.nativeElement.offsetHeight;

    // Assuming menu width is up to 200px for boundary checks
    if (x + 200 > containerWidth) {
      x = rect.right - containerRect.left - 200; // Flip to right-aligned if it overflows
    }
    if (x < 0) x = 0;

    // Check if menu would overflow bottom
    const estimatedHeight = this.headerMenuItems.length * 30 + 20;
    if (y + estimatedHeight > containerHeight) {
      y = Math.max(0, rect.top - containerRect.top - estimatedHeight);
    }

    this.headerMenuPosition = { x, y };

    this._cdr.detectChanges();
  }

  private getHeaderMenuItems(col: Column): MenuItemDef[] {
    const items: MenuItemDef[] = [];

    // 1. Sort items
    items.push({
      name: 'Sort Ascending',
      icon: '↑',
      action: () => this.sortColumnMenu('asc'),
    });
    items.push({
      name: 'Sort Descending',
      icon: '↓',
      action: () => this.sortColumnMenu('desc'),
    });
    items.push({
      name: 'Clear Sort',
      icon: '✕',
      action: () => this.sortColumnMenu(null),
    });

    items.push({ name: '', action: () => {}, separator: true });

    // 2. Filter items
    const colDef = this.getColumnDefForColumn(col);
    if (colDef && this.isColDef(colDef) && colDef.filter !== false) {
      const filterType = colDef.filter || 'text';

      if (filterType === 'set') {
        items.push({
          name: 'Filter...',
          icon: 'Y',
          action: () => {
            this.openSetFilter(null, col, { ...this.headerMenuPosition });
            this.closeHeaderMenu();
          },
        });
      } else {
        items.push({
          name: 'Filter...',
          icon: 'Y',
          action: () => {
            this.openFilterPopup(null, col, { ...this.headerMenuPosition });
            this.closeHeaderMenu();
          },
        });
      }
    }

    items.push({ name: '', action: () => {}, separator: true });

    // 3. Pinning items
    items.push({
      name: 'Pin Left',
      icon: '«',
      action: () => this.pinColumnMenu('left'),
    });
    items.push({
      name: 'Pin Right',
      icon: '»',
      action: () => this.pinColumnMenu('right'),
    });
    items.push({
      name: 'Unpin',
      icon: '↺',
      action: () => this.pinColumnMenu(null),
    });

    items.push({ name: '', action: () => {}, separator: true });

    // 4. Hide item
    items.push({
      name: 'Hide Column',
      icon: 'ø',
      action: () => this.hideColumnMenu(),
    });

    items.push({ name: '', action: () => {}, separator: true });

    // 5. Columns panel (open sidebar)
    items.push({
      name: 'Columns',
      icon: '☰',
      action: () => this.openColumnsPanel(),
    });

    return items;
  }

  public clearColumnFilter(col: Column): void {
    if (!this.gridApi) return;

    // Custom-component filter: reset the live instance and drop its predicate.
    const customRef = this.customFilterInstances.get(col.colId);
    if (customRef) {
      customRef.instance.setModel(null);
      this.gridService.setCustomFilterEvaluator(col.colId, null);
    }

    const currentModel = this.gridApi.getFilterModel();
    // Built-in filters are keyed by field; custom filters by colId.
    if (col.field) delete (currentModel as any)[col.field];
    delete (currentModel as any)[col.colId];
    this.gridApi.setFilterModel(currentModel);
    this.closeHeaderMenu();
    this.closeFilterPopup();
    this.closeCustomFilter();
  }

  closeHeaderMenu(): void {
    this.activeHeaderMenu = null;
    this._cdr.detectChanges();
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

    // Ensure container is focused for keyboard shortcuts
    this._elementRef.nativeElement.focus();
  }

  @HostListener('keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent): void {
    // The editor owns keys while editing; menus/overlays own them while open.
    if (this.isEditing || this.activeContextMenu || this.activeHeaderMenu) return;
    // Keys typed into the grid's own form controls (floating filters, popups,
    // sidebar) belong to those inputs — don't hijack them for cell nav/editing.
    if (this.isEditableTarget(event.target)) return;

    const isCtrlOrMeta = event.ctrlKey || event.metaKey;

    if (isCtrlOrMeta && event.key.toLowerCase() === 'c') {
      // Copy
      this.gridApi.copyToClipboard();
      event.preventDefault();
      return;
    }
    if (isCtrlOrMeta && event.key.toLowerCase() === 'v') {
      // Paste
      this.gridApi.pasteFromClipboard();
      event.preventDefault();
      return;
    }

    const focused = this.gridApi.getFocusedCell();
    const fc = focused?.column ? { rowIndex: focused.rowIndex, colId: focused.column.colId } : null;

    switch (event.key) {
      case 'ArrowDown':
        this.moveFocus(0, 1, event);
        return;
      case 'ArrowUp':
        this.moveFocus(0, -1, event);
        return;
      case 'ArrowRight':
        this.moveFocus(1, 0, event);
        return;
      case 'ArrowLeft':
        this.moveFocus(-1, 0, event);
        return;
      case 'Tab':
        this.moveFocusTab(event.shiftKey, event);
        return;
      case 'Home':
        this.moveFocusRowEdge(false, isCtrlOrMeta, event);
        return;
      case 'End':
        this.moveFocusRowEdge(true, isCtrlOrMeta, event);
        return;
      case 'PageDown':
        this.moveFocusPage(1, event);
        return;
      case 'PageUp':
        this.moveFocusPage(-1, event);
        return;
      case 'Enter':
        if (fc) {
          this.startEditing(fc.rowIndex, fc.colId);
          event.preventDefault();
        }
        return;
      default:
        // type-to-edit: a single printable character starts editing with that char.
        if (fc && event.key.length === 1 && !isCtrlOrMeta && !event.altKey) {
          this.startEditingWithChar(fc.rowIndex, fc.colId, event.key);
          event.preventDefault();
        }
    }
  }

  // ============================================================================
  // KEYBOARD NAVIGATION
  // ============================================================================

  /**
   * True when a key event originates from an editable form control (input,
   * textarea, select, or contenteditable). Such keys must reach that control
   * instead of being captured for grid keyboard navigation/editing.
   */
  private isEditableTarget(target: EventTarget | null): boolean {
    const el = target as HTMLElement | null;
    if (!el || !el.tagName) return false;
    const tag = el.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
  }

  /** Visible columns in display order (excludes hidden columns). */
  private getNavColumns(): Column[] {
    return this.gridApi.getAllColumns().filter((c) => isColumnVisible(c));
  }

  /** Move keyboard focus to a cell, scrolling it into view. */
  private setFocus(rowIndex: number, colId: string): void {
    this.gridApi.setFocusedCell(rowIndex, colId);
    this.gridApi.ensureIndexVisible(rowIndex);
    this.gridApi.ensureColumnVisible(colId);
  }

  /** Focus the first cell of the grid (used when nav starts with no focus). */
  private focusFirstCell(): void {
    const cols = this.getNavColumns();
    if (cols.length === 0 || this.gridApi.getDisplayedRowCount() === 0) return;
    this.setFocus(0, cols[0].colId);
  }

  /**
   * Compute the cell reached by stepping `dCol` columns / `dRow` rows from
   * (rowIndex, colId). Arrow steps clamp at edges; `wrap` enables Tab-style
   * wrap to the next/previous row. Returns null if the move leaves the grid.
   */
  private computeNextCell(
    rowIndex: number,
    colId: string,
    dCol: number,
    dRow: number,
    wrap: boolean
  ): { rowIndex: number; colId: string } | null {
    const cols = this.getNavColumns();
    const ci = cols.findIndex((c) => c.colId === colId);
    if (ci === -1) return null;

    let nci = ci + dCol;
    let nri = rowIndex + dRow;

    if (dCol !== 0 && wrap) {
      if (nci >= cols.length) {
        nci = 0;
        nri++;
      } else if (nci < 0) {
        nci = cols.length - 1;
        nri--;
      }
    } else {
      nci = Math.max(0, Math.min(cols.length - 1, nci));
    }

    if (nri < 0 || nri >= this.gridApi.getDisplayedRowCount()) return null;
    return { rowIndex: nri, colId: cols[nci].colId };
  }

  private moveFocus(dCol: number, dRow: number, event: KeyboardEvent): void {
    event.preventDefault();
    const focused = this.gridApi.getFocusedCell();
    if (!focused?.column) {
      this.focusFirstCell();
      return;
    }
    const next = this.computeNextCell(focused.rowIndex, focused.column.colId, dCol, dRow, false);
    if (next) this.setFocus(next.rowIndex, next.colId);
  }

  private moveFocusTab(backwards: boolean, event: KeyboardEvent): void {
    const focused = this.gridApi.getFocusedCell();
    if (!focused?.column) {
      event.preventDefault();
      this.focusFirstCell();
      return;
    }
    const next = this.computeNextCell(
      focused.rowIndex,
      focused.column.colId,
      backwards ? -1 : 1,
      0,
      true
    );
    // Only consume Tab when it actually moves within the grid; at the first/last
    // cell let it bubble so keyboard focus can leave the grid (no focus trap).
    if (next) {
      event.preventDefault();
      this.setFocus(next.rowIndex, next.colId);
    }
  }

  private moveFocusRowEdge(end: boolean, ctrl: boolean, event: KeyboardEvent): void {
    event.preventDefault();
    const cols = this.getNavColumns();
    const rowCount = this.gridApi.getDisplayedRowCount();
    if (cols.length === 0 || rowCount === 0) return;

    const focused = this.gridApi.getFocusedCell();
    const rowIndex = ctrl ? (end ? rowCount - 1 : 0) : (focused?.rowIndex ?? 0);
    const colId = end ? cols[cols.length - 1].colId : cols[0].colId;
    this.setFocus(rowIndex, colId);
  }

  private moveFocusPage(direction: number, event: KeyboardEvent): void {
    event.preventDefault();
    const focused = this.gridApi.getFocusedCell();
    if (!focused?.column) {
      this.focusFirstCell();
      return;
    }
    const viewportHeight = this.canvasRenderer?.currentViewportHeight || 0;
    const pageRows = Math.max(1, Math.floor(viewportHeight / this.effectiveRowHeight));
    const rowCount = this.gridApi.getDisplayedRowCount();
    const nextRow = Math.max(0, Math.min(rowCount - 1, focused.rowIndex + direction * pageRows));
    this.setFocus(nextRow, focused.column.colId);
  }

  /** Start editing a cell seeded with a single typed character (type-to-edit). */
  private startEditingWithChar(rowIndex: number, colId: string, char: string): void {
    this.startEditing(rowIndex, colId, char);
    // Built-in input: seed the typed character (a custom editor gets it via
    // params.charPress in agInit instead).
    if (this.isEditing && !this.editingComponentRef) {
      this.editingValue = char;
    }
  }

  onCanvasContextMenu(event: MouseEvent): void {
    event.preventDefault();

    // Get hit test from canvas renderer to know which cell was clicked
    const hitTest = this.canvasRenderer.getHitTestResult(event);
    if (!hitTest || hitTest.rowIndex === -1) return;

    const rowNode = this.gridApi.getDisplayedRowAtIndex(hitTest.rowIndex);
    const columns = this.gridApi.getAllColumns().filter((col) => col.visible);
    const column = columns[hitTest.columnIndex];

    if (!rowNode || !column) return;

    this.contextMenuCell = { rowNode, column };

    // Resolve menu items via API if provided
    const getContextMenuItems = this.gridApi.getGridOption('getContextMenuItems');
    if (getContextMenuItems) {
      const params: GetContextMenuItemsParams<TData> = {
        node: rowNode,
        column: column,
        api: this.gridApi,
        type: 'cell',
        event: event,
      };
      this.contextMenuItems = this.resolveContextMenuItems(getContextMenuItems(params));
    } else {
      // Fallback to defaults if no callback provided
      this.contextMenuItems = this.resolveContextMenuItems([
        'copy',
        'copyWithHeaders',
        'separator',
        'export',
      ]);
    }

    if (this.contextMenuItems.length === 0) return;

    this.activeContextMenu = true;

    // Position menu at mouse coordinates relative to container
    const containerRect = this._elementRef.nativeElement.getBoundingClientRect();
    let x = event.clientX - containerRect.left;
    let y = event.clientY - containerRect.top;

    // Prevent menu from going off-container bounds
    const containerWidth = this._elementRef.nativeElement.offsetWidth;
    const containerHeight = this._elementRef.nativeElement.offsetHeight;

    if (x + 200 > containerWidth) x = containerWidth - 200;
    if (y + 200 > containerHeight) y = containerHeight - 200;

    this.contextMenuPosition = { x, y };

    // Select the row
    this.gridApi.deselectAll();
    rowNode.selected = true;
    this.updateSelectionState();
    this.canvasRenderer?.render();
    this.selectionChanged.emit(this.gridApi.getSelectedRows());

    this._cdr.detectChanges();
  }

  private resolveContextMenuItems(items: (DefaultMenuItem | MenuItemDef)[]): MenuItemDef[] {
    const resolved: MenuItemDef[] = [];

    items.forEach((item) => {
      if (typeof item === 'string') {
        const defaultItem = this.getDefaultMenuItem(item);
        if (defaultItem) resolved.push(defaultItem);
      } else {
        resolved.push(item);
      }
    });

    return resolved;
  }

  private getDefaultMenuItem(key: DefaultMenuItem): MenuItemDef | null {
    switch (key) {
      case 'copy':
        return { name: 'Copy Cell', action: () => this.copyContextMenuCell(), icon: '📋' };
      case 'copyWithHeaders':
        return this.hasRangeSelection()
          ? { name: 'Copy with Headers', action: () => this.copyRangeWithHeaders(), icon: '📋' }
          : null;
      case 'export':
        return {
          name: 'Export',
          action: () => {},
          icon: '⤓',
          subMenu: [
            { name: 'Export to CSV', action: () => this.exportCSV() },
            { name: 'Export to Excel (.xlsx)', action: () => this.exportExcel() },
          ],
        };
      case 'resetColumns':
        return { name: 'Reset Columns', action: () => this.resetColumns(), icon: '⟲' };
      case 'separator':
        return { name: '', action: () => {}, separator: true };
      default:
        return null;
    }
  }

  // ============================================================================
  // TOOLTIP
  // ============================================================================

  onCanvasMouseMove(event: MouseEvent): void {
    // Cancel any pending show and hide the current tooltip on every move
    if (this._tooltipTimer) {
      clearTimeout(this._tooltipTimer);
      this._tooltipTimer = null;
    }
    this.tooltipVisible = false;

    if (!this.canvasRenderer) return;

    const hit = this.canvasRenderer.getHitTestResult(event);
    const { rowIndex, columnIndex } = hit;
    if (rowIndex < 0 || columnIndex < 0) return;

    const columns = this.canvasRenderer.getAllColumns();
    const column = columns[columnIndex];
    if (!column) return;

    const text = this.computeTooltipText(rowIndex, column);
    if (!text) return;

    this._tooltipTimer = setTimeout(() => {
      const containerRect = this._elementRef.nativeElement.getBoundingClientRect();
      let tx = event.clientX - containerRect.left + 14;
      let ty = event.clientY - containerRect.top + 14;
      // Keep within container bounds
      const cw = this._elementRef.nativeElement.offsetWidth;
      const ch = this._elementRef.nativeElement.offsetHeight;
      if (tx + 220 > cw) tx = Math.max(0, tx - 234);
      if (ty + 56 > ch) ty = Math.max(0, ty - 70);
      this.tooltipText = text;
      this.tooltipPosition = { x: tx, y: ty };
      this.tooltipVisible = true;
      this._cdr.detectChanges();
    }, 500);
  }

  onCanvasMouseLeave(): void {
    if (this._tooltipTimer) {
      clearTimeout(this._tooltipTimer);
      this._tooltipTimer = null;
    }
    if (this.tooltipVisible) {
      this.tooltipVisible = false;
      this._cdr.detectChanges();
    }
  }

  private computeTooltipText(rowIndex: number, column: Column): string | null {
    const colDef = this.getColumnDefForColumn(column) as ColDef<TData> | null;
    if (!colDef || !this.isColDef(colDef)) return null;

    const rowNode = this.gridApi?.getDisplayedRowAtIndex(rowIndex);
    if (!rowNode?.data) return null;

    // tooltipValueGetter takes priority (AG Grid parity)
    if (typeof colDef.tooltipValueGetter === 'function') {
      const val = colDef.field ? (rowNode.data as any)[colDef.field as string] : undefined;
      return (
        colDef.tooltipValueGetter({
          value: val,
          data: rowNode.data as TData,
          node: rowNode,
          column,
        }) ?? null
      );
    }

    // tooltipField — show the value of that field
    if (colDef.tooltipField) {
      const val = (rowNode.data as any)[colDef.tooltipField as string];
      return val != null ? String(val) : null;
    }

    return null;
  }

  closeContextMenu(): void {
    this.activeContextMenu = false;
    this.contextMenuCell = null;
    this._cdr.detectChanges();
  }

  // Set Filter Methods
  isSetFilter(col: Column | ColDef<TData> | ColGroupDef<TData>): boolean {
    if ('children' in col) return false;
    const colDef = col as ColDef<TData>;
    return colDef.filter === 'set';
  }

  openSetFilter(
    event: MouseEvent | null,
    col: Column | ColDef<TData>,
    position?: { x: number; y: number }
  ): void {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }

    this.activeSetFilterColumn = col as Column;

    const field = col.field;
    if (!field || !this.gridApi) return;

    this.setFilterValues = this.gridService.getUniqueValues(field as string);

    // Restore previously selected values from the current filter model
    const existingFilter = this.gridApi.getFilterModel()[field as string] as any;
    this.setFilterSelectedValues =
      existingFilter?.filterType === 'set' && Array.isArray(existingFilter.values)
        ? existingFilter.values
        : null;

    const colDef = 'field' in col ? (col as ColDef<TData>) : null;
    this.setFilterValueFormatter = colDef?.valueFormatter
      ? (colDef.valueFormatter as any)
      : undefined;

    if (position) {
      this.setFilterPosition = position;
    } else if (event) {
      const rect = (event.target as HTMLElement).getBoundingClientRect();
      const containerRect = this._elementRef.nativeElement.getBoundingClientRect();
      this.setFilterPosition = {
        x: rect.left - containerRect.left,
        y: rect.bottom - containerRect.top + 5,
      };
    }

    setTimeout(() => {
      this.activeSetFilter = true;
      this._cdr.detectChanges();
    });
  }

  closeSetFilter(): void {
    this.activeSetFilter = false;
    this.activeSetFilterColumn = null;
    this._cdr.detectChanges();
  }

  // --- Custom filter components (colDef.filter = Angular component) ---

  /**
   * Open the custom-filter popup for a column. The filter instance is created
   * once (lazily) and kept alive so its state persists; here we just (re)attach
   * its GUI to the popup container and show it.
   */
  openCustomFilter(col: Column, position?: { x: number; y: number }): void {
    this.activeCustomFilterColumn = col;
    if (position) {
      this.customFilterPosition = position;
    }
    const ref = this.getOrCreateCustomFilter(col);
    if (!ref) return;

    // Render the popup container first, then move the (alive) filter element in.
    this.activeCustomFilter = true;
    this._cdr.detectChanges();
    const container = this.customFilterContainerRef?.nativeElement;
    if (container) {
      container.appendChild(ref.location.nativeElement);
    }
    ref.instance.afterGuiAttached?.({ suppressFocus: false });
    ref.changeDetectorRef.detectChanges();
  }

  /** Get the live filter instance for a column, creating + `agInit`-ing it on
   * first use. Returns null when the column has no resolvable filter component. */
  private getOrCreateCustomFilter(col: Column): ComponentRef<IFilterAngularComp<TData>> | null {
    const existing = this.customFilterInstances.get(col.colId);
    if (existing) return existing;

    const colDef = this.getColumnDefForColumn(col) as ColDef<TData> | null;
    const component = resolveFilterComponent<TData>(colDef, this.gridApi);
    if (!component) return null;

    const ref = this._viewContainerRef.createComponent(component) as ComponentRef<
      IFilterAngularComp<TData>
    >;
    const params: IFilterParams<TData> = {
      ...((colDef?.filterParams as Record<string, any>) || {}),
      colDef: (colDef || {}) as ColDef<TData>,
      column: col,
      api: this.gridApi,
      context: this.gridOptions?.context,
      filterChangedCallback: () => this.onCustomFilterChanged(col.colId),
      filterModifiedCallback: () => {},
      valueGetter: (node: IRowNode<TData>) => getCellValue(col, colDef, node, this.gridApi),
      getValue: (node: IRowNode<TData>) => getCellValue(col, colDef, node, this.gridApi),
    };
    ref.instance.agInit(params);

    // Restore any persisted model for this column.
    const existingModel = this.gridApi?.getFilterModel()[col.colId] as any;
    if (existingModel?.filterType === 'custom' && 'model' in existingModel) {
      ref.instance.setModel(existingModel.model);
    }

    ref.changeDetectorRef.detectChanges();
    this.customFilterInstances.set(col.colId, ref);
    return ref;
  }

  /**
   * Called by a filter instance via `filterChangedCallback`. Registers (or
   * clears) the live predicate and writes/removes the `{filterType:'custom'}`
   * model entry, then re-filters.
   */
  private onCustomFilterChanged(colId: string): void {
    const ref = this.customFilterInstances.get(colId);
    if (!ref || !this.gridApi) return;

    const model = this.gridApi.getFilterModel();
    if (ref.instance.isFilterActive()) {
      this.gridService.setCustomFilterEvaluator(colId, (data, node) =>
        ref.instance.doesFilterPass({ node, data } as IDoesFilterPassParams<TData>)
      );
      (model as any)[colId] = { filterType: 'custom', model: ref.instance.getModel?.() };
    } else {
      this.gridService.setCustomFilterEvaluator(colId, null);
      delete (model as any)[colId];
    }
    this.gridApi.setFilterModel(model);
    this.canvasRenderer?.render();
    this._cdr.detectChanges();
  }

  closeCustomFilter(): void {
    // Keep the instance alive (state persists) — just hide the popup. The popup
    // container is removed by *ngIf, detaching the filter element; it re-attaches
    // on the next open.
    this.activeCustomFilter = false;
    this.activeCustomFilterColumn = null;
    this._cdr.detectChanges();
  }

  // Filter Popup state
  activeFilterPopup = false;
  activeFilterPopupColumn: Column | null = null;
  activeFilterPopupType: 'text' | 'number' | 'date' | 'boolean' | 'set' | 'multiFilter' = 'text';
  activeFilterOperator: string = 'contains';
  filterPopupPosition = { x: 0, y: 0 };
  filterValue1: string = '';
  filterValue2: string = '';

  readonly textFilterOperators = [
    { value: 'contains', label: 'Contains' },
    { value: 'notContains', label: 'Not contains' },
    { value: 'equals', label: 'Equals' },
    { value: 'notEquals', label: 'Not equals' },
    { value: 'startsWith', label: 'Starts with' },
    { value: 'endsWith', label: 'Ends with' },
    { value: 'blank', label: 'Blank' },
    { value: 'notBlank', label: 'Not blank' },
  ];

  readonly numberFilterOperators = [
    { value: 'equals', label: 'Equals' },
    { value: 'notEquals', label: 'Not equals' },
    { value: 'greaterThan', label: 'Greater than' },
    { value: 'greaterThanOrEqual', label: 'Greater than or equals' },
    { value: 'lessThan', label: 'Less than' },
    { value: 'lessThanOrEqual', label: 'Less than or equals' },
    { value: 'inRange', label: 'In range' },
    { value: 'blank', label: 'Blank' },
    { value: 'notBlank', label: 'Not blank' },
  ];

  onFilterPopupOperatorChange(operator: string): void {
    this.activeFilterOperator = operator;
    this.applyPopupFilter();
  }

  onFilterPopupInput(event: Event, isSecondValue: boolean = false): void {
    const value = (event.target as HTMLInputElement).value;
    if (isSecondValue) {
      this.filterValue2 = value;
    } else {
      this.filterValue1 = value;
    }
    this.applyPopupFilter();
  }

  private applyPopupFilter(): void {
    if (!this.activeFilterPopupColumn || !this.gridApi) return;

    const col = this.activeFilterPopupColumn;
    const field = col.field;
    if (!field) return;

    const currentModel = this.gridApi.getFilterModel();

    if (this.activeFilterOperator === 'blank' || this.activeFilterOperator === 'notBlank') {
      currentModel[col.colId] = {
        filterType: this.activeFilterPopupType,
        type: this.activeFilterOperator,
      };
    } else {
      const value = this.filterValue1;
      if (!value && this.activeFilterOperator !== 'inRange') {
        delete currentModel[col.colId];
      } else {
        const filterModel: any = {
          filterType: this.activeFilterPopupType,
          type: this.activeFilterOperator,
          filter: value,
        };

        if (this.activeFilterOperator === 'inRange') {
          filterModel.filterTo = this.filterValue2;
        }

        currentModel[col.colId] = filterModel;
      }
    }

    this.gridApi.setFilterModel(currentModel);
    this.canvasRenderer?.render();
    this._cdr.detectChanges();
  }

  openFilterPopup(
    event: MouseEvent | null,
    col: Column,
    position?: { x: number; y: number }
  ): void {
    this.activeFilterPopupColumn = col;
    const colDef = this.getColumnDefForColumn(col);
    this.activeFilterPopupType =
      colDef && this.isColDef(colDef) && colDef.filter === 'number' ? 'number' : 'text';

    // Initialize operator and values from current model or default
    const model = this.gridApi?.getFilterModel()[col.colId] as any;
    this.activeFilterOperator =
      model?.type || (this.activeFilterPopupType === 'number' ? 'equals' : 'contains');
    this.filterValue1 = model?.filter || '';
    this.filterValue2 = model?.filterTo || '';

    if (position) {
      this.filterPopupPosition = position;
    } else if (event) {
      const rect = (event.target as HTMLElement).getBoundingClientRect();
      const containerRect = this._elementRef.nativeElement.getBoundingClientRect();
      this.filterPopupPosition = {
        x: rect.left - containerRect.left,
        y: rect.bottom - containerRect.top + 5,
      };
    }

    setTimeout(() => {
      this.activeFilterPopup = true;
      this._cdr.detectChanges();
    });
  }

  closeFilterPopup(): void {
    this.activeFilterPopup = false;
    this.activeFilterPopupColumn = null;
    this._cdr.detectChanges();
  }

  onSetFilterChanged(values: any[]): void {
    if (!this.activeSetFilterColumn || !this.gridApi) return;

    const col = this.activeSetFilterColumn;
    const colId = col.colId;
    if (!colId) return;

    const isMulti = this.isMultiFilter(col);

    if (values.length === 0) {
      if (isMulti) {
        this.updateMultiFilter(colId, null, 'set');
      } else {
        const currentModel = this.gridApi.getFilterModel();
        delete currentModel[colId];
        this.gridApi.setFilterModel(currentModel);
      }
    } else {
      const subFilter: FilterModelItem = {
        filterType: 'set',
        values: values,
      };

      if (isMulti) {
        this.updateMultiFilter(colId, subFilter, 'set');
      } else {
        const currentModel = this.gridApi.getFilterModel();
        currentModel[colId] = subFilter;
        this.gridApi.setFilterModel(currentModel);
      }
    }

    this.closeSetFilter();
    this.canvasRenderer?.render();
  }

  hasSetFilterValue(col: Column | ColDef<TData>): boolean {
    if (!this.gridApi) return false;
    const colId = (col as any).colId || (col as any).field?.toString() || '';
    if (!colId) return false;

    const model = this.gridApi.getFilterModel();
    let filter = model[colId];

    if (filter && filter.filterType === 'multiFilter') {
      filter = this.getSubFilterFromMulti(filter, 'set');
    }

    return !!(filter && filter.filterType === 'set' && filter.values && filter.values.length > 0);
  }

  getSetFilterCount(col: Column | ColDef<TData>): number {
    if (!this.gridApi) return 0;
    const colId = (col as any).colId || (col as any).field?.toString() || '';
    if (!colId) return 0;

    const model = this.gridApi.getFilterModel();
    let filter = model[colId];

    if (filter && filter.filterType === 'multiFilter') {
      filter = this.getSubFilterFromMulti(filter, 'set');
    }

    if (filter && filter.filterType === 'set' && Array.isArray(filter.values)) {
      return filter.values.length;
    }
    return 0;
  }

  // Side Bar Methods
  toggleToolPanel(panel: 'columns' | 'filters'): void {
    if (this.activeToolPanel === panel) {
      this.activeToolPanel = null;
    } else {
      this.activeToolPanel = panel;
    }
    this._cdr.detectChanges();
  }

  openColumnsPanel(): void {
    this.sideBarVisible = true;
    this.activeToolPanel = 'columns';
    this.closeHeaderMenu();
    this._cdr.detectChanges();
  }

  toggleColumnVisibility(col: Column): void {
    const colDef = this.getColumnDefForColumn(col);
    if (colDef && this.isColDef(colDef)) {
      colDef.hide = col.visible; // Toggle
      this.initializeGrid(); // Re-initialize to handle visibility changes correctly
      this.canvasRenderer?.render();
      this._cdr.detectChanges();
    }
  }

  getAllColumns(): Column[] {
    return this.gridApi?.getAllColumns() || [];
  }

  onSidebarColumnDropped(event: CdkDragDrop<Column[]>): void {
    if (!this.columnDefs) return;

    const columns = this.getAllColumns();
    moveItemInArray(columns, event.previousIndex, event.currentIndex);

    // Map back to ColDefs
    const newDefs: (ColDef<TData> | ColGroupDef<TData>)[] = [];
    columns.forEach((col) => {
      const def = this.getColumnDefForColumn(col);
      if (def) newDefs.push(def);
    });

    this.onColumnDefsChanged(newDefs);
  }

  copyContextMenuCell(): void {
    if (!this.contextMenuCell || !this.contextMenuCell.column.field) return;

    const val = (this.contextMenuCell.rowNode.data as any)[this.contextMenuCell.column.field];
    if (val !== undefined && val !== null) {
      navigator.clipboard.writeText(String(val)).catch((err) => {
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

    let text = `${columns.map((c) => this.getHeaderName(c)).join('\t')}\n`;

    for (let i = range.startRow; i <= range.endRow; i++) {
      const node = this.gridApi.getDisplayedRowAtIndex(i);
      if (node) {
        text += `${columns
          .map((c) => {
            const val = (node.data as any)[c.field || ''];
            return val !== null && val !== undefined ? String(val) : '';
          })
          .join('\t')}\n`;
      }
    }

    navigator.clipboard.writeText(text).catch((err) => {
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
    if (colDef && this.isColDef(colDef)) {
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
    if (colDef && this.isColDef(colDef)) {
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
    if (colDef && this.isColDef(colDef)) {
      colDef.pinned = pin as any;
    }

    if (this.columnDefs) {
      this.onColumnDefsChanged([...this.columnDefs]);
    }

    this.closeHeaderMenu();
  }

  onColumnDropped(event: CdkDragDrop<any>, pinned: 'left' | 'right' | 'none'): void {
    const col = event.item.data as Column;
    if (!col) return;

    const targetPinned = pinned === 'none' ? false : pinned;

    if (col.pinned !== targetPinned) {
      this.gridApi.setColumnPinned(col, targetPinned);
    }

    this.gridApi.moveColumn(col, event.currentIndex);

    this.canvasRenderer?.render();
    this._cdr.detectChanges();
  }

  // --- Column Resizing Logic ---

  isResizable(item: Column | ColumnGroup | ColDef<TData> | ColGroupDef<TData>): boolean {
    if ('children' in item) {
      return (item as any).children.some((child: any) => this.isResizable(child));
    }
    const colId = (item as any).colId || (item as any).field?.toString();
    if (colId === 'ag-Grid-SelectionColumn') return true;

    const colDef = this.getColumnDefForColumn(item as any);
    return colDef && this.isColDef(colDef) ? colDef.resizable !== false : true;
  }

  onResizeMouseDown(event: MouseEvent, item: Column | ColumnGroup): void {
    event.stopPropagation();
    event.preventDefault();

    this.isResizing = true;
    this.resizeItem = item;
    this.resizeStartX = event.clientX;
    this.resizeStartWidth = this.getItemWidth(item);

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
    if (!this.isResizing || !this.resizeItem) return;

    const deltaX = event.clientX - this.resizeStartX;
    const newWidth = Math.max(20, this.resizeStartWidth + deltaX);

    this.applyResize(this.resizeItem!, newWidth);

    // Force re-render
    this.canvasRenderer?.render();
    this._cdr.detectChanges();
  }

  private onResizeMouseUp(): void {
    this.isResizing = false;
    this.resizeItem = null;
    // A new column width changes how auto-height cells wrap → re-measure rows.
    this.gridService.recalculateRowHeights();
    this.canvasRenderer?.render();
  }

  private applyResize(item: Column | ColumnGroup, newWidth: number): void {
    if ('children' in item) {
      const currentWidth = this.getItemWidth(item);
      if (currentWidth === 0) return;

      const ratio = newWidth / currentWidth;
      item.children.forEach((child) => {
        if (isColumnVisible(child)) {
          const childWidth = this.getItemWidth(child);
          this.applyResize(child, childWidth * ratio);
        }
      });
    } else {
      const finalWidth = Math.floor(newWidth);
      (item as Column).width = finalWidth;
      const colDef = this.getColumnDefForColumn(item as Column);
      if (colDef && this.isColDef(colDef)) {
        colDef.width = finalWidth;
      }
    }
  }

  // --- Floating Filter Logic ---

  hasFloatingFilters(): boolean {
    if (this.gridApi?.getGridOption('floatingFilter')) return true;
    if (this.gridOptions?.defaultColDef?.floatingFilter) return true;

    if (!this.columnDefs) return false;
    const hasAny = this.columnDefs.some((col) => {
      if ('children' in col) {
        return col.children.some((child) => (child as any).floatingFilter);
      }
      return (col as any).floatingFilter;
    });
    return hasAny;
  }

  isFloatingFilterEnabled(col: Column | ColDef<TData> | ColGroupDef<TData>): boolean {
    const colDef = this.getColumnDefForColumn(col as any);
    if (!colDef || 'children' in colDef) return false;

    const filter = colDef.filter;
    if (!filter) return false;

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

  isMultiFilter(col: Column | ColDef<TData> | ColGroupDef<TData>): boolean {
    const colDef = this.getColumnDefForColumn(col as any);
    return colDef && this.isColDef(colDef) && Array.isArray(colDef.filter);
  }

  getFilterTypeFromCol(colDef: ColDef<TData>): string {
    if (Array.isArray(colDef.filter)) {
      return 'multiFilter';
    }
    return colDef.filter === true ? 'text' : colDef.filter || 'text';
  }

  private getSubFilterFromMulti(
    multiFilter: FilterModelItem,
    type: 'text' | 'number' | 'date' | 'boolean' | 'set'
  ): FilterModelItem | null {
    if (multiFilter.filterType !== 'multiFilter' || !multiFilter.filterModels) {
      return null;
    }
    return multiFilter.filterModels.find((m) => m.filterType === type) || null;
  }

  private updateMultiFilter(
    colId: string,
    subFilter: FilterModelItem | null,
    type: 'text' | 'number' | 'date' | 'boolean' | 'set'
  ): void {
    if (!this.gridApi) return;
    const currentModel = this.gridApi.getFilterModel();
    let multiFilter = currentModel[colId];

    if (!multiFilter || multiFilter.filterType !== 'multiFilter') {
      multiFilter = {
        filterType: 'multiFilter',
        filterModels: [],
      };
    }

    const models = multiFilter.filterModels || [];
    const existingIndex = models.findIndex((m) => m.filterType === type);

    if (subFilter) {
      if (existingIndex >= 0) {
        models[existingIndex] = subFilter;
      } else {
        models.push(subFilter);
      }
    } else if (existingIndex >= 0) {
      models.splice(existingIndex, 1);
    }

    if (models.length === 0) {
      delete currentModel[colId];
    } else {
      multiFilter.filterModels = models;
      currentModel[colId] = multiFilter;
    }

    this.gridApi.setFilterModel(currentModel);
  }

  private filterTimeout: any;
  onFloatingFilterInput(event: Event, col: Column | ColDef<TData> | ColGroupDef<TData>): void {
    const colDef = this.getColumnDefForColumn(col as any);
    if (!colDef || !this.isColDef(colDef)) return;

    const input = event.target as HTMLInputElement;
    const value = input.value;
    const colId = (col as any).colId || (col as any).field?.toString() || '';

    this._cdr.detectChanges(); // Update clear button visibility immediately

    clearTimeout(this.filterTimeout);
    this.filterTimeout = setTimeout(() => {
      if (!this.gridApi) return;

      const currentModel = this.gridApi.getFilterModel();
      const isMulti = this.isMultiFilter(col);
      const filterType = this.getFilterTypeForFloating(colDef);

      let existingFilter: any;
      if (isMulti) {
        const multi = currentModel[colId];
        existingFilter = (multi && this.getSubFilterFromMulti(multi, filterType as any)) || {};
      } else {
        existingFilter = currentModel[colId] || {};
      }

      if (!value && existingFilter.type !== 'blank' && existingFilter.type !== 'notBlank') {
        if (isMulti) {
          this.updateMultiFilter(colId, null, filterType as any);
        } else {
          delete currentModel[colId];
          this.gridApi.setFilterModel(currentModel);
        }
      } else {
        const subFilter: FilterModelItem = {
          ...existingFilter,
          filterType: filterType as any,
          type: existingFilter.type || (filterType === 'text' ? 'contains' : 'equals'),
          filter: value,
        };

        if (isMulti) {
          this.updateMultiFilter(colId, subFilter, filterType as any);
        } else {
          currentModel[colId] = subFilter;
          this.gridApi.setFilterModel(currentModel);
        }
      }

      this.canvasRenderer?.render();
    }, 300);
  }

  private getFilterTypeForFloating(colDef: ColDef<TData>): string {
    if (Array.isArray(colDef.filter)) {
      // Find the first non-set filter for the floating input
      return colDef.filter.find((f) => f !== 'set') || 'text';
    }
    return colDef.filter === true ? 'text' : colDef.filter || 'text';
  }

  getFloatingFilterValue(col: Column | ColDef<TData> | ColGroupDef<TData>): string {
    if (!this.gridApi) return '';
    const colId = (col as any).colId || (col as any).field?.toString() || '';
    const model = this.gridApi.getFilterModel();
    let filter = model[colId];

    if (filter && filter.filterType === 'multiFilter') {
      const colDef = this.getColumnDefForColumn(col as any);
      if (colDef && this.isColDef(colDef)) {
        const type = this.getFilterTypeForFloating(colDef);
        filter = this.getSubFilterFromMulti(filter, type as any);
      }
    }

    return filter?.filter || '';
  }

  hasFilterValue(
    col: Column | ColDef<TData> | ColGroupDef<TData>,
    _input: HTMLInputElement
  ): boolean {
    return !!this.getFloatingFilterValue(col);
  }

  clearFloatingFilter(
    col: Column | ColDef<TData> | ColGroupDef<TData>,
    input: HTMLInputElement
  ): void {
    const colDef = this.getColumnDefForColumn(col as any);
    if (!colDef || !this.isColDef(colDef)) return;

    input.value = '';
    const colId = (col as any).colId || (col as any).field?.toString() || '';

    if (this.isMultiFilter(col)) {
      const type = this.getFilterTypeForFloating(colDef);
      this.updateMultiFilter(colId, null, type as any);
    } else {
      const currentModel = this.gridApi.getFilterModel();
      delete currentModel[colId];
      this.gridApi.setFilterModel(currentModel);
    }

    this.canvasRenderer?.render();
    this._cdr.detectChanges();
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
  startEditing(rowIndex: number, colId: string, charPress: string | null = null): void {
    const rowNode = this.gridApi.getDisplayedRowAtIndex(rowIndex);
    const column = this.gridApi.getColumn(colId);

    // Prevent editing on group rows or missing data/column
    if (!rowNode || rowNode.group || !column || !column.field) return;

    // Check if cell is editable
    const colDef = this.getColumnDefForColumn(column);
    if (colDef && this.isColDef(colDef) && colDef.editable === false) return;

    // If already editing another cell, stop it first
    if (this.isEditing) {
      this.stopEditing(true);
    }

    const value = (rowNode.data as any)[column.field];

    this.editingRowNode = rowNode;
    this.editingColDef = this.isColDef(colDef) ? colDef : null;
    this.editingValue = value !== null && value !== undefined ? String(value) : '';

    // Calculate editor position based on row and column
    const columns = this.gridApi.getAllColumns().filter((c) => isColumnVisible(c));
    let x = 0;
    for (const col of columns) {
      if (col.colId === colId) break;
      x += Math.floor(col.width || 150);
    }

    this.editorPosition = {
      x: x - this.canvasRenderer.currentScrollLeft,
      y: rowIndex * this.effectiveRowHeight - this.canvasRenderer.currentScrollTop,
      width: Math.floor(column.width),
      height: this.effectiveRowHeight,
    };

    // Resolve a custom cellEditor component (class, registered name, or selector).
    // null → fall back to the built-in text input below.
    const editorComponent = this.editingColDef
      ? this.createEditorComponent(this.editingColDef, value, rowNode, column, rowIndex, charPress)
      : null;

    this.isEditing = true;

    // Hide the component overlay for this cell (if any) so the editor owns it.
    this.cellOverlayManager?.hideCell(rowIndex, colId);

    if (editorComponent) {
      // Render the editor host, then mount the custom component into it and focus.
      this._cdr.detectChanges();
      const host = this.editorContainerRef?.nativeElement;
      if (host) host.appendChild(editorComponent.location.nativeElement);
      const inst = editorComponent.instance;
      if (typeof inst.afterGuiAttached === 'function') inst.afterGuiAttached();
      else if (typeof inst.focusIn === 'function') inst.focusIn();
      else
        (editorComponent.location.nativeElement as HTMLElement)
          .querySelector<HTMLElement>('input, select, textarea, [tabindex]')
          ?.focus();
      return;
    }

    // Built-in text editor: focus the input after the view updates.
    setTimeout(() => {
      if (this.editorInputRef) {
        const input = this.editorInputRef.nativeElement;
        input.focus();
        input.select();
      }
    }, 0);
  }

  /**
   * Resolve and instantiate a custom `cellEditor` Angular component for the cell,
   * or return null to use the built-in text editor. Mirrors the renderer overlay:
   * created via the grid's ViewContainerRef, then mounted into the editor host by
   * the caller. Sets {@link editingComponentRef} on success.
   */
  private createEditorComponent(
    colDef: ColDef<TData>,
    value: any,
    node: IRowNode<TData>,
    column: Column,
    rowIndex: number,
    charPress: string | null
  ): ComponentRef<ICellEditorAngularComp<TData>> | null {
    const rendererParams = {
      value,
      data: node.data,
      node,
      rowIndex,
      colDef,
      column,
      api: this.gridApi,
    } as any;
    const { component, params: selectorParams } = resolveCellEditor(colDef, rendererParams);
    if (!component) return null;

    const ref = this._viewContainerRef.createComponent(component) as ComponentRef<
      ICellEditorAngularComp<TData>
    >;
    const editorParams: ICellEditorParams<TData> = {
      ...(colDef.cellEditorParams || {}),
      ...(selectorParams || {}),
      value,
      data: node.data,
      node,
      rowIndex,
      colDef,
      column,
      api: this.gridApi,
      charPress,
      eventKey: charPress,
      cellStartedEdit: true,
      stopEditing: (cancel?: boolean) => this.stopEditing(!cancel),
    };
    ref.instance.agInit(editorParams);

    // An editor may veto starting (e.g. a popup that opened a dialog instead).
    if (
      typeof ref.instance.isCancelBeforeStart === 'function' &&
      ref.instance.isCancelBeforeStart()
    ) {
      ref.destroy();
      return null;
    }

    this.editingComponentRef = ref;
    return ref;
  }

  private validationErrors: string[] | null = null;

  stopEditing(save: boolean = true): void {
    if (!this.isEditing) return;

    // A custom editor may veto the commit as it closes.
    const editorInstance = this.editingComponentRef?.instance;
    if (
      save &&
      typeof editorInstance?.isCancelAfterEnd === 'function' &&
      editorInstance.isCancelAfterEnd()
    ) {
      save = false;
    }

    if (this.editorInputRef) {
      this.editorInputRef.nativeElement.classList.remove('ag-cell-editor-invalid');
    }
    this.validationErrors = null;

    const rowNode = this.editingRowNode;
    const colDef = this.editingColDef;

    if (save && colDef && rowNode) {
      // Custom editor → its getValue() (raw, typed value); else the input text.
      let newValue: any;
      if (editorInstance) {
        newValue = editorInstance.getValue();
      } else {
        if (this.editorInputRef) {
          this.editingValue = this.editorInputRef.nativeElement.value;
        }
        newValue = this.editingValue;
      }
      const field = colDef.field as string;
      const oldValue = (rowNode.data as any)[field];

      let parsedValue: any = newValue;
      if (typeof colDef.valueParser === 'function') {
        parsedValue = colDef.valueParser({
          value: oldValue,
          newValue,
          data: rowNode.data,
          node: rowNode,
          colDef,
          api: this.gridApi,
        });
      }

      // Validate before mutating data (avoid partial changes on validation failure)
      // First check if there are validation errors with the parsed value
      let hasValidationErrors = false;
      if (typeof colDef.getValidationErrors === 'function') {
        this.validationErrors = colDef.getValidationErrors({
          value: parsedValue,
          data: rowNode.data, // Use old data for validation (not yet mutated)
          node: rowNode,
          colDef,
          api: this.gridApi,
        });

        if (this.validationErrors && this.validationErrors.length > 0) {
          hasValidationErrors = true;
        }
      }

      // Handle validation errors BEFORE any data mutation
      if (hasValidationErrors) {
        const invalidMode = this.gridOptions?.invalidEditValueMode ?? 'legacy';

        // In .none. mode, exit without applying transaction
        // Ensure isEditing is cleared on validation failure
        if (invalidMode === 'none') {
          // 'none' mode: exit without applying transaction (don't save invalid data)
          this.resetEditingState();
          return;
        }

        // For other modes: show error but keep editing active
        if (this.editorInputRef) {
          this.editorInputRef.nativeElement.classList.add('ag-cell-editor-invalid');
        }
        this._cdr.detectChanges();
        return;
      }

      // Only now apply the valueSetter or default assignment
      let valueSetterResult = true;

      if (typeof colDef.valueSetter === 'function') {
        valueSetterResult =
          colDef.valueSetter({
            value: parsedValue,
            newValue: parsedValue,
            data: rowNode.data,
            node: rowNode,
            colDef,
            api: this.gridApi,
          }) ?? true;
      } else if (field) {
        (rowNode.data as any)[field] = parsedValue;
      }

      // Handle valueSetter failure
      if (valueSetterResult === false) {
        const invalidMode = this.gridOptions?.invalidEditValueMode ?? 'legacy';

        // Handle invalid value in all modes
        if (invalidMode === 'none') {
          this.resetEditingState();
          return;
        }

        this.validationErrors = ['Invalid value'];

        if (this.editorInputRef) {
          this.editorInputRef.nativeElement.classList.add('ag-cell-editor-invalid');
        }

        // Clear isEditing on valueSetter failure
        // But we want to keep editing active so user can fix the value
        // Actually for valueSetter failure, let's keep editing active like original
        this._cdr.detectChanges();
        return;
      }

      // Apply transaction to update grid
      this.gridApi.applyTransaction({
        update: [rowNode.data],
      });

      if (colDef.onCellValueChanged) {
        const column = this.gridApi.getColumn(colDef.colId || field || '');
        if (column) {
          colDef.onCellValueChanged({
            newValue: parsedValue,
            oldValue,
            data: rowNode.data,
            node: rowNode,
            column,
          });
        }
      }

      this.canvasRenderer?.render();
    }

    this.resetEditingState();
  }

  /**
   * Tear down the active edit: destroy any custom editor instance, clear editing
   * state, re-show overlay cells, and repaint. Shared by every edit-exit path.
   */
  private resetEditingState(): void {
    if (this.editingComponentRef) {
      this.editingComponentRef.destroy();
      this.editingComponentRef = null;
    }
    this.isEditing = false;
    this.editingRowNode = null;
    this.editingColDef = null;
    this.validationErrors = null;
    this.cellOverlayManager?.showAll();
    this._cdr.detectChanges();
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
    const next = this.computeNextCell(rowIndex, colId, backwards ? -1 : 1, 0, true);
    if (next) {
      this.gridApi.setFocusedCell(next.rowIndex, next.colId);
      this.startEditing(next.rowIndex, next.colId);
    }
  }

  onEditorBlur(): void {
    // Save on blur, matching AG Grid default behavior
    if (this.isEditing) {
      this.stopEditing(true);
    }
  }
  private getColumnDefForColumn(
    column: Column | ColumnGroup | ColDef<TData> | ColGroupDef<TData>
  ): ColDef<TData> | ColGroupDef<TData> | null {
    if (!this.columnDefs) return null;

    const colId =
      (column as any).colId || (column as any).field?.toString() || (column as any).groupId;
    if (!colId) return null;

    const defaultColDef = this.gridOptions?.defaultColDef || {};

    const findDef = (
      defs: (ColDef<TData> | ColGroupDef<TData>)[]
    ): ColDef<TData> | ColGroupDef<TData> | null => {
      for (const def of defs) {
        const defId = (def as any).colId || (def as any).field?.toString() || (def as any).groupId;
        if (defId === colId) {
          return 'children' in def ? def : ({ ...defaultColDef, ...def } as ColDef<TData>);
        }
        if ('children' in def) {
          const found = findDef(def.children);
          if (found) return found;
        }
      }
      return null;
    };

    return findDef(this.columnDefs);
  }

  private isColDef(def: any): def is ColDef<TData> {
    return def && !('children' in def);
  }

  onRowClick(rowIndex: number, event: MouseEvent): void {
    const rowNode = this.gridApi.getDisplayedRowAtIndex(rowIndex);
    if (!rowNode) return;

    const selectionMode = this.gridApi.getGridOption('rowSelection') || 'single';
    const isMultiSelect =
      (selectionMode as any) === 'multiple' || (selectionMode as any) === 'multiRow';

    if (isMultiSelect && (event.ctrlKey || event.metaKey)) {
      rowNode.setSelected(!rowNode.selected);
    } else if (isMultiSelect && event.shiftKey) {
      rowNode.setSelected(true);
    } else {
      if (rowNode.selected) {
        rowNode.setSelected(false);
      } else {
        rowNode.setSelected(true, true);
      }
    }

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
