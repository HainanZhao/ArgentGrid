/**
 * Cell Rendering for Canvas Renderer
 *
 * Handles drawing of individual cells with prep/draw cycle optimization.
 */

import { ColDef, Column, GridApi, IRowNode } from '../../types/ag-grid-types';
import { getFontFromTheme } from './theme';
import { CellDrawContext, ColumnPrepResult, GridTheme } from './types';

/**
 * Get value from object using path (e.g. 'pivotData.NY.salary')
 */
export function getValueByPath(obj: any, path: string): any {
  if (!path || !obj) return undefined;
  if (!path.includes('.')) return obj[path];

  return path.split('.').reduce((acc, part) => acc?.[part], obj);
}

// ============================================================================
// CELL PREP PHASE
// ============================================================================

/**
 * Prepare column for rendering
 * Called once per column before rendering all cells in that column
 */
export function prepColumn<TData = any>(
  ctx: CanvasRenderingContext2D,
  column: Column,
  colDef: ColDef<TData> | null,
  theme: GridTheme
): ColumnPrepResult<TData> {
  // Set font once per column (expensive operation)
  const font = getFontFromTheme(theme);
  ctx.font = font;

  return {
    column,
    colDef,
    theme,
    font,
  };
}

/**
 * Prepare multiple columns
 */
export function prepColumns<TData = any>(
  ctx: CanvasRenderingContext2D,
  columns: Column[],
  getColDef: (col: Column) => ColDef<TData> | null,
  theme: GridTheme
): Map<string, ColumnPrepResult<TData>> {
  const results = new Map<string, ColumnPrepResult<TData>>();

  for (const column of columns) {
    const colDef = getColDef(column);
    results.set(column.colId, prepColumn(ctx, column, colDef, theme));
  }

  return results;
}

// ============================================================================
// CELL DRAW PHASE
// ============================================================================

/**
 * Draw a single cell
 */
export function drawCell<TData = any>(
  ctx: CanvasRenderingContext2D,
  prep: ColumnPrepResult<TData>,
  context: CellDrawContext<TData>
): void {
  const { rowNode } = context;

  // Draw cell background
  drawCellBackground(ctx, context);

  // Draw cell content based on column type
  drawCellContent(ctx, prep, context);

  // Draw group indicators if needed
  if (rowNode && (rowNode.group || rowNode.level > 0)) {
    drawGroupIndicators(ctx, prep, context);
  }
}

/**
 * Draw cell background
 */
export function drawCellBackground<TData = any>(
  ctx: CanvasRenderingContext2D,
  context: CellDrawContext<TData>
): void {
  const { x, y, width, height, isSelected, isHovered, isEvenRow } = context;
  const { theme } = context;

  // Determine background color
  let bgColor = isEvenRow ? theme.bgCellEven : theme.bgCell;
  if (isSelected) bgColor = theme.bgSelection;
  if (isHovered) bgColor = theme.bgHover;

  ctx.fillStyle = bgColor;
  ctx.fillRect(Math.floor(x), Math.floor(y), Math.floor(width), Math.floor(height));
}

/**
 * Draw cell content (text)
 */
export function drawCellContent<TData = any>(
  ctx: CanvasRenderingContext2D,
  _prep: ColumnPrepResult<TData>,
  context: CellDrawContext<TData>
): void {
  const { x, y, width, height, formattedValue, theme } = context;

  if (!formattedValue) return;

  // Calculate text position with padding
  const textX = x + theme.cellPadding;
  const textY = y + height / 2; // Centered vertically

  // Set text properties
  ctx.fillStyle = theme.textCell;
  ctx.textBaseline = 'middle';

  // Truncate text if needed
  const maxWidth = width - theme.cellPadding * 2;
  const truncatedText = truncateText(ctx, formattedValue, maxWidth);

  if (truncatedText) {
    ctx.fillText(truncatedText, Math.floor(textX), Math.floor(textY));
  }
}

/**
 * Draw group/tree indicators
 */
export function drawGroupIndicators<TData = any>(
  ctx: CanvasRenderingContext2D,
  _prep: ColumnPrepResult<TData>,
  context: CellDrawContext<TData>
): void {
  const { x, y, height, column, rowNode, theme } = context;

  if (!rowNode) return;

  // Only draw on first visible column or auto-group column
  const isAutoGroupCol = column.colId === 'ag-Grid-AutoColumn';

  if (!isAutoGroupCol) return;

  // Calculate indent
  const indent = rowNode.level * theme.groupIndentWidth;
  const indicatorX = x + theme.cellPadding + indent;
  const indicatorY = y + height / 2;

  // Draw expand/collapse indicator for groups
  if (rowNode.group) {
    ctx.fillStyle = theme.textCell;
    ctx.beginPath();

    if (rowNode.expanded) {
      // Expanded: horizontal line (minus sign)
      const lineY = Math.floor(indicatorY);
      ctx.moveTo(Math.floor(indicatorX), lineY);
      ctx.lineTo(Math.floor(indicatorX + theme.groupIndicatorSize), lineY);
    } else {
      // Collapsed: plus sign
      const size = theme.groupIndicatorSize;
      const centerX = Math.floor(indicatorX + size / 2);
      const centerY = Math.floor(indicatorY);

      // Horizontal line
      ctx.moveTo(Math.floor(indicatorX), centerY);
      ctx.lineTo(Math.floor(indicatorX + size), centerY);
      // Vertical line
      ctx.moveTo(centerX, centerY - size / 2);
      ctx.lineTo(centerX, centerY + size / 2);
    }

    ctx.stroke();
  }
}

