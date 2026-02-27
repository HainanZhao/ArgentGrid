import { GridApi, IRowNode, Column, ColDef } from '../types/ag-grid-types';

// Import new rendering modules from the index
import {
  // Types
  GridTheme,
  ColumnPrepResult,
  // Theme
  DEFAULT_THEME,
  getFontFromTheme,
  mergeTheme,
  // Walker
  walkColumns,
  walkRows,
  walkCells,
  getVisibleRowRange,
  getPinnedWidths,
  getColumnAtX,
  getRowAtY,
  // Blitting
  BlitState,
  calculateBlit,
  shouldBlit,
  // Cells
  truncateText,
  prepColumn,
  getFormattedValue,
  // Lines
  drawRowLines,
  drawColumnLines,
  getColumnBorderPositions,
} from './render';
import { DamageTracker } from './utils/damage-tracker';

/**
 * CanvasRenderer - High-performance canvas rendering engine for ArgentGrid
 *
 * Renders the data viewport using HTML5 Canvas for optimal performance
 * with large datasets (100,000+ rows at 60fps)
 *
 * Features:
 * - Virtual scrolling (only renders visible rows)
 * - requestAnimationFrame batching
 * - Device pixel ratio support
 * - Row buffering for smooth scrolling
 * - Blitting optimization for frame-to-frame efficiency
 * - Damage tracking for partial redraws
 */
export class CanvasRenderer<TData = any> {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private gridApi: GridApi<TData>;
  private rowHeight: number;
  private scrollTop = 0;
  private scrollLeft = 0;

  get currentScrollTop(): number { return this.scrollTop; }
  get currentScrollLeft(): number { return this.scrollLeft; }

  private animationFrameId: number | null = null;
  private renderPending = false;
  private rowBuffer = 5;
  private totalRowCount = 0;
  private viewportHeight = 0;
  private viewportWidth = 0;

  // Theme system
  private theme: GridTheme;

  // Performance tracking
  private lastRenderDuration = 0;
  get lastFrameTime(): number { return this.lastRenderDuration; }

  // Damage tracking
  private damageTracker = new DamageTracker();

  // Blitting state
  private blitState = new BlitState();

  // Column prep results cache
  private columnPreps: Map<string, ColumnPrepResult<TData>> = new Map();

  // Event listener references for cleanup
  private scrollListener?: (e: Event) => void;
  private resizeListener?: () => void;
  private mousedownListener?: (e: MouseEvent) => void;
  private mousemoveListener?: (e: MouseEvent) => void;
  private clickListener?: (e: MouseEvent) => void;
  private dblclickListener?: (e: MouseEvent) => void;

  // Callbacks
  onCellDoubleClick?: (rowIndex: number, colId: string) => void;
  onRowClick?: (rowIndex: number, event: MouseEvent) => void;

  constructor(
    canvas: HTMLCanvasElement,
    gridApi: GridApi<TData>,
    rowHeight: number = 32,
    theme?: Partial<GridTheme>
  ) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.gridApi = gridApi;
    this.rowHeight = rowHeight;
    this.theme = mergeTheme(DEFAULT_THEME, { rowHeight }, theme || {});

