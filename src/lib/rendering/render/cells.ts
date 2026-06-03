/**
 * Cell Rendering for Canvas Renderer
 *
 * Handles drawing of individual cells with prep/draw cycle optimization.
 */

import type { Type } from '@angular/core';
import {
  type CanvasCellStyle,
  type CellClassParams,
  ColDef,
  type ColGroupDef,
  Column,
  GridApi,
  type ICellRendererParams,
  IRowNode,
} from '../../types/ag-grid-types';
import { type CellRendererComponents, resolveNamedRenderer } from './cell-renderer-registry';
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

/** The per-grid `gridOptions.components` map, if any, from a grid API. */
function getComponents<TData = any>(
  api: GridApi<TData> | null | undefined
): CellRendererComponents | undefined {
  return api?.getGridOption?.('components') as CellRendererComponents | undefined;
}

/**
 * Resolve a `cellRenderer` value (component class, or a registered name) to the
 * Angular component it routes to, or null when it isn't a component renderer
 * (a plain string-returning function, a built-in canvas string, or undefined).
 * Shared by the canvas and the DOM overlay (cells *and* master/detail) so their
 * "draw on canvas vs. mount a component" decisions can never disagree.
 */
export function toAngularComponent(
  renderer: any,
  components: CellRendererComponents | undefined
): Type<any> | null {
  if (isAngularComponent(renderer)) return renderer as Type<any>;
  if (typeof renderer === 'string') {
    const resolved = resolveNamedRenderer(renderer, components);
    return isAngularComponent(resolved) ? (resolved as Type<any>) : null;
  }
  return null;
}

/**
 * True when a column *may* route any of its cells through the DOM/Angular
 * overlay layer (a component `cellRenderer`, or a `cellRendererSelector` that
 * could pick one). Column-level test used by the overlay to decide which
 * columns to consider; the actual per-cell decision is {@link resolveCellComponent}.
 */
export function usesComponentRenderer<TData = any>(
  colDef: ColDef<TData> | null,
  components?: CellRendererComponents | null
): boolean {
  if (!colDef) return false;
  // A selector is opaque at column level (no per-cell params) — it *may* pick a
  // component, so the column is a candidate; the per-cell check decides for real.
  if (typeof colDef.cellRendererSelector === 'function') return true;
  if (isAngularComponent(colDef.cellRenderer)) return true;
  // A named renderer counts only when it resolves to an Angular component; a name
  // that maps to a function, or an unknown/built-in string, stays canvas-drawn.
  if (typeof colDef.cellRenderer === 'string') {
    return isAngularComponent(resolveNamedRenderer(colDef.cellRenderer, components ?? undefined));
  }
  return false;
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
  const components = getComponents(params.api);
  if (typeof colDef.cellRendererSelector === 'function') {
    try {
      const selected = colDef.cellRendererSelector(params);
      // A selector may return a component class or a registered name.
      return toAngularComponent(selected?.component, components);
    } catch {
      return null;
    }
  }
  return toAngularComponent(colDef.cellRenderer, components);
}

/**
 * Resolve the custom editor for a cell: a `cellEditor` component class / a
 * registered name, or a `cellEditorSelector` that returns `{ component, params }`.
 * Returns the Angular component to host plus any selector-provided params (merged
 * over `cellEditorParams` by the caller), or `null` component to fall back to the
 * built-in text editor. Shares {@link toAngularComponent} with the renderer path.
 */
export function resolveCellEditor<TData = any>(
  colDef: ColDef<TData> | null,
  params: ICellRendererParams<TData>
): { component: Type<any> | null; params?: Record<string, any> } {
  if (!colDef) return { component: null };
  const components = getComponents(params.api);
  if (typeof colDef.cellEditorSelector === 'function') {
    try {
      const selected = colDef.cellEditorSelector(params);
      return {
        component: toAngularComponent(selected?.component, components),
        params: selected?.params,
      };
    } catch {
      return { component: null };
    }
  }
  return { component: toAngularComponent(colDef.cellEditor, components) };
}

