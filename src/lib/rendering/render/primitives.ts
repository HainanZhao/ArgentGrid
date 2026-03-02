/**
 * Rendering Primitives for Canvas Renderer
 *
 * Provides specialized drawing functions for grid UI elements:
 * - Checkboxes
 * - Group indicators (expand/collapse)
 * - Sparklines
 */

import {
  BadgeOptions,
  ButtonOptions,
  ProgressOptions,
  RatingOptions,
  SparklineOptions,
} from '../../types/ag-grid-types';
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
  // Draw checkbox border - Use a more obvious color than the standard grid border
  ctx.strokeStyle = '#94a3b8'; // Slate-400 for better visibility
  ctx.lineWidth = 1.5;
  ctx.strokeRect(Math.floor(x) + 0.5, Math.floor(y) + 0.5, size, size);

  // Draw checkmark if checked
  if (checked) {
    // Fill background when checked for even better visibility
    ctx.fillStyle = '#3b82f6'; // Blue-500
    ctx.fillRect(Math.floor(x) + 0.5, Math.floor(y) + 0.5, size, size);

    ctx.strokeStyle = '#ffffff'; // White checkmark on blue background
    ctx.lineWidth = 2;
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
 * Draw a button within a cell.
 * Returns the bounding box so callers can perform hit-testing.
 */
export function drawButton<TData = any>(
  ctx: CanvasRenderingContext2D,
  label: string,
  x: number,
  y: number,
  width: number,
  height: number,
  options: ButtonOptions<TData> = { label }
): { bx: number; by: number; bw: number; bh: number } {
  const variant = options.variant ?? 'primary';
  const borderRadius = options.borderRadius ?? 4;
  const paddingX = options.paddingX ?? 12;
  const fontSize = options.fontSize ?? 12;

  // Variant colour defaults
  const VARIANTS: Record<string, { fill: string; text: string; border?: string }> = {
    primary: { fill: '#3b82f6', text: '#ffffff' },
    secondary: { fill: '#f3f4f6', text: '#374151', border: '#9ca3af' },
    danger: { fill: '#ef4444', text: '#ffffff' },
    ghost: { fill: '#f9fafb', text: '#6b7280', border: '#d1d5db' },
  };
  const defaults = VARIANTS[variant] ?? VARIANTS.primary;
  const fillColor = options.fill ?? defaults.fill;
  const textColor = options.textColor ?? defaults.text;
  const borderColor = options.borderColor ?? defaults.border;

  ctx.save();
  ctx.font = `500 ${fontSize}px sans-serif`;
  const textW = ctx.measureText(label).width;
  const bw = Math.min(textW + paddingX * 2, width - 8);
  const bh = fontSize + 10;
  const bx = Math.floor(x + (width - bw) / 2);
  const by = Math.floor(y + (height - bh) / 2);

  // Background
  if (fillColor && fillColor !== 'transparent') {
    ctx.fillStyle = fillColor;
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, bh, borderRadius);
    ctx.fill();
  }

  // Border (secondary / ghost)
  if (borderColor) {
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(bx + 0.5, by + 0.5, bw - 1, bh - 1, borderRadius);
    ctx.stroke();
  }

  // Label
  ctx.fillStyle = textColor;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  ctx.fillText(label, bx + bw / 2, by + bh / 2);

  ctx.restore();
  return { bx, by, bw, bh };
}

/**
 * Draw a badge/pill within a cell
 */
export function drawBadge(
  ctx: CanvasRenderingContext2D,
  value: string,
  x: number,
  y: number,
  width: number,
  height: number,
  options: BadgeOptions = {}
): void {
  const colorMap = options.colorMap ?? {};
  const defaultColors = options.defaultColors ?? { fill: '#f3f4f6', text: '#6b7280' };
  const { fill: bgColor, text: textColor } = colorMap[value] ?? defaultColors;
  const borderRadius = options.borderRadius ?? 9999;
  const paddingX = options.paddingX ?? 8;
  const fontSize = options.fontSize ?? 11;

  ctx.save();
  ctx.font = `500 ${fontSize}px sans-serif`;
  const textWidth = ctx.measureText(value).width;
  const badgeWidth = textWidth + paddingX * 2;
  const badgeHeight = fontSize + 8;
  const bx = Math.floor(x + (width - badgeWidth) / 2);
  const by = Math.floor(y + (height - badgeHeight) / 2);

  // Draw background pill
  ctx.fillStyle = bgColor;
  ctx.beginPath();
  ctx.roundRect(bx, by, badgeWidth, badgeHeight, Math.min(borderRadius, badgeHeight / 2));
  ctx.fill();

  // Draw text
  ctx.fillStyle = textColor;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  ctx.fillText(value, bx + badgeWidth / 2, by + badgeHeight / 2);

  ctx.restore();
}

