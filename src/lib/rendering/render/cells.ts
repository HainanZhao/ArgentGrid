/**
 * Cell Rendering for Canvas Renderer
 *
 * Handles drawing of individual cells with prep/draw cycle optimization.
 */

import type { Type } from '@angular/core';
import {
  ColDef,
  Column,
  GridApi,
  type ICellRendererParams,
  IRowNode,
} from '../../types/ag-grid-types';
import {
  drawBadge,
  drawButton,
  drawCheckbox,
  drawProgressBar,
  drawRating,
  drawSparkline,
} from './primitives';
import { getFontFromTheme } from './theme';
import { CellDrawContext, ColumnPrepResult, GridTheme } from './types';

/** True when `x` is an Angular component class (has a compiled component def). */
export function isAngularComponent(x: any): boolean {
  return typeof x === 'function' && !!x?.ɵcmp;
}

/**
 * True when a column *may* route any of its cells through the DOM/Angular
 * overlay layer (a component `cellRenderer`, or a `cellRendererSelector` that
 * could pick one). Column-level test used by the overlay to decide which
 * columns to consider; the actual per-cell decision is {@link resolveCellComponent}.
 */
export function usesComponentRenderer<TData = any>(colDef: ColDef<TData> | null): boolean {
  if (!colDef) return false;
  return (
    isAngularComponent(colDef.cellRenderer) || typeof colDef.cellRendererSelector === 'function'
  );
}

/**
 * Resolve the Angular component a *specific* cell routes to, or null when the
 * cell is plain (canvas-drawn). This is the single source of truth shared by
 * the canvas (to decide what NOT to paint) and the overlay (to decide what to
 * mount), so the two never disagree and leave a cell blank or double-drawn.
 *
 * Honors `cellRendererSelector`: a selector that returns a non-Angular
 * component (a built-in string renderer) or `undefined` (use the default)
 * resolves to null, so the canvas keeps drawing that cell.
 */
export function resolveCellComponent<TData = any>(
  colDef: ColDef<TData> | null,
  params: ICellRendererParams<TData>
): Type<any> | null {
  if (!colDef) return null;
  if (typeof colDef.cellRendererSelector === 'function') {
    try {
      const selected = colDef.cellRendererSelector(params);
      return isAngularComponent(selected?.component) ? (selected?.component as Type<any>) : null;
    } catch {
      return null;
    }
  }
  return isAngularComponent(colDef.cellRenderer) ? (colDef.cellRenderer as Type<any>) : null;
}

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
 * Draw cell content (text or specialized renderer)
 */
