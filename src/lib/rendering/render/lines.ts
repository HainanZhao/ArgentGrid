/**
 * Grid Lines Rendering for Canvas Renderer
 *
 * Draws grid lines (borders) efficiently.
 */

import { Column, IRowNode } from '../../types/ag-grid-types';
import { GridTheme, Rectangle } from './types';

// ============================================================================
// LINE DRAWING UTILITIES
// ============================================================================

/**
 * Draw a crisp 1px line (accounts for sub-pixel rendering)
 */
export function drawCrispLine(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): void {
  ctx.beginPath();
  // Add 0.5 to pixel coordinates for crisp 1px lines
  ctx.moveTo(Math.floor(x1) + 0.5, Math.floor(y1) + 0.5);
  ctx.lineTo(Math.floor(x2) + 0.5, Math.floor(y2) + 0.5);
  ctx.stroke();
}

/**
 * Draw a horizontal line
 */
export function drawHorizontalLine(
  ctx: CanvasRenderingContext2D,
  y: number,
  x1: number,
  x2: number
): void {
  drawCrispLine(ctx, x1, y, x2, y);
}

/**
 * Draw a vertical line
 */
export function drawVerticalLine(
  ctx: CanvasRenderingContext2D,
  x: number,
  y1: number,
  y2: number
): void {
  drawCrispLine(ctx, x, y1, x, y2);
}

// ============================================================================
// GRID LINE RENDERING
// ============================================================================

/**
 * Draw all horizontal row lines
 */
export function drawRowLines(
  ctx: CanvasRenderingContext2D,
  startRow: number,
  endRow: number,
  rowHeight: number,
  scrollTop: number,
  viewportWidth: number,
  theme: GridTheme
): void {
  ctx.strokeStyle = theme.borderColor || theme.gridLineColor;
  ctx.lineWidth = 1;

  ctx.beginPath();

  for (let row = startRow; row <= endRow; row++) {
    const y = Math.floor(row * rowHeight - scrollTop) + 0.5;
    ctx.moveTo(0, y);
    ctx.lineTo(viewportWidth, y);
  }

  ctx.stroke();
}

/**
 * Draw all vertical column lines
 */
export function drawColumnLines(
  ctx: CanvasRenderingContext2D,
  columns: Column[],
  scrollX: number,
  scrollTop: number,
  viewportWidth: number,
  viewportHeight: number,
  leftPinnedWidth: number,
  rightPinnedWidth: number,
  theme: GridTheme,
  startRow: number = 0,
  endRow: number = 0,
  rowHeight: number = 32
): void {
  ctx.strokeStyle = theme.borderColor || theme.gridLineColor;
  ctx.lineWidth = 1;

  const columnPositions = getColumnBorderPositions(
    columns,
    scrollX,
    viewportWidth,
    leftPinnedWidth,
    rightPinnedWidth
  );

  // Calculate Y range for drawing
  const drawY1 = Math.max(0, Math.floor(startRow * rowHeight - scrollTop));
  const drawY2 = Math.min(viewportHeight, Math.floor(endRow * rowHeight - scrollTop));

  ctx.beginPath();

  for (const x of columnPositions) {
    const borderX = Math.floor(x) + 0.5;
    ctx.moveTo(borderX, drawY1);
    ctx.lineTo(borderX, drawY2);
  }

  ctx.stroke();
}

/**
 * Get column border X positions
 */
export function getColumnBorderPositions(
  columns: Column[],
  scrollX: number,
  viewportWidth: number,
  leftPinnedWidth: number,
  rightPinnedWidth: number
): number[] {
  const positions: number[] = [];

  const leftPinned = columns.filter(c => c.pinned === 'left');
  const rightPinned = columns.filter(c => c.pinned === 'right');
  const centerColumns = columns.filter(c => !c.pinned);

  // Left pinned column borders
  let x = 0;
  for (const col of leftPinned) {
    x += col.width;
    positions.push(x);
  }

  // Center column borders
  x = leftPinnedWidth - scrollX;
  for (const col of centerColumns) {
    x += col.width;
    // Only include if visible
    if (x > leftPinnedWidth && x < viewportWidth - rightPinnedWidth) {
      positions.push(x);
    }
  }

  // Right pinned column borders
  x = viewportWidth - rightPinnedWidth;
  for (const col of rightPinned) {
    x += col.width;
    positions.push(x);
  }

  return positions;
}

