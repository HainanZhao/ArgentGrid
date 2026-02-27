import { GridApi, IRowNode, Column } from '../types/ag-grid-types';

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
  private rowBuffer = 5; // Render extra rows above/below viewport for smooth scrolling
  private totalRowCount = 0;
  private viewportHeight = 0;
  private viewportWidth = 0;
  
  // Callback for cell editing
  onCellDoubleClick?: (rowIndex: number, colId: string) => void;
  
  // Callback for row click (selection)
  onRowClick?: (rowIndex: number, event: MouseEvent) => void;

  // Styling constants
  private readonly CELL_PADDING = 8;
  private readonly BORDER_COLOR = '#e0e0e0';
  private readonly TEXT_COLOR = '#333';
  private readonly SELECTED_BG_COLOR = '#e3f2fd';
  private readonly HOVER_BG_COLOR = '#f5f5f5';
  private readonly FONT = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  private readonly ROW_STRIPING: { even: string; odd: string } = { even: '#ffffff', odd: '#fafafa' };

  constructor(
    canvas: HTMLCanvasElement,
    gridApi: GridApi<TData>,
    rowHeight: number = 32
  ) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.gridApi = gridApi;
    this.rowHeight = rowHeight;

    this.setupEventListeners();
    this.resize();
  }

  private setupEventListeners(): void {
    // Handle scroll events with passive listener for better performance
    const container = this.canvas.parentElement;
    if (container) {
      container.addEventListener('scroll', this.handleScroll.bind(this), { passive: true });
    }

    // Handle mouse interactions
    this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.addEventListener('click', this.handleClick.bind(this));
    this.canvas.addEventListener('dblclick', this.handleDoubleClick.bind(this));

    // Handle resize with debounce
    let resizeTimeout: number;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => this.resize(), 150) as any;
    });
  }

  private handleScroll(): void {
    const container = this.canvas.parentElement;
    if (!container) return;
    
    this.scrollTop = container.scrollTop;
    this.scrollLeft = container.scrollLeft;
    
    // Schedule render on next animation frame
    if (!this.renderPending) {
      this.renderPending = true;
      requestAnimationFrame(() => {
        this.doRender();
        this.renderPending = false;
      });
    }
  }

  /**
   * Update the total row count for virtual scrolling
   */
  setTotalRowCount(count: number): void {
    this.totalRowCount = count;
    this.updateCanvasSize();
  }

  /**
   * Set viewport dimensions
   */
  setViewportDimensions(width: number, height: number): void {
    this.viewportWidth = width;
    this.viewportHeight = height;
    this.updateCanvasSize();
  }

  private updateCanvasSize(): void {
    const dpr = window.devicePixelRatio || 1;
    
    // Set canvas size for the visible area (viewport)
    const width = this.viewportWidth || this.canvas.clientWidth;
    const height = this.viewportHeight || this.canvas.clientHeight || 600;
    
    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    
    // Scale context for DPR (use setTransform if available, fallback to scale)
    if (typeof this.ctx.setTransform === 'function') {
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    } else {
      this.ctx.scale(dpr, dpr);
    }
    
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

  private doRender(): void {
    const width = this.viewportWidth || this.canvas.clientWidth;
    const height = this.viewportHeight || this.canvas.clientHeight;

    // Clear canvas
    this.ctx.clearRect(0, 0, width, height);

    // Calculate visible range with buffer for smooth scrolling
    const startIndex = Math.max(0, Math.floor(this.scrollTop / this.rowHeight) - this.rowBuffer);
    const endIndex = Math.min(
      startIndex + Math.ceil(height / this.rowHeight) + (this.rowBuffer * 2),
      this.totalRowCount || this.gridApi.getDisplayedRowCount()
    );

    // Get columns and separate by pinning
    const allVisibleColumns = this.gridApi.getAllColumns().filter(col => col.visible);
    const leftPinned = allVisibleColumns.filter(c => c.pinned === 'left');
    const rightPinned = allVisibleColumns.filter(c => c.pinned === 'right');
    const centerColumns = allVisibleColumns.filter(c => !c.pinned);

    const leftWidth = leftPinned.reduce((sum, c) => sum + c.width, 0);
    const rightWidth = rightPinned.reduce((sum, c) => sum + c.width, 0);

    // Calculate column positions for each group
    const renderCol = (cols: Column[], startX: number, isScrollable: boolean, rowIndex: number, rowNode: IRowNode<TData>, y: number) => {
      let x = startX;
      cols.forEach((col, colIndex) => {
        const cellX = isScrollable ? x - this.scrollLeft : x;
        const cellWidth = col.width;

        // Skip rendering if cell is outside viewport (only for center columns)
        if (isScrollable && (cellX + cellWidth < leftWidth || cellX > width - rightWidth)) {
          x += cellWidth;
          return;
        }

        const cellValue = (rowNode.data as any)[col.field || ''];

        // Cell border
        this.ctx.strokeStyle = this.BORDER_COLOR;
        this.ctx.beginPath();
        this.ctx.moveTo(cellX + cellWidth, y);
        this.ctx.lineTo(cellX + cellWidth, y + this.rowHeight);
        this.ctx.stroke();

        // Cell text
        if (cellValue !== null && cellValue !== undefined) {
          this.ctx.fillStyle = this.TEXT_COLOR;
          
          let text = String(cellValue);
          let textX = cellX + this.CELL_PADDING;
          
          // Add indentation and indicator for group rows
          const isAutoGroupCol = col.colId === 'ag-Grid-AutoColumn';
          const isFirstColIfNoAutoGroup = !allVisibleColumns.some(c => c.colId === 'ag-Grid-AutoColumn') && col === allVisibleColumns[0];

          if ((isAutoGroupCol || isFirstColIfNoAutoGroup) && (rowNode.group || rowNode.level > 0)) {
            const indent = rowNode.level * 20;
            textX += indent;
            
            if (rowNode.group) {
              this.ctx.beginPath();
              if (rowNode.expanded) {
                this.ctx.moveTo(textX, y + this.rowHeight / 2 - 3);
                this.ctx.lineTo(textX + 8, y + this.rowHeight / 2 - 3);
                this.ctx.lineTo(textX + 4, y + this.rowHeight / 2 + 3);
              } else {
                this.ctx.moveTo(textX + 2, y + this.rowHeight / 2 - 4);
                this.ctx.lineTo(textX + 6, y + this.rowHeight / 2);
                this.ctx.lineTo(textX + 2, y + this.rowHeight / 2 + 4);
              }
              this.ctx.fill();
              textX += 15;
            }
          }

          const truncatedText = this.truncateText(
            text,
            cellWidth - (textX - cellX) - this.CELL_PADDING
          );

          this.ctx.fillText(truncatedText, textX, y + this.rowHeight / 2);
        }
        x += cellWidth;
      });
    };

    // Set common context properties once
    this.ctx.font = this.FONT;
    this.ctx.textBaseline = 'middle';

    // Render visible rows
    for (let rowIndex = startIndex; rowIndex < endIndex; rowIndex++) {
      const rowNode = this.gridApi.getDisplayedRowAtIndex(rowIndex);
      if (!rowNode) continue;

      const y = (rowIndex * this.rowHeight) - this.scrollTop;

      // 1. Row background
      this.ctx.fillStyle = rowIndex % 2 === 0 ? this.ROW_STRIPING.even : this.ROW_STRIPING.odd;
      this.ctx.fillRect(0, y, width, this.rowHeight);

      if (rowNode.selected) {
        this.ctx.fillStyle = this.SELECTED_BG_COLOR;
        this.ctx.fillRect(0, y, width, this.rowHeight);
      }

      // 2. Center columns (with clipping)
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.rect(leftWidth, y, width - leftWidth - rightWidth, this.rowHeight);
      this.ctx.clip();
      renderCol(centerColumns, leftWidth, true, rowIndex, rowNode, y);
      this.ctx.restore();

      // 3. Left pinned columns
      renderCol(leftPinned, 0, false, rowIndex, rowNode, y);

      // 4. Right pinned columns
      renderCol(rightPinned, width - rightWidth, false, rowIndex, rowNode, y);

      // 5. Row bottom border
      this.ctx.strokeStyle = this.BORDER_COLOR;
      this.ctx.beginPath();
      this.ctx.moveTo(0, y + this.rowHeight);
      this.ctx.lineTo(width, y + this.rowHeight);
      this.ctx.stroke();
      
      // 6. Draw vertical lines separating pinned sections
      if (leftWidth > 0) {
        this.ctx.strokeStyle = '#ccc';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(leftWidth, y);
        this.ctx.lineTo(leftWidth, y + this.rowHeight);
        this.ctx.stroke();
        this.ctx.lineWidth = 1;
      }
      if (rightWidth > 0) {
        this.ctx.strokeStyle = '#ccc';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(width - rightWidth, y);
        this.ctx.lineTo(width - rightWidth, y + this.rowHeight);
        this.ctx.stroke();
        this.ctx.lineWidth = 1;
      }
    }
  }

  private truncateText(text: string, maxWidth: number): string {
    if (maxWidth <= 0) return '';
    const metrics = this.ctx.measureText(text);
    if (metrics.width <= maxWidth) {
      return text;
    }

    // Binary search for optimal truncation
    let start = 0;
    let end = text.length;
    while (start < end) {
      const mid = Math.floor((start + end) / 2);
      const truncated = text.slice(0, mid) + '...';
      if (this.ctx.measureText(truncated).width <= maxWidth) {
        start = mid + 1;
      } else {
        end = mid;
      }
    }

    return text.slice(0, Math.max(0, start - 1)) + '...';
  }

  private handleMouseDown(event: MouseEvent): void {
    const { rowIndex } = this.getHitTestResult(event);
    
    const rowNode = this.gridApi.getDisplayedRowAtIndex(rowIndex);
    if (!rowNode) return;

    // Handle selection
    if (event.ctrlKey || event.metaKey) {
      rowNode.selected = !rowNode.selected;
    } else if (event.shiftKey) {
      // Range selection (TODO: implement)
    } else {
      this.gridApi.deselectAll();
      rowNode.selected = true;
    }

    this.render();
  }

  private handleMouseMove(event: MouseEvent): void {
    // TODO: Implement hover state with cursor feedback
  }

  private handleClick(event: MouseEvent): void {
    const { rowIndex, columnIndex } = this.getHitTestResult(event);
    
    const rowNode = this.gridApi.getDisplayedRowAtIndex(rowIndex);
    if (!rowNode) return;

    // Handle expand/collapse toggle if it's a group row and clicked near the indicator
    if (rowNode.group && columnIndex !== -1) {
      const columns = this.gridApi.getAllColumns().filter(col => col.visible);
      const clickedCol = columns[columnIndex];
      
      const isAutoGroupCol = clickedCol.colId === 'ag-Grid-AutoColumn';
      const isFirstColIfNoAutoGroup = !columns.some(c => c.colId === 'ag-Grid-AutoColumn') && columnIndex === 0;

      if (isAutoGroupCol || isFirstColIfNoAutoGroup) {
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        
        // Account for pinning in click detection
        let colX = 0;
        if (clickedCol.pinned === 'left') {
          // Calculate start X of this left-pinned column
          const leftPinned = columns.filter(c => c.pinned === 'left');
          for (let i = 0; i < columns.indexOf(clickedCol); i++) {
            if (columns[i].pinned === 'left') colX += columns[i].width;
          }
        } else if (clickedCol.pinned === 'right') {
          colX = this.viewportWidth - columns.filter(c => c.pinned === 'right').reduce((sum, c, i) => i >= columns.indexOf(clickedCol) ? sum + c.width : sum, 0);
        } else {
          const leftWidth = columns.filter(c => c.pinned === 'left').reduce((sum, c) => sum + c.width, 0);
          colX = leftWidth + this.getCenterColumnOffset(clickedCol) - this.scrollLeft;
        }

        const indent = rowNode.level * 20;
        const indicatorAreaWidth = colX + this.CELL_PADDING + indent + 20;

        if (x >= colX + indent && x < indicatorAreaWidth) {
          this.gridApi.setRowNodeExpanded(rowNode, !rowNode.expanded);
          this.render();
          return;
        }
      }
    }

    // Emit row click event for selection handling
    if (this.onRowClick) {
      this.onRowClick(rowIndex, event);
    }
  }

  private handleDoubleClick(event: MouseEvent): void {
    const { rowIndex, columnIndex } = this.getHitTestResult(event);
    if (columnIndex === -1) return;

    const rowNode = this.gridApi.getDisplayedRowAtIndex(rowIndex);
    if (!rowNode) return;

    // Get column at index
    const columns = this.gridApi.getAllColumns().filter(col => col.visible);
    const column = columns[columnIndex];
    
    // Trigger cell editing callback
    if (this.onCellDoubleClick) {
      this.onCellDoubleClick(rowIndex, column.colId);
    }
  }

  getHitTestResult(event: MouseEvent): { rowIndex: number; columnIndex: number } {
    const rect = this.canvas.getBoundingClientRect();
    const y = event.clientY - rect.top + this.scrollTop;
    const x = event.clientX - rect.left;

    const rowIndex = Math.floor(y / this.rowHeight);

    const columns = this.gridApi.getAllColumns().filter(col => col.visible);
    const leftPinned = columns.filter(c => c.pinned === 'left');
    const rightPinned = columns.filter(c => c.pinned === 'right');
    const centerColumns = columns.filter(c => !c.pinned);

    const leftWidth = leftPinned.reduce((sum, c) => sum + c.width, 0);
    const rightWidth = rightPinned.reduce((sum, c) => sum + c.width, 0);

    // 1. Check Left Pinned
    if (x < leftWidth) {
      let xPos = 0;
      for (const col of leftPinned) {
        if (x < xPos + col.width) {
          return { rowIndex, columnIndex: columns.indexOf(col) };
        }
        xPos += col.width;
      }
    }

    // 2. Check Right Pinned
    if (x > this.viewportWidth - rightWidth) {
      let xPos = this.viewportWidth - rightWidth;
      for (const col of rightPinned) {
        if (x < xPos + col.width) {
          return { rowIndex, columnIndex: columns.indexOf(col) };
        }
        xPos += col.width;
      }
    }

    // 3. Check Center
    const scrolledX = x - leftWidth + this.scrollLeft;
    let xPos = 0;
    for (const col of centerColumns) {
      if (scrolledX < xPos + col.width) {
        return { rowIndex, columnIndex: columns.indexOf(col) };
      }
      xPos += col.width;
    }

    return { rowIndex, columnIndex: -1 };
  }

  private getCenterColumnOffset(targetCol: Column): number {
    const columns = this.gridApi.getAllColumns().filter(col => col.visible && !col.pinned);
    let offset = 0;
    for (const col of columns) {
      if (col === targetCol) return offset;
      offset += col.width;
    }
    return offset;
  }

  /**
   * Scroll to a specific row index
   */
  scrollToRow(rowIndex: number): void {
    const container = this.canvas.parentElement;
    if (!container) return;

    const targetPosition = rowIndex * this.rowHeight;
    container.scrollTop = targetPosition;
    this.scrollTop = targetPosition;
    this.scheduleRender();
  }

  /**
   * Scroll to top
   */
  scrollToTop(): void {
    this.scrollToRow(0);
  }

  /**
   * Scroll to bottom
   */
  scrollToBottom(): void {
    const container = this.canvas.parentElement;
    if (!container) return;
    
    container.scrollTop = container.scrollHeight - container.clientHeight;
    this.scrollTop = container.scrollTop;
    this.scheduleRender();
  }

  destroy(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.renderPending = false;
  }
}