export function drawCellContent<TData = any>(
  ctx: CanvasRenderingContext2D,
  _prep: ColumnPrepResult<TData>,
  context: CellDrawContext<TData>
): void {
  const { x, y, width, height, value, formattedValue, theme, colDef, rowNode, api } = context;

  // 0. Cells that route to an Angular component are painted by the DOM overlay
  // layer — the canvas only provides the (already-drawn) background, so skip
  // all content. Resolved per-cell (not per-column) so a cellRendererSelector
  // that falls back to a non-component branch is still drawn here, not left
  // blank. Only pay the param build when the column could route to a component.
  if (colDef && (colDef.cellRendererSelector || isAngularComponent(colDef.cellRenderer))) {
    const overlayParams: ICellRendererParams<TData> = {
      value,
      valueFormatted: formattedValue,
      data: rowNode?.data,
      node: rowNode,
      rowIndex: context.rowIndex,
      colDef,
      column: context.column,
      api,
    };
    if (resolveCellComponent(colDef, overlayParams)) {
      return;
    }
  }

  // 1. Check for dedicated checkbox renderer or internal selection column
  if (colDef?.cellRenderer === 'checkbox' || context.column.colId === 'ag-Grid-SelectionColumn') {
    const isChecked = colDef?.cellRenderer === 'checkbox' ? !!value : !!rowNode?.selected;
    const size = 14;
    const bx = Math.floor(x + (width - size) / 2);
    const by = Math.floor(y + (height - size) / 2);

    drawCheckbox(ctx, bx, by, size, isChecked, theme);
    return; // Dedicated checkbox column only shows checkbox
  }

  // 2. Check for sparkline
  if (colDef?.sparklineOptions) {
    drawSparkline(ctx, value, x, y, width, height, colDef.sparklineOptions);
    return;
  }

  // 3. Check for progress bar
  if (colDef?.progressOptions) {
    drawProgressBar(ctx, Number(value), x, y, width, height, colDef.progressOptions);
    return;
  }

  // 4. Check for badge
  if (colDef?.badgeOptions) {
    drawBadge(ctx, String(value ?? ''), x, y, width, height, colDef.badgeOptions);
    return;
  }

  // 5. Check for button
  if (colDef?.buttonOptions) {
    const opts = colDef.buttonOptions;
    const label =
      typeof opts.label === 'function'
        ? opts.label({
            value,
            data: rowNode?.data,
            node: rowNode!,
            colDef: colDef!,
            api: api!,
          })
        : opts.label;
    drawButton(ctx, label, x, y, width, height, opts);
    return;
  }

  // 6. Check for rating
  if (colDef?.cellRenderer === 'rating' || colDef?.ratingOptions) {
    drawRating(ctx, Number(value), x, y, width, height, colDef?.ratingOptions);
    return;
  }

  // 7. Default: Text rendering
  if (!formattedValue) return;

  // On the auto-group column, reserve room at the left for the tree indent +
  // expand/collapse indicator (drawn by drawGroupIndicators) so the group/leaf
  // label doesn't render on top of the toggle.
  const isAutoGroupCol = context.column.colId === 'ag-Grid-AutoColumn';
  const groupOffset =
    isAutoGroupCol && rowNode && (rowNode.group || rowNode.level > 0)
      ? groupIndicatorAreaWidth(rowNode.level, theme)
      : 0;

  // Calculate text position with padding
  const textX = x + theme.cellPadding + groupOffset;
  const textY = y + height / 2; // Centered vertically

  // Handle cellStyle color
  let textColor = theme.textCell;
  if (colDef?.cellStyle) {
    const style =
      typeof colDef.cellStyle === 'function'
        ? colDef.cellStyle({
            value,
            data: rowNode?.data,
            node: rowNode!,
            column: context.column,
            api: api!,
          })
        : colDef.cellStyle;
    if (style?.color) textColor = style.color;
  }

  // Set text properties
  ctx.fillStyle = textColor;
  ctx.textBaseline = 'middle';

  // Truncate text if needed (the group indent/indicator eats into the width).
  const maxWidth = width - theme.cellPadding * 2 - groupOffset;
  const truncatedText = colDef?.suppressEllipsis
    ? formattedValue
    : truncateText(ctx, formattedValue, maxWidth);

  if (truncatedText) {
    ctx.fillText(truncatedText, Math.floor(textX), Math.floor(textY));
  }
}

/**
 * Width (px) reserved at the left content edge of an auto-group cell for the
 * tree indent plus the expand/collapse indicator (and a small gap). Group
 * labels must start after this so they don't overlap the toggle, and it is the
 * single source of truth shared with the click hit-test in CanvasRenderer so
 * the drawn toggle, the label, and the clickable area all stay aligned.
 */
export function groupIndicatorAreaWidth(level: number, theme: GridTheme): number {
  return level * theme.groupIndentWidth + theme.groupIndicatorSize + 3;
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
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ');
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

  // Use custom cellRenderer if provided (string-returning function only — an
  // Angular component class is also a function but is handled by the overlay).
  if (
    colDef &&
    typeof colDef.cellRenderer === 'function' &&
    !isAngularComponent(colDef.cellRenderer)
  ) {
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
 * Get the value for a cell, respecting valueGetter if present
 */
export function getCellValue<TData = any>(
  column: Column,
  colDef: ColDef<TData> | null,
  rowNode: IRowNode<TData>,
  api: GridApi<TData>
): any {
  // 1. Prioritize valueGetter
  if (colDef?.valueGetter) {
    if (typeof colDef.valueGetter === 'function') {
      try {
        return colDef.valueGetter({
          data: rowNode.data,
          node: rowNode,
          colDef,
          api,
          column,
          context: api.getGridOption('context'),
        } as any);
      } catch (e) {
        console.warn('Value getter error:', e);
      }
    }
    // Note: String expressions for valueGetter are not supported in the canvas renderer yet
  }

  // 2. Fallback to field
  if (column.field) {
    return getValueByPath(rowNode.data, column.field);
  }

  return undefined;
}

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
    const value = getCellValue(column, prep.colDef, rowNode, api);
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
      api,
    };

    drawCell(ctx, prep, context);
  }
}