    this.setupEventListeners();
    this.resize();
  }

  /**
   * Update the theme
   */
  setTheme(theme: Partial<GridTheme>): void {
    this.theme = mergeTheme(DEFAULT_THEME, { rowHeight: this.rowHeight }, theme);
    this.damageTracker.markAllDirty();
    this.scheduleRender();
  }

  /**
   * Get current theme
   */
  getTheme(): GridTheme {
    return this.theme;
  }

  private setupEventListeners(): void {
    const container = this.canvas.parentElement;
    if (container) {
      this.scrollListener = this.handleScroll.bind(this);
      container.addEventListener('scroll', this.scrollListener, { passive: true });
    }

    this.mousedownListener = this.handleMouseDown.bind(this);
    this.mousemoveListener = this.handleMouseMove.bind(this);
    this.clickListener = this.handleClick.bind(this);
    this.dblclickListener = this.handleDoubleClick.bind(this);

    this.canvas.addEventListener('mousedown', this.mousedownListener);
    this.canvas.addEventListener('mousemove', this.mousemoveListener);
    this.canvas.addEventListener('click', this.clickListener);
    this.canvas.addEventListener('dblclick', this.dblclickListener);

    let resizeTimeout: number;
    this.resizeListener = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => this.resize(), 150) as any;
    };
    window.addEventListener('resize', this.resizeListener);
  }

  private handleScroll(): void {
    const container = this.canvas.parentElement;
    if (!container) return;

    const oldScrollTop = this.scrollTop;
    const oldScrollLeft = this.scrollLeft;

    this.scrollTop = container.scrollTop;
    this.scrollLeft = container.scrollLeft;

    // Update blit state
    const lastScroll = this.blitState.updateScroll(this.scrollLeft, this.scrollTop);

    // Check if we should blit
    const { left, right } = getPinnedWidths(this.getVisibleColumns());
    const blitResult = calculateBlit(
      { x: this.scrollLeft, y: this.scrollTop },
      lastScroll,
      { width: this.viewportWidth, height: this.viewportHeight },
      { left, right }
    );

    if (blitResult.canBlit && this.blitState.hasLastFrame()) {
      // Blitting is possible - the render will copy from last frame
      this.damageTracker.markAllDirty(); // For now, still do full redraw but with blit
    } else {
      // Full redraw needed
      this.damageTracker.markAllDirty();
    }

    if (!this.renderPending) {
      this.renderPending = true;
      requestAnimationFrame(() => {
        this.doRender();
        this.renderPending = false;
      });
    }
  }

  setTotalRowCount(count: number): void {
    this.totalRowCount = count;
    this.damageTracker.markAllDirty();
    this.updateCanvasSize();
  }

  setViewportDimensions(width: number, height: number): void {
    this.viewportWidth = width;
    this.viewportHeight = height;
    this.damageTracker.markAllDirty();
    this.updateCanvasSize();
  }

  private updateCanvasSize(): void {
    const dpr = window.devicePixelRatio || 1;

    const width = this.viewportWidth || this.canvas.clientWidth;
    const height = this.viewportHeight || this.canvas.clientHeight || 600;

    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;

    if (typeof this.ctx.setTransform === 'function') {
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    } else {
      this.ctx.scale(dpr, dpr);
    }

    // Reset blit state on resize
    this.blitState.reset();
    this.scheduleRender();
  }

  resize(): void {
    const container = this.canvas.parentElement;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    this.viewportWidth = rect.width;
    this.viewportHeight = rect.height;

    this.updateCanvasSize();
  }

  render(): void {
    this.damageTracker.markAllDirty();
    this.scheduleRender();
  }

  private scheduleRender(): void {
    if (this.renderPending) return;

    this.renderPending = true;
    requestAnimationFrame(() => {
      this.doRender();
      this.renderPending = false;
    });
  }

  private getVisibleColumns(): Column[] {
    return this.gridApi.getAllColumns().filter(col => col.visible);
  }

  private prepareColumns(): void {
    const columns = this.getVisibleColumns();
    this.columnPreps.clear();

    for (const column of columns) {
      const colDef = this.getColumnDef(column);
      this.columnPreps.set(column.colId, prepColumn(this.ctx, column, colDef, this.theme));
    }
  }

  private doRender(): void {
    const startTime = performance.now();
    const width = this.viewportWidth || this.canvas.clientWidth;
    const height = this.viewportHeight || this.canvas.clientHeight;

    // Clear canvas
    this.ctx.clearRect(0, 0, width, height);

    // Get visible columns
    const allVisibleColumns = this.getVisibleColumns();
    const { left: leftWidth, right: rightWidth } = getPinnedWidths(allVisibleColumns);

    // Calculate visible row range
    const totalRows = this.totalRowCount || this.gridApi.getDisplayedRowCount();
    const { startRow, endRow } = getVisibleRowRange(
      this.scrollTop,
      height,
      this.rowHeight,
      totalRows,
      this.rowBuffer
    );

    // Prepare columns (sets font, caches colDef)
    this.prepareColumns();

    // Set common context properties
    this.ctx.font = getFontFromTheme(this.theme);
    this.ctx.textBaseline = 'middle';

    // Render visible rows using walker
    walkRows(startRow, endRow, this.scrollTop, this.rowHeight, 
      (rowIndex) => this.gridApi.getDisplayedRowAtIndex(rowIndex),
      (rowIndex, y, rowHeight, rowNode) => {
        if (!rowNode) return;
        this.renderRow(rowIndex, y, rowNode, allVisibleColumns, width, leftWidth, rightWidth);
      }
    );

    // Draw grid lines
    this.drawGridLines(allVisibleColumns, startRow, endRow, width, height, leftWidth, rightWidth);

    // Store current frame for blitting
    this.blitState.setLastCanvas(this.canvas);

    // Clear damage
    this.damageTracker.clear();
    
    this.lastRenderDuration = performance.now() - startTime;
  }

  private renderRow(
    rowIndex: number,
    y: number,
    rowNode: IRowNode<TData>,
    allVisibleColumns: Column[],
    viewportWidth: number,
    leftWidth: number,
    rightWidth: number
  ): void {
    const isEvenRow = rowIndex % 2 === 0;

    // Draw row background
    let bgColor = isEvenRow ? this.theme.bgCellEven : this.theme.bgCell;
    if (rowNode.selected) {
      bgColor = this.theme.bgSelection;
    }

    this.ctx.fillStyle = bgColor;
    this.ctx.fillRect(0, Math.floor(y), viewportWidth, this.rowHeight);

    // Render left pinned columns
    const leftPinned = allVisibleColumns.filter(c => c.pinned === 'left');
    this.renderColumns(leftPinned, 0, false, rowNode, y, viewportWidth, leftWidth, rightWidth, allVisibleColumns);

    // Render center columns (with clipping)
    const centerColumns = allVisibleColumns.filter(c => !c.pinned);
    if (centerColumns.length > 0) {
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.rect(
        Math.floor(leftWidth), 
        Math.floor(y), 
        Math.floor(viewportWidth - leftWidth - rightWidth), 
        this.rowHeight
      );
      this.ctx.clip();
      this.renderColumns(centerColumns, leftWidth, true, rowNode, y, viewportWidth, leftWidth, rightWidth, allVisibleColumns);
      this.ctx.restore();
    }

    // Render right pinned columns
    const rightPinned = allVisibleColumns.filter(c => c.pinned === 'right');
    this.renderColumns(rightPinned, viewportWidth - rightWidth, false, rowNode, y, viewportWidth, leftWidth, rightWidth, allVisibleColumns);
  }

  private renderColumns(
    columns: Column[],
    startX: number,
    isScrollable: boolean,
    rowNode: IRowNode<TData>,
    y: number,
    viewportWidth: number,
    leftWidth: number,
    rightWidth: number,
    allVisibleColumns: Column[]
  ): void {
    let x = startX;

    for (const col of columns) {
      const cellX = isScrollable ? x - this.scrollLeft : x;
      const cellWidth = col.width;

      // Skip if outside viewport (for center columns)
      if (isScrollable && (cellX + cellWidth < leftWidth || cellX > viewportWidth - rightWidth)) {
        x += cellWidth;
        continue;
      }

      this.renderCell(col, cellX, y, cellWidth, rowNode, allVisibleColumns);
      x += cellWidth;
    }
  }

  private renderCell(
    column: Column,
    x: number,
    y: number,
    width: number,
    rowNode: IRowNode<TData>,
    allVisibleColumns: Column[]
  ): void {
    const prep = this.columnPreps.get(column.colId);
    if (!prep) return;

    const cellValue = (rowNode.data as any)?.[column.field || ''];
    const formattedValue = getFormattedValue(
      cellValue,
      prep.colDef,
      rowNode.data,
      rowNode,
      this.gridApi
    );

    if (!formattedValue) return;

    this.ctx.fillStyle = this.theme.textCell;

    let textX = x + this.theme.cellPadding;

    // Handle group indentation
    const isAutoGroupCol = column.colId === 'ag-Grid-AutoColumn';
    const isFirstColIfNoAutoGroup = !allVisibleColumns.some(c => c.colId === 'ag-Grid-AutoColumn') && column === allVisibleColumns[0];

    if ((isAutoGroupCol || isFirstColIfNoAutoGroup) && (rowNode.group || rowNode.level > 0)) {
      const indent = rowNode.level * this.theme.groupIndentWidth;
      textX += indent;

      // Draw expand/collapse indicator
      if (rowNode.group) {
        this.drawGroupIndicator(textX, y, rowNode.expanded);
        textX += this.theme.groupIndicatorSize + 3;
      }
    }

    const truncatedText = truncateText(
      this.ctx,
      formattedValue,
      width - (textX - x) - this.theme.cellPadding
    );

    if (truncatedText) {
      this.ctx.fillText(truncatedText, Math.floor(textX), Math.floor(y + this.rowHeight / 2));
    }
  }

  private drawGroupIndicator(x: number, y: number, expanded: boolean): void {
    this.ctx.beginPath();
    const centerY = Math.floor(y + this.rowHeight / 2);
    const size = this.theme.groupIndicatorSize;

    if (expanded) {
      // Expanded: horizontal line
      this.ctx.moveTo(Math.floor(x), centerY);
      this.ctx.lineTo(Math.floor(x + size), centerY);
    } else {
      // Collapsed: plus sign
      const halfSize = size / 2;
      this.ctx.moveTo(Math.floor(x), centerY);
      this.ctx.lineTo(Math.floor(x + size), centerY);
      this.ctx.moveTo(Math.floor(x + halfSize), centerY - halfSize);
      this.ctx.lineTo(Math.floor(x + halfSize), centerY + halfSize);
    }
    this.ctx.stroke();
  }

  private drawGridLines(
    columns: Column[],
    startRow: number,
    endRow: number,
    viewportWidth: number,
    viewportHeight: number,
    leftWidth: number,
    rightWidth: number
  ): void {
    // Draw horizontal row lines
    drawRowLines(
      this.ctx,
      startRow,
      endRow,
      this.rowHeight,
      this.scrollTop,
      viewportWidth,
      this.theme
    );

    // Draw vertical column lines
    drawColumnLines(
      this.ctx,
      columns,
      this.scrollLeft,
      this.scrollTop,
      viewportWidth,
      viewportHeight,
      leftWidth,
      rightWidth,
      this.theme,
      startRow,
      endRow,
      this.rowHeight
    );
  }

  // ============================================================================
  // EVENT HANDLING
  // ============================================================================

  private handleMouseDown(event: MouseEvent): void {
    const { rowIndex } = this.getHitTestResult(event);
    const rowNode = this.gridApi.getDisplayedRowAtIndex(rowIndex);
    if (!rowNode) return;

    // Track old selection for damage tracking
    const oldSelectedRows = new Set<number>();
    for (let i = 0; i < this.gridApi.getDisplayedRowCount(); i++) {
      const node = this.gridApi.getDisplayedRowAtIndex(i);
      if (node?.selected) oldSelectedRows.add(i);
    }

    if (event.ctrlKey || event.metaKey) {
      rowNode.selected = !rowNode.selected;
    } else {
      this.gridApi.deselectAll();
      rowNode.selected = true;
    }

    // Track new selection
    const newSelectedRows = new Set<number>();
    for (let i = 0; i < this.gridApi.getDisplayedRowCount(); i++) {
      const node = this.gridApi.getDisplayedRowAtIndex(i);
      if (node?.selected) newSelectedRows.add(i);
    }

    // Mark changed rows as dirty
    this.damageTracker.markSelectionChanged(oldSelectedRows, newSelectedRows);

    this.scheduleRender();
  }

  private handleMouseMove(event: MouseEvent): void {
    // TODO: Implement hover state
  }

  private handleClick(event: MouseEvent): void {
    const { rowIndex, columnIndex } = this.getHitTestResult(event);
    const rowNode = this.gridApi.getDisplayedRowAtIndex(rowIndex);
    if (!rowNode) return;

    // Handle expand/collapse
    if (rowNode.group && columnIndex !== -1) {
      const columns = this.getVisibleColumns();
      const clickedCol = columns[columnIndex];

      const isAutoGroupCol = clickedCol.colId === 'ag-Grid-AutoColumn';
      const isFirstColIfNoAutoGroup = !columns.some(c => c.colId === 'ag-Grid-AutoColumn') && columnIndex === 0;

      if (isAutoGroupCol || isFirstColIfNoAutoGroup) {
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const { left: leftWidth, right: rightWidth } = getPinnedWidths(columns);

        let colX = 0;
        if (clickedCol.pinned === 'left') {
          const leftPinned = columns.filter(c => c.pinned === 'left');
          for (let i = 0; i < columns.indexOf(clickedCol); i++) {
            if (columns[i].pinned === 'left') colX += columns[i].width;
          }
        } else if (clickedCol.pinned === 'right') {
          colX = this.viewportWidth - columns.filter(c => c.pinned === 'right').reduce((sum, c) => sum + c.width, 0);
        } else {
          colX = leftWidth + this.getCenterColumnOffset(clickedCol) - this.scrollLeft;
        }

        const indent = rowNode.level * this.theme.groupIndentWidth;
        const indicatorAreaEnd = colX + this.theme.cellPadding + indent + this.theme.groupIndicatorSize + 3;

        if (x >= colX + this.theme.cellPadding + indent && x < indicatorAreaEnd) {
          this.gridApi.setRowNodeExpanded(rowNode, !rowNode.expanded);
          this.damageTracker.markAllDirty(); // Group expansion affects many rows
          this.render();
          return;
        }
      }
    }

    if (this.onRowClick) {
      this.onRowClick(rowIndex, event);
    }
  }

  private handleDoubleClick(event: MouseEvent): void {
    const { rowIndex, columnIndex } = this.getHitTestResult(event);
    if (columnIndex === -1) return;

    const rowNode = this.gridApi.getDisplayedRowAtIndex(rowIndex);
    if (!rowNode) return;

    const columns = this.getVisibleColumns();
    const column = columns[columnIndex];

    if (this.onCellDoubleClick) {
      this.onCellDoubleClick(rowIndex, column.colId);
    }
  }

  getHitTestResult(event: MouseEvent): { rowIndex: number; columnIndex: number } {
    const rect = this.canvas.getBoundingClientRect();
    const canvasY = event.clientY - rect.top;
    const canvasX = event.clientX - rect.left;

    // Use walker utility for row detection
    const rowIndex = getRowAtY(canvasY, this.rowHeight, this.scrollTop);

    // Use walker utility for column detection
    const result = getColumnAtX(
      this.getVisibleColumns(),
      canvasX,
      this.scrollLeft,
      this.viewportWidth
    );

    return { rowIndex, columnIndex: result.index };
  }

  private getCenterColumnOffset(targetCol: Column): number {
    const columns = this.getVisibleColumns().filter(c => !c.pinned);
    let offset = 0;
    for (const col of columns) {
      if (col === targetCol) return offset;
      offset += col.width;
    }
    return offset;
  }

  private getColumnDef(column: Column): ColDef<TData> | null {
    const allDefs = this.gridApi.getColumnDefs();
    if (!allDefs) return null;

    for (const def of allDefs) {
      if ('children' in def) {
        const found = def.children.find(c => {
          const cDef = c as ColDef;
          return cDef.colId === column.colId || cDef.field?.toString() === column.colId || cDef.field?.toString() === column.field;
        });
        if (found) return found as ColDef<TData>;
      } else {
        const cDef = def as ColDef;
        if (cDef.colId === column.colId || cDef.field?.toString() === column.colId || cDef.field?.toString() === column.field) {
          return def as ColDef<TData>;
        }
      }
    }
    return null;
  }

  // ============================================================================
  // SCROLL API
  // ============================================================================

  scrollToRow(rowIndex: number): void {
    const container = this.canvas.parentElement;
    if (!container) return;

    const targetPosition = rowIndex * this.rowHeight;
    container.scrollTop = targetPosition;
    this.scrollTop = targetPosition;
    this.damageTracker.markAllDirty();
    this.scheduleRender();
  }

  scrollToTop(): void {
    this.scrollToRow(0);
  }

  scrollToBottom(): void {
    const container = this.canvas.parentElement;
    if (!container) return;

    container.scrollTop = container.scrollHeight - container.clientHeight;
    this.scrollTop = container.scrollTop;
    this.damageTracker.markAllDirty();
    this.scheduleRender();
  }

  // ============================================================================
  // DAMAGE TRACKING API
  // ============================================================================

  /**
   * Mark a specific cell as dirty
   */
  invalidateCell(colIndex: number, rowIndex: number): void {
    this.damageTracker.markCellDirty(colIndex, rowIndex);
    this.scheduleRender();
  }

  /**
   * Mark a row as dirty
   */
  invalidateRow(rowIndex: number): void {
    this.damageTracker.markRowDirty(rowIndex);
    this.scheduleRender();
  }

  /**
   * Mark entire grid as dirty
   */
  invalidateAll(): void {
    this.damageTracker.markAllDirty();
    this.scheduleRender();
  }

  destroy(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    
    // Remove event listeners
    const container = this.canvas.parentElement;
    if (container && this.scrollListener) {
      container.removeEventListener('scroll', this.scrollListener);
    }
    
    if (this.mousedownListener) this.canvas.removeEventListener('mousedown', this.mousedownListener);
    if (this.mousemoveListener) this.canvas.removeEventListener('mousemove', this.mousemoveListener);
    if (this.clickListener) this.canvas.removeEventListener('click', this.clickListener);
    if (this.dblclickListener) this.canvas.removeEventListener('dblclick', this.dblclickListener);
    
    if (this.resizeListener) {
      window.removeEventListener('resize', this.resizeListener);
    }

    this.renderPending = false;
    this.blitState.reset();
    this.damageTracker.reset();
  }
}