// ============================================================================
// TEXT UTILITIES
// ============================================================================

/**
 * Truncate text to fit within max width
 */
export function truncateText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string {
  if (maxWidth <= 0) return '';

  const metrics = ctx.measureText(text);
  if (metrics.width <= maxWidth) {
    return text;
  }

  // Binary search for optimal truncation point
  let start = 0;
  let end = text.length;

  while (start < end) {
    const mid = Math.floor((start + end) / 2);
    const truncated = `${text.slice(0, mid)}...`;

    if (ctx.measureText(truncated).width <= maxWidth) {
      start = mid + 1;
    } else {
      end = mid;
    }
  }

  return `${text.slice(0, Math.max(0, start - 1))}...`;
}

/**
 * Measure text width
 */
export function measureText(ctx: CanvasRenderingContext2D, text: string): number {
  return ctx.measureText(text).width;
}

/**
 * Calculate optimal column width based on content
 */
export function calculateColumnWidth<TData = any>(
  ctx: CanvasRenderingContext2D,
  column: Column,
  _colDef: ColDef<TData> | null,
  theme: GridTheme,
  sampleData: any[],
  maxRows: number = 100
): number {
  const font = getFontFromTheme(theme);
  ctx.font = font;

  let maxWidth = 0;

  // Check header width
  const headerText = column.headerName || column.field || '';
  maxWidth = Math.max(maxWidth, ctx.measureText(headerText).width);

  // Check sample data widths
  const field = column.field;
  if (field) {
    const rowsToCheck = Math.min(sampleData.length, maxRows);
    for (let i = 0; i < rowsToCheck; i++) {
      const value = sampleData[i]?.[field];
      if (value != null) {
        const text = String(value);
        maxWidth = Math.max(maxWidth, ctx.measureText(text).width);
      }
    }
  }

  // Add padding
  return Math.ceil(maxWidth + theme.cellPadding * 2);
}

// ============================================================================
// CELL VALUE FORMATTING
// ============================================================================

/**
 * Get formatted cell value
 */
/**
 * Strip HTML tags from string
 * Supports basic cellRenderer that returns HTML strings
 * Note: Only plain text is rendered - colors, backgrounds, etc. are NOT supported
 */
export function stripHtmlTags(html: string): string {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '');
}

export function getFormattedValue<TData = any>(
  value: any,
  colDef: ColDef<TData> | null,
  data: TData,
  rowNode: IRowNode<TData>,
  api: GridApi<TData>
): string {
  if (value === null || value === undefined) {
    return '';
  }

  // Use custom cellRenderer if provided
  if (colDef && typeof colDef.cellRenderer === 'function') {
    try {
      const result = colDef.cellRenderer({
        value,
        data,
        node: rowNode,
        colDef,
        api,
      });
      // Handle both string and Promise<string> returns
      if (typeof result === 'string') {
        return stripHtmlTags(result);
      }
      // For async renderers, return value as string (will be updated on next render)
      return String(value);
    } catch (e) {
      console.warn('Cell renderer error:', e);
    }
  }

  // Use custom formatter if provided
  if (colDef && typeof colDef.valueFormatter === 'function') {
    try {
      return colDef.valueFormatter({
        value,
        data,
        node: rowNode,
        colDef,
        api,
      });
    } catch (e) {
      console.warn('Value formatter error:', e);
    }
  }

  return String(value);
}

// ============================================================================
// BATCH CELL RENDERING
// ============================================================================

/**
 * Render all cells in a row
 */
export function renderRow<TData = any>(
  ctx: CanvasRenderingContext2D,
  columns: Column[],
  colPreps: Map<string, ColumnPrepResult<TData>>,
  rowNode: IRowNode<TData>,
  rowIndex: number,
  y: number,
  height: number,
  getCellX: (column: Column) => number,
  api: GridApi<TData>,
  theme: GridTheme,
  options: {
    isSelected?: boolean;
    isHovered?: boolean;
  } = {}
): void {
  const isEvenRow = rowIndex % 2 === 0;

  for (const column of columns) {
    const prep = colPreps.get(column.colId);
    if (!prep) continue;

    const x = getCellX(column);
    const value = column.field ? getValueByPath(rowNode.data, column.field) : undefined;
    const formattedValue = getFormattedValue(value, prep.colDef, rowNode.data, rowNode, api);

    const context: CellDrawContext<TData> = {
      ctx,
      theme,
      column,
      colDef: prep.colDef,
      rowNode,
      rowIndex,
      x,
      y,
      width: column.width,
      height,
      value,
      formattedValue,
      isSelected: options.isSelected || rowNode.selected,
      isHovered: options.isHovered || false,
      isEvenRow,
    };

    drawCell(ctx, prep, context);
  }
}
