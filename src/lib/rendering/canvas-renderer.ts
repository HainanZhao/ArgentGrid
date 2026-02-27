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

    console.log('[CanvasRenderer] doRender:', { width, height, totalRowCount: this.totalRowCount, scrollTop: this.scrollTop });

    // Clear canvas
    this.ctx.clearRect(0, 0, width, height);

    // Calculate visible range with buffer for smooth scrolling
    const startIndex = Math.max(0, Math.floor(this.scrollTop / this.rowHeight) - this.rowBuffer);
    const endIndex = Math.min(
      startIndex + Math.ceil(height / this.rowHeight) + (this.rowBuffer * 2),
      this.totalRowCount || this.gridApi.getDisplayedRowCount()
    );

    console.log('[CanvasRenderer] visible rows:', { startIndex, endIndex });

    // Get columns (cache this for performance)
    const columns = this.gridApi.getAllColumns().filter(col => col.visible);

    console.log('[CanvasRenderer] columns:', columns.length);

    // Calculate column positions
    let x = 0;
    const columnPositions: Map<string, { x: number; width: number }> = new Map();
    columns.forEach(col => {
      columnPositions.set(col.colId, { x, width: col.width });
      x += col.width;
    });

    // Set common context properties once
    this.ctx.fillStyle = this.TEXT_COLOR;
    this.ctx.font = this.FONT;
    this.ctx.textBaseline = 'middle';

    // Render visible rows
    for (let rowIndex = startIndex; rowIndex < endIndex; rowIndex++) {
      const rowNode = this.gridApi.getDisplayedRowAtIndex(rowIndex);
      if (!rowNode) continue;

      const y = (rowIndex * this.rowHeight) - this.scrollTop;

      // Row background (striping for better readability)
      this.ctx.fillStyle = rowIndex % 2 === 0 ? this.ROW_STRIPING.even : this.ROW_STRIPING.odd;
      this.ctx.fillRect(0, y, width, this.rowHeight);

      // Selected row overlay
      if (rowNode.selected) {
        this.ctx.fillStyle = this.SELECTED_BG_COLOR;
        this.ctx.fillRect(0, y, width, this.rowHeight);
      }

      // Row borders
      this.ctx.strokeStyle = this.BORDER_COLOR;
      this.ctx.beginPath();
      this.ctx.moveTo(0, y + this.rowHeight);
      this.ctx.lineTo(width, y + this.rowHeight);
      this.ctx.stroke();

      // Render cells
      columns.forEach((col, colIndex) => {
        const colPos = columnPositions.get(col.colId);
        if (!colPos) return;

        const cellX = colPos.x - this.scrollLeft;
        
        // Skip rendering if cell is outside horizontal viewport
        if (cellX + colPos.width < 0 || cellX > width) return;

        const cellValue = (rowNode.data as any)[col.field || ''];

        // Cell border
        this.ctx.strokeStyle = this.BORDER_COLOR;
        this.ctx.beginPath();
        this.ctx.moveTo(cellX + colPos.width, y);
        this.ctx.lineTo(cellX + colPos.width, y + this.rowHeight);
        this.ctx.stroke();

        // Cell text with truncation
        if (cellValue !== null && cellValue !== undefined) {
          this.ctx.fillStyle = this.TEXT_COLOR;
          
          let text = String(cellValue);
          let textX = cellX + this.CELL_PADDING;
          
          // Add indentation and indicator for group rows in the first visible column
          if (colIndex === 0 && (rowNode.group || rowNode.level > 0)) {
            const indent = rowNode.level * 20;
            textX += indent;
            
            if (rowNode.group) {
              // Render chevron
              this.ctx.beginPath();
              this.ctx.fillStyle = this.TEXT_COLOR;
              if (rowNode.expanded) {
                // Down chevron
                this.ctx.moveTo(textX, y + this.rowHeight / 2 - 3);
                this.ctx.lineTo(textX + 8, y + this.rowHeight / 2 - 3);
                this.ctx.lineTo(textX + 4, y + this.rowHeight / 2 + 3);
              } else {
                // Right chevron
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
            colPos.width - (textX - cellX) - this.CELL_PADDING
          );

          this.ctx.fillText(
            truncatedText,
            textX,
            y + this.rowHeight / 2
          );
        }
      });
    }
  }

  private truncateText(text: string, maxWidth: number): string {
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
    if (rowNode.group && columnIndex === 0) {
      // Check if click was roughly in the indentation/chevron area
      const rect = this.canvas.getBoundingClientRect();
      const x = event.clientX - rect.left + this.scrollLeft;
      const indent = rowNode.level * 20;
      const indicatorAreaWidth = this.CELL_PADDING + indent + 20;

      if (x < indicatorAreaWidth) {
        this.gridApi.setRowNodeExpanded(rowNode, !rowNode.expanded);
        this.render();
        return;
      }
    }

    // Emit row click event for selection handling
    if (this.onRowClick) {
      this.onRowClick(rowIndex, event);
    }
  }

  private handleDoubleClick(event: MouseEvent): void {
    const { rowIndex, columnIndex } = this.getHitTestResult(event);
    
    const rowNode = this.gridApi.getDisplayedRowAtIndex(rowIndex);
    if (!rowNode) return;

    // Get column at index
    const columns = this.gridApi.getAllColumns().filter(col => col.visible);
    if (columnIndex >= columns.length) return;

    const column = columns[columnIndex];
    
    // Trigger cell editing callback
    if (this.onCellDoubleClick) {
      this.onCellDoubleClick(rowIndex, column.colId);
    }
  }

  private getHitTestResult(event: MouseEvent): { rowIndex: number; columnIndex: number } {
    const rect = this.canvas.getBoundingClientRect();
    const y = event.clientY - rect.top + this.scrollTop;
    const x = event.clientX - rect.left + this.scrollLeft;

    const rowIndex = Math.floor(y / this.rowHeight);

    // Calculate column index
    const columns = this.gridApi.getAllColumns().filter(col => col.visible);
    let columnIndex = 0;
    let xPos = 0;
    for (const col of columns) {
      if (x < xPos + col.width) {
        break;
      }
      xPos += col.width;
      columnIndex++;
    }

    return { rowIndex, columnIndex };
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