/**
 * Resolve a column's custom header component (`colDef.headerComponent`) to the
 * Angular component class to mount in the DOM header, or null to keep the
 * built-in header (label + sort/filter/menu chrome). Accepts a component class
 * or a registered name (resolved through the per-grid `components` map / global
 * registry), sharing {@link toAngularComponent} with the cell paths. Column
 * groups have no header component in v1.
 */
export function resolveHeaderComponent<TData = any>(
  colDef: ColDef<TData> | ColGroupDef<TData> | null,
  api: GridApi<TData> | null | undefined
): Type<any> | null {
  if (!colDef || 'children' in colDef || !colDef.headerComponent) return null;
  return toAngularComponent(colDef.headerComponent, getComponents(api));
}

/**
 * Resolve a column's custom filter component (`colDef.filter` set to a component
 * class or a registered name), or null for the built-in filters. The built-in
 * filter identifiers (`'text'`, `'number'`, `'date'`, `'boolean'`, `'set'`,
 * `'agTextColumnFilter'`, …) and booleans resolve to null, so the canvas keeps
 * its built-in popup. Shares {@link toAngularComponent} with the other paths.
 */
export function resolveFilterComponent<TData = any>(
  colDef: ColDef<TData> | ColGroupDef<TData> | null,
  api: GridApi<TData> | null | undefined
): Type<any> | null {
  if (!colDef || 'children' in colDef || !colDef.filter) return null;
  return toAngularComponent(colDef.filter, getComponents(api));
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
// CONDITIONAL CELL STYLING
// ============================================================================

/**
 * The empty computed style, shared by reference and returned for the common
 * case of a column with no conditional styling — so plain columns allocate
 * nothing on the per-frame hot path. Never mutate it.
 */
export const NO_CELL_STYLE: CanvasCellStyle = {};

/** Cheap guard: does this column declare any conditional styling at all? */
export function hasConditionalStyle<TData = any>(colDef: ColDef<TData> | null): boolean {
  return !!colDef && !!(colDef.cellStyle || colDef.cellClass || colDef.cellClassRules);
}

/** Build a canvas font string honouring an optional weight/style override. */
function buildFont(theme: GridTheme, weight?: string, style?: string): string {
  const w = weight || theme.fontWeight || 'normal';
  const s = style && style !== 'normal' ? `${style} ` : '';
  return `${s}${w} ${theme.fontSize}px ${theme.fontFamily}`;
}

/** Append the active class names from a `cellClass` value to `out`. */
function collectCellClass<TData>(
  cellClass: ColDef<TData>['cellClass'],
  params: CellClassParams<TData>,
  out: string[]
): void {
  const resolved = typeof cellClass === 'function' ? cellClass(params) : cellClass;
  if (!resolved) return;
  if (Array.isArray(resolved)) {
    for (const c of resolved) if (c) out.push(...c.split(/\s+/).filter(Boolean));
  } else {
    out.push(...resolved.split(/\s+/).filter(Boolean));
  }
}

/**
 * Resolve the canvas-paintable style for one cell from `cellClass`,
 * `cellClassRules` (mapped through the `cellClassStyles` class→style map) and
 * `cellStyle`. This is the canvas bridge for AG-Grid's CSS-class conditional
 * styling: a class name can't apply on a canvas, so an *active* class is looked
 * up in the merged `cellClassStyles` map and its `CanvasCellStyle` painted.
 *
 * Precedence (low → high), mirroring CSS where inline style beats a class:
 * grid-level `cellClassStyles` < `colDef.cellClassStyles` < `cellStyle`.
 *
 * Returns the shared `NO_CELL_STYLE` (no allocation) when nothing applies.
 * Callers should gate the param build with {@link hasConditionalStyle} so plain
 * columns never reach here.
 */
export function resolveCellPaintStyle<TData = any>(
  colDef: ColDef<TData> | null,
  params: CellClassParams<TData>,
  gridClassStyles: { [className: string]: CanvasCellStyle } | undefined
): CanvasCellStyle {
  if (!hasConditionalStyle(colDef)) return NO_CELL_STYLE;

  // 1. Gather active class names: static cellClass + passing cellClassRules.
  const classes: string[] = [];
  if (colDef!.cellClass) collectCellClass(colDef!.cellClass, params, classes);
  if (colDef!.cellClassRules) {
    for (const className in colDef!.cellClassRules) {
      const rule = colDef!.cellClassRules[className];
      if (rule && rule(params)) classes.push(...className.split(/\s+/).filter(Boolean));
    }
  }

  // 2. Map each active class to a style and merge (colDef map over grid map).
  let style: CanvasCellStyle = NO_CELL_STYLE;
  const colStyles = colDef!.cellClassStyles;
  if (classes.length && (gridClassStyles || colStyles)) {
    for (const className of classes) {
      const mapped = colStyles?.[className] ?? gridClassStyles?.[className];
      if (mapped) style = style === NO_CELL_STYLE ? { ...mapped } : { ...style, ...mapped };
    }
  }

  // 3. `cellStyle` wins (inline-style semantics). Only the canvas-paintable
  //    subset is read; any other CSS props are ignored.
  if (colDef!.cellStyle) {
    const raw =
      typeof colDef!.cellStyle === 'function'
        ? colDef!.cellStyle({
            value: params.value,
            data: params.data,
            node: params.node,
            column: params.column,
            api: params.api,
          })
        : colDef!.cellStyle;
    if (raw) {
      const inline: CanvasCellStyle = {};
      if (raw.color != null) inline.color = raw.color;
      const bg = raw.backgroundColor ?? raw.background;
      if (bg != null) inline.backgroundColor = bg;
      if (raw.fontWeight != null) inline.fontWeight = String(raw.fontWeight);
      if (raw.fontStyle != null) inline.fontStyle = raw.fontStyle;
      if (
        inline.color != null ||
        inline.backgroundColor != null ||
        inline.fontWeight != null ||
        inline.fontStyle != null
      ) {
        style = style === NO_CELL_STYLE ? inline : { ...style, ...inline };
      }
    }
  }

  return style;
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

  // Conditional styling (cellStyle / cellClass / cellClassRules → CanvasCellStyle).
  // Computed once and shared by the background + content passes. Gated so plain
  // columns skip the params build and the grid-option lookup entirely.
  const computedStyle = hasConditionalStyle(context.colDef)
    ? resolveCellPaintStyle(
        context.colDef,
        {
          value: context.value,
          data: rowNode.data,
          node: rowNode,
          column: context.column,
          api: context.api,
        },
        context.api?.getGridOption?.('cellClassStyles')
      )
    : NO_CELL_STYLE;

  // Draw cell background
  drawCellBackground(ctx, context, computedStyle);

  // Draw cell content based on column type
  drawCellContent(ctx, prep, context, computedStyle);

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
  context: CellDrawContext<TData>,
  computedStyle: CanvasCellStyle = NO_CELL_STYLE
): void {
  const { x, y, width, height, isSelected, isHovered, isEvenRow } = context;
  const { theme } = context;

  // Determine background color. A conditional backgroundColor replaces the zebra
  // base, but selection/hover still win so that feedback is never lost.
  let bgColor = isEvenRow ? theme.bgCellEven : theme.bgCell;
  if (computedStyle.backgroundColor) bgColor = computedStyle.backgroundColor;
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
  prep: ColumnPrepResult<TData>,
  context: CellDrawContext<TData>,
  computedStyle: CanvasCellStyle = NO_CELL_STYLE
): void {
  const { x, y, width, height, value, formattedValue, theme, colDef, rowNode, api } = context;

  // 0. Cells that route to an Angular component are painted by the DOM overlay
  // layer — the canvas only provides the (already-drawn) background, so skip
  // all content. Resolved per-cell (not per-column) so a cellRendererSelector
  // that falls back to a non-component branch is still drawn here, not left
  // blank. Only pay the param build when the column could route to a component.
  if (colDef && usesComponentRenderer(colDef, getComponents(api))) {
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

  // Conditional text color / font (cellStyle + cellClassRules → computedStyle).
  ctx.fillStyle = computedStyle.color || theme.textCell;
  ctx.textBaseline = 'middle';
  // A weight/style override needs a different canvas font; restore the column's
  // font afterwards so the next cell in the row isn't affected.
  const customFont =
    computedStyle.fontWeight || computedStyle.fontStyle
      ? buildFont(theme, computedStyle.fontWeight, computedStyle.fontStyle)
      : null;
  if (customFont) ctx.font = customFont;

  const maxWidth = width - theme.cellPadding * 2 - groupOffset;

  // Wrapped / auto-height text: lay out multiple lines, vertically centered in
  // the cell (top-aligned when the block is taller than the row), clipping any
  // lines that fall past the bottom edge.
  if (colDef?.wrapText || colDef?.autoHeight) {
    const lines = wrapLines(ctx, formattedValue, maxWidth);
    const lineH = getTextLineHeight(theme);
    const blockH = lines.length * lineH;
    const top = y + Math.max(theme.cellPadding, (height - blockH) / 2);
    for (let i = 0; i < lines.length; i++) {
      const lineMidY = top + i * lineH + lineH / 2;
      if (lineMidY + lineH / 2 > y + height + 1) break; // would overflow the row
      ctx.fillText(lines[i], Math.floor(textX), Math.floor(lineMidY));
    }
    if (customFont) ctx.font = prep.font;
    return;
  }

  // Truncate text if needed (the group indent/indicator eats into the width).
  const truncatedText = colDef?.suppressEllipsis
    ? formattedValue
    : truncateText(ctx, formattedValue, maxWidth);

  if (truncatedText) {
    ctx.fillText(truncatedText, Math.floor(textX), Math.floor(textY));
  }
  if (customFont) ctx.font = prep.font;
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
 * Line height (px) used for wrapped/auto-height text. Shared by the canvas
 * renderer (drawing) and the auto-height measurement pass so a measured row is
 * tall enough for exactly the lines that get drawn.
 */
export function getTextLineHeight(theme: GridTheme): number {
  return Math.ceil(theme.fontSize * 1.4);
}

/**
 * Greedy word-wrap `text` into lines that each fit within `maxWidth` for the
 * current `ctx` font. Honors explicit newlines; a single word wider than
 * `maxWidth` is character-broken so it can never overflow horizontally.
 */
export function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const result: string[] = [];
  if (text == null || text === '') return result;
  const str = String(text);
  if (maxWidth <= 0) return [str];

  for (const paragraph of str.split('\n')) {
    const words = paragraph.split(/\s+/).filter((w) => w.length > 0);
    if (words.length === 0) {
      result.push('');
      continue;
    }
    let line = '';
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (ctx.measureText(candidate).width <= maxWidth) {
        line = candidate;
        continue;
      }
      if (line) {
        result.push(line);
        line = '';
      }
      if (ctx.measureText(word).width <= maxWidth) {
        line = word;
      } else {
        // A single word too wide for the cell — break it across lines.
        const pieces = breakWord(ctx, word, maxWidth);
        for (let i = 0; i < pieces.length - 1; i++) result.push(pieces[i]);
        line = pieces[pieces.length - 1];
      }
    }
    result.push(line);
  }
  return result;
}

/** Character-break a single over-long word into chunks that fit `maxWidth`. */
function breakWord(ctx: CanvasRenderingContext2D, word: string, maxWidth: number): string[] {
  const pieces: string[] = [];
  let cur = '';
  for (const ch of word) {
    if (cur && ctx.measureText(cur + ch).width > maxWidth) {
      pieces.push(cur);
      cur = ch;
    } else {
      cur += ch;
    }
  }
  if (cur) pieces.push(cur);
  return pieces.length ? pieces : [word];
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
  // A string `cellRenderer` is first resolved against the named registry; only a
  // resolved *function* renderer draws here. Angular components route to the
  // overlay, and unknown/built-in names ('checkbox', …) fall through to canvas.
  if (colDef) {
    let renderer: any = colDef.cellRenderer;
    if (typeof renderer === 'string') {
      const resolved = resolveNamedRenderer(renderer, getComponents(api));
      renderer = typeof resolved === 'function' && !isAngularComponent(resolved) ? resolved : null;
    }
    if (typeof renderer === 'function' && !isAngularComponent(renderer)) {
      try {
        const result = renderer({
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
        // For async renderers, return value as string (updated on next render)
        return String(value);
      } catch (e) {
        console.warn('Cell renderer error:', e);
      }
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
