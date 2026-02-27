import { GridApi, IRowNode, Column } from '../types/ag-grid-types';

/**
 * CanvasRenderer - High-performance canvas rendering engine for ArgentGrid
 * 
 * Renders the data viewport using HTML5 Canvas for optimal performance
 * with large datasets (100,000+ rows at 60fps)
 */
export class CanvasRenderer<TData = any> {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private gridApi: GridApi<TData>;
  private rowHeight: number;
  private visibleRows: IRowNode<TData>[] = [];
  private scrollTop = 0;
  private scrollLeft = 0;
  private animationFrameId: number | null = null;
  
  // Styling constants
  private readonly CELL_PADDING = 8;
  private readonly BORDER_COLOR = '#e0e0e0';
  private readonly TEXT_COLOR = '#333';
  private readonly SELECTED_BG_COLOR = '#e3f2fd';
  private readonly HOVER_BG_COLOR = '#f5f5f5';
  private readonly FONT = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  
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
    // Handle scroll events
    const container = this.canvas.parentElement;
    if (container) {
      container.addEventListener('scroll', (e) => {
        this.scrollTop = container.scrollTop;
        this.scrollLeft = container.scrollLeft;
        this.scheduleRender();
      });
    }
    
    // Handle mouse interactions
    this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.addEventListener('click', this.handleClick.bind(this));
    
    // Handle resize
    window.addEventListener('resize', () => this.resize());
  }
  
  resize(): void {
    const container = this.canvas.parentElement;
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    // Set canvas size with device pixel ratio for sharp rendering
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.canvas.style.width = `${rect.width}px`;
    this.canvas.style.height = `${rect.height}px`;
    
    // Scale context for DPR
    this.ctx.scale(dpr, dpr);
    
    this.scheduleRender();
  }
  
  render(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    
    this.animationFrameId = requestAnimationFrame(() => {
      this.doRender();
      this.animationFrameId = null;
    });
  }
  
  private scheduleRender(): void {
    this.render();
  }
  
  private doRender(): void {
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;
    
    // Clear canvas
    this.ctx.clearRect(0, 0, width, height);
    
    // Get visible rows based on scroll position
    const startIndex = Math.floor(this.scrollTop / this.rowHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(height / this.rowHeight) + 1,
      this.gridApi.getDisplayedRowCount()
    );
    
    // Get columns
    const columns = this.gridApi.getAllColumns().filter(col => col.visible);
    
    // Calculate column positions
    let x = 0;
    const columnPositions: Map<string, { x: number; width: number }> = new Map();
    columns.forEach(col => {
      columnPositions.set(col.colId, { x, width: col.width });
      x += col.width;
    });
    
    // Render visible rows
    for (let rowIndex = startIndex; rowIndex < endIndex; rowIndex++) {
      const rowNode = this.gridApi.getDisplayedRowAtIndex(rowIndex);
      if (!rowNode) continue;
      
      const y = rowIndex * this.rowHeight;
      
      // Row background
      if (rowNode.selected) {
        this.ctx.fillStyle = this.SELECTED_BG_COLOR;
        this.ctx.fillRect(0, y, x, this.rowHeight);
      }
      
      // Row border
      this.ctx.strokeStyle = this.BORDER_COLOR;
      this.ctx.beginPath();
      this.ctx.moveTo(0, y + this.rowHeight);
      this.ctx.lineTo(x, y + this.rowHeight);
      this.ctx.stroke();
      
      // Render cells
      this.ctx.fillStyle = this.TEXT_COLOR;
      this.ctx.font = this.FONT;
      this.ctx.textBaseline = 'middle';
      
      columns.forEach(col => {
        const colPos = columnPositions.get(col.colId);
        if (!colPos) return;
        
        const cellX = colPos.x;
        const cellValue = (rowNode.data as any)[col.field || ''];
        
        // Cell border
        this.ctx.strokeStyle = this.BORDER_COLOR;
        this.ctx.beginPath();
        this.ctx.moveTo(cellX + colPos.width, y);
        this.ctx.lineTo(cellX + colPos.width, y + this.rowHeight);
        this.ctx.stroke();
        
        // Cell text
        const text = cellValue !== null && cellValue !== undefined ? String(cellValue) : '';
        const truncatedText = this.truncateText(
          text,
          colPos.width - (this.CELL_PADDING * 2),
          this.ctx
        );
        
        this.ctx.fillText(
          truncatedText,
          cellX + this.CELL_PADDING,
          y + this.rowHeight / 2
        );
      });
    }
    
    // Store visible rows for hit testing
    this.visibleRows = [];
    for (let rowIndex = startIndex; rowIndex < endIndex; rowIndex++) {
      const rowNode = this.gridApi.getDisplayedRowAtIndex(rowIndex);
      if (rowNode) {
        this.visibleRows.push(rowNode);
      }
    }
  }
  
  private truncateText(text: string, maxWidth: number, ctx: CanvasRenderingContext2D): string {
    const metrics = ctx.measureText(text);
    if (metrics.width <= maxWidth) {
      return text;
    }
    
    let truncated = text;
    while (ctx.measureText(truncated + '...').width > maxWidth && truncated.length > 0) {
      truncated = truncated.slice(0, -1);
    }
    
    return truncated + '...';
  }
  
  private handleMouseDown(event: MouseEvent): void {
    const { rowIndex } = this.getHitTestResult(event);
    if (rowIndex === -1) return;
    
    const rowNode = this.visibleRows[rowIndex];
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
    // TODO: Implement hover state
  }
  
  private handleClick(event: MouseEvent): void {
    const { rowIndex, columnIndex } = this.getHitTestResult(event);
    if (rowIndex === -1) return;
    
    const rowNode = this.visibleRows[rowIndex];
    if (!rowNode) return;
    
    // Emit row click event (TODO: use EventEmitter)
    console.log('Row clicked:', rowNode.data);
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
  
  destroy(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }
}
