/**
 * Rendering Primitives for Canvas Renderer
 *
 * Provides specialized drawing functions for grid UI elements:
 * - Checkboxes
 * - Group indicators (expand/collapse)
 * - Sparklines
 */

import { SparklineOptions } from '../../types/ag-grid-types';
import { GridTheme } from './types';

/**
 * Draw a grid checkbox
 */
export function drawCheckbox(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  checked: boolean,
  theme: GridTheme
): void {
  // Draw checkbox border
  ctx.strokeStyle = theme.borderColor;
  ctx.lineWidth = 1.2;
  ctx.strokeRect(Math.floor(x) + 0.5, Math.floor(y) + 0.5, size, size);

  // Draw checkmark if checked
  if (checked) {
    ctx.strokeStyle = theme.textCell;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    const padding = 3;
    const checkX = x + padding;
    const checkY = y + size / 2;
    const checkWidth = size - padding * 2;
    
    // Draw checkmark
    ctx.moveTo(checkX, checkY);
    ctx.lineTo(checkX + checkWidth / 3, checkY + checkWidth / 3);
    ctx.lineTo(checkX + checkWidth, checkY - checkWidth / 3);
    ctx.stroke();
  }
}

/**
 * Draw a group expand/collapse indicator
 */
export function drawGroupIndicator(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rowHeight: number,
  expanded: boolean,
  theme: GridTheme
): void {
  ctx.beginPath();
  ctx.strokeStyle = theme.textCell;
  ctx.lineWidth = 1;
  const centerY = Math.floor(y + rowHeight / 2);
  const size = theme.groupIndicatorSize;

  if (expanded) {
    // Expanded: horizontal line
    ctx.moveTo(Math.floor(x), centerY);
    ctx.lineTo(Math.floor(x + size), centerY);
  } else {
    // Collapsed: plus sign
    const halfSize = size / 2;
    ctx.moveTo(Math.floor(x), centerY);
    ctx.lineTo(Math.floor(x + size), centerY);
    ctx.moveTo(Math.floor(x + halfSize), centerY - halfSize);
    ctx.lineTo(Math.floor(x + halfSize), centerY + halfSize);
  }
  ctx.stroke();
}

/**
 * Draw a sparkline within a cell
 */
export function drawSparkline(
  ctx: CanvasRenderingContext2D,
  data: any[],
  x: number,
  y: number,
  width: number,
  height: number,
  options: SparklineOptions
): void {
  if (!Array.isArray(data) || data.length === 0) return;

  const padding = options.padding || { top: 4, bottom: 4, left: 4, right: 4 };
  const drawX = x + (padding.left || 0);
  const drawY = y + (padding.top || 0);
  const drawWidth = width - (padding.left || 0) - (padding.right || 0);
  const drawHeight = height - (padding.top || 0) - (padding.bottom || 0);

  if (drawWidth <= 0 || drawHeight <= 0) return;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const type = options.type || 'line';

  ctx.save();

  if (type === 'line' || type === 'area') {
    ctx.beginPath();
    for (let i = 0; i < data.length; i++) {
      const px = drawX + (i / (data.length - 1)) * drawWidth;
      const py = drawY + drawHeight - ((data[i] - min) / range) * drawHeight;

      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }

    if (type === 'area') {
      const areaOptions = options.area || {};
      ctx.lineTo(drawX + drawWidth, drawY + drawHeight);
      ctx.lineTo(drawX, drawY + drawHeight);
      ctx.closePath();
      ctx.fillStyle = areaOptions.fill || 'rgba(33, 150, 243, 0.3)';
      ctx.fill();

      // Stroke the top line
      ctx.beginPath();
      for (let i = 0; i < data.length; i++) {
        const px = drawX + (i / (data.length - 1)) * drawWidth;
        const py = drawY + drawHeight - ((data[i] - min) / range) * drawHeight;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
    }

    const lineOptions = (type === 'area' ? options.area : options.line) || {};
    ctx.strokeStyle = lineOptions.stroke || '#2196f3';
    ctx.lineWidth = lineOptions.strokeWidth || 1.5;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();
  } else if (type === 'column' || type === 'bar') {
    const colOptions = options.column || {};
    const colPadding = colOptions.padding || 0.1;
    const colWidth = drawWidth / data.length;
    const barWidth = colWidth * (1 - colPadding);

    ctx.fillStyle = colOptions.fill || '#2196f3';

    for (let i = 0; i < data.length; i++) {
      const px = drawX + i * colWidth + (colWidth * colPadding) / 2;
      const valHeight = ((data[i] - min) / range) * drawHeight;
      const py = drawY + drawHeight - valHeight;

      ctx.fillRect(
        Math.floor(px),
        Math.floor(py),
        Math.floor(barWidth),
        Math.ceil(valHeight)
      );
    }
  }

  ctx.restore();
}