/**
 * Draw a progress bar within a cell
 */
export function drawProgressBar(
  ctx: CanvasRenderingContext2D,
  value: number,
  x: number,
  y: number,
  width: number,
  height: number,
  options: ProgressOptions = {}
): void {
  const min = options.min ?? 0;
  const max = options.max ?? 100;
  const barHeight = options.barHeight ?? 8;
  const borderRadius = options.borderRadius ?? 4;
  const trackColor = options.trackColor ?? '#e5e7eb';
  const showLabel = options.showLabel !== false;

  const pct = Math.min(1, Math.max(0, (value - min) / (max - min)));

  // Layout: bar + optional label
  const labelWidth = showLabel ? 40 : 0;
  const labelGap = showLabel ? 8 : 0;
  const trackWidth = width - labelWidth - labelGap - 8; // 8px left padding
  const trackX = x + 4;
  const trackY = Math.floor(y + (height - barHeight) / 2);

  ctx.save();

  // Draw track
  ctx.fillStyle = trackColor;
  ctx.beginPath();
  ctx.roundRect(trackX, trackY, trackWidth, barHeight, borderRadius);
  ctx.fill();

  // Resolve fill color
  let fillColor: string;
  if (typeof options.fill === 'function') {
    fillColor = options.fill(value);
  } else if (options.fill) {
    fillColor = options.fill;
  } else {
    // Default traffic-light coloring
    fillColor = pct >= 0.8 ? '#22c55e' : pct >= 0.6 ? '#eab308' : '#ef4444';
  }

  // Draw filled portion
  if (pct > 0) {
    ctx.fillStyle = fillColor;
    ctx.beginPath();
    ctx.roundRect(
      trackX,
      trackY,
      Math.max(borderRadius * 2, trackWidth * pct),
      barHeight,
      borderRadius
    );
    ctx.fill();
  }

  // Draw label
  if (showLabel) {
    const label = options.labelFormatter ? options.labelFormatter(value) : `${value}%`;
    ctx.fillStyle = fillColor;
    ctx.font = 'bold 11px sans-serif';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.fillText(label, trackX + trackWidth + labelGap, y + height / 2);
  }

  ctx.restore();
}

/**
 * Draw a rating (stars) within a cell
 */
export function drawRating(
  ctx: CanvasRenderingContext2D,
  value: number,
  x: number,
  y: number,
  width: number,
  height: number,
  options: RatingOptions = {}
): void {
  const max = options.max ?? 5;
  const size = options.size ?? 14;
  const color = options.color ?? '#ffb400';
  const emptyColor = options.emptyColor ?? '#e5e7eb';
  const gap = 2;

  const totalWidth = max * size + (max - 1) * gap;
  const startX = x + (width - totalWidth) / 2;
  const centerY = y + height / 2;

  ctx.save();

  for (let i = 0; i < max; i++) {
    const starX = startX + i * (size + gap);
    const isFilled = i < Math.round(value);

    ctx.fillStyle = isFilled ? color : emptyColor;
    drawStar(ctx, starX + size / 2, centerY, 5, size / 2, size / 4);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * Helper to draw a star shape
 */
function drawStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  spikes: number,
  outerRadius: number,
  innerRadius: number
): void {
  let rot = (Math.PI / 2) * 3;
  let x = cx;
  let y = cy;
  const step = Math.PI / spikes;

  ctx.beginPath();
  ctx.moveTo(cx, cy - outerRadius);

  for (let i = 0; i < spikes; i++) {
    x = cx + Math.cos(rot) * outerRadius;
    y = cy + Math.sin(rot) * outerRadius;
    ctx.lineTo(x, y);
    rot += step;

    x = cx + Math.cos(rot) * innerRadius;
    y = cy + Math.sin(rot) * innerRadius;
    ctx.lineTo(x, y);
    rot += step;
  }

  ctx.lineTo(cx, cy - outerRadius);
  ctx.closePath();
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
    const colOptions = (type === 'bar' ? options.bar || options.column : options.column) || {};
    const colPadding = colOptions.padding || 0.1;
    const colWidth = drawWidth / data.length;
    const barWidth = colWidth * (1 - colPadding);

    ctx.fillStyle = colOptions.fill || '#2196f3';

    for (let i = 0; i < data.length; i++) {
      const px = drawX + i * colWidth + (colWidth * colPadding) / 2;
      const valHeight = ((data[i] - min) / range) * drawHeight;
      const py = drawY + drawHeight - valHeight;

      ctx.fillRect(Math.floor(px), Math.floor(py), Math.floor(barWidth), Math.ceil(valHeight));
    }
  }

  ctx.restore();
}