/**
 * Draw grid lines for a region
 */
export function drawGridLines(
  ctx: CanvasRenderingContext2D,
  columns: Column[],
  startRow: number,
  endRow: number,
  rowHeight: number,
  scrollX: number,
  scrollTop: number,
  viewportWidth: number,
  viewportHeight: number,
  leftPinnedWidth: number,
  rightPinnedWidth: number,
  theme: GridTheme
): void {
  // Draw horizontal lines
  drawRowLines(ctx, startRow, endRow, rowHeight, scrollTop, viewportWidth, theme);

  // Draw vertical lines
  drawColumnLines(
    ctx,
    columns,
    scrollX,
    scrollTop,
    viewportWidth,
    viewportHeight,
    leftPinnedWidth,
    rightPinnedWidth,
    theme,
    startRow,
    endRow,
    rowHeight
  );
}

// ============================================================================
// BORDER RENDERING
// ============================================================================

/**
 * Draw border around a region
 */
export function drawBorder(
  ctx: CanvasRenderingContext2D,
  rect: Rectangle,
  color: string,
  lineWidth: number = 1
): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.strokeRect(
    Math.floor(rect.x) + 0.5,
    Math.floor(rect.y) + 0.5,
    Math.floor(rect.width),
    Math.floor(rect.height)
  );
}

/**
 * Draw selection border around a cell
 */
export function drawCellSelectionBorder(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  color: string = '#1976d2'
): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.strokeRect(
    Math.floor(x) + 1,
    Math.floor(y) + 1,
    Math.floor(width) - 2,
    Math.floor(height) - 2
  );
}

/**
 * Draw range selection border
 */
export function drawRangeSelectionBorder(
  ctx: CanvasRenderingContext2D,
  rect: Rectangle,
  options: {
    color?: string;
    fillColor?: string;
    lineWidth?: number;
  } = {}
): void {
  const {
    color = '#1976d2',
    fillColor = 'rgba(25, 118, 210, 0.1)',
    lineWidth = 1
  } = options;

  // Draw fill
  if (fillColor) {
    ctx.fillStyle = fillColor;
    ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
  }

  // Draw border
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.strokeRect(
    Math.floor(rect.x) + 0.5,
    Math.floor(rect.y) + 0.5,
    Math.floor(rect.width),
    Math.floor(rect.height)
  );
}

// ============================================================================
// PINNED REGION BORDERS
// ============================================================================

/**
 * Draw shadow/border for pinned regions
 */
export function drawPinnedRegionBorders(
  ctx: CanvasRenderingContext2D,
  viewportWidth: number,
  viewportHeight: number,
  leftPinnedWidth: number,
  rightPinnedWidth: number,
  theme: GridTheme
): void {
  ctx.strokeStyle = theme.headerBorderColor;

  // Left pinned border
  if (leftPinnedWidth > 0) {
    ctx.beginPath();
    const x = Math.floor(leftPinnedWidth) + 0.5;
    ctx.moveTo(x, 0);
    ctx.lineTo(x, viewportHeight);
    ctx.stroke();
  }

  // Right pinned border
  if (rightPinnedWidth > 0) {
    ctx.beginPath();
    const x = Math.floor(viewportWidth - rightPinnedWidth) + 0.5;
    ctx.moveTo(x, 0);
    ctx.lineTo(x, viewportHeight);
    ctx.stroke();
  }
}

/**
 * Draw pinned region shadows (subtle depth effect)
 */
export function drawPinnedRegionShadows(
  ctx: CanvasRenderingContext2D,
  viewportWidth: number,
  viewportHeight: number,
  leftPinnedWidth: number,
  rightPinnedWidth: number
): void {
  // Left shadow (on the right edge of left pinned)
  if (leftPinnedWidth > 0) {
    const gradient = ctx.createLinearGradient(
      leftPinnedWidth,
      0,
      leftPinnedWidth + 4,
      0
    );
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0.1)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(leftPinnedWidth, 0, 4, viewportHeight);
  }

  // Right shadow (on the left edge of right pinned)
  if (rightPinnedWidth > 0) {
    const shadowX = viewportWidth - rightPinnedWidth;
    const gradient = ctx.createLinearGradient(
      shadowX - 4,
      0,
      shadowX,
      0
    );
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.1)');

    ctx.fillStyle = gradient;
    ctx.fillRect(shadowX - 4, 0, 4, viewportHeight);
  }
}