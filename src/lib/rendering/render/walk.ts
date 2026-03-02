/**
 * Walker Functions for Canvas Renderer
 *
 * Composable iteration patterns for columns and rows.
 * Based on Glide Data Grid's walker architecture.
 */

import { Column, GridApi, IRowNode } from '../../types/ag-grid-types';
import {
  CellWalkCallback,
  ColumnWalkCallback,
  PositionedColumn,
  RowWalkCallback,
  VisibleRange,
} from './types';

// ============================================================================
// COLUMN WALKERS
// ============================================================================

/**
 * Walk through visible columns in render order
 * Handles pinned columns (left, center, right) correctly
 */
export function walkColumns(
  columns: Column[],
  scrollX: number,
  viewportWidth: number, // Total width of the container
  leftPinnedWidth: number,
  rightPinnedWidth: number,
  callback: ColumnWalkCallback,
  availableWidth?: number // Width excluding vertical scrollbar
): void {
  const leftPinned = columns.filter((c) => c.pinned === 'left');
  const rightPinned = columns.filter((c) => c.pinned === 'right');
  const centerColumns = columns.filter((c) => !c.pinned);

  const effectiveWidth = availableWidth ?? viewportWidth;

  // 1. Left pinned columns (no scroll offset)
  let x = 0;
  for (const col of leftPinned) {
    const width = Math.floor(col.width);
    callback(col, x, width, true, 'left');
    x += width;
  }

  // 2. Center columns (with scroll offset and clipping)
  const centerStartX = Math.floor(leftPinnedWidth);
  const centerEndX = Math.floor(effectiveWidth - rightPinnedWidth);

  x = centerStartX - scrollX;
  for (const col of centerColumns) {
    const width = Math.floor(col.width);
    // Skip columns completely outside viewport
    if (x + width < centerStartX) {
      x += width;
      continue;
    }
    if (x > centerEndX) {
      break; // Rest of columns are off-screen
    }

    callback(col, x, width, false);
    x += width;
  }

  // 3. Right pinned columns (no scroll offset)
  x = centerEndX;
  for (const col of rightPinned) {
    const width = Math.floor(col.width);
    callback(col, x, width, true, 'right');
    x += width;
  }
}

/**
 * Get positioned columns for rendering
 */
export function getPositionedColumns(
  columns: Column[],
  scrollX: number,
  viewportWidth: number,
  leftPinnedWidth: number,
  rightPinnedWidth: number,
  availableWidth?: number
): PositionedColumn[] {
  const result: PositionedColumn[] = [];

  walkColumns(
    columns,
    scrollX,
    viewportWidth,
    leftPinnedWidth,
    rightPinnedWidth,
    (column, x, width, isPinned, pinSide) => {
      result.push({ column, x, width, isPinned, pinSide });
    },
    availableWidth
  );

  return result;
}

/**
 * Get pinned column widths
 */
export function getPinnedWidths(columns: Column[]): { left: number; right: number } {
  const left = columns
    .filter((c) => c.pinned === 'left')
    .reduce((sum, c) => sum + Math.floor(c.width), 0);

  const right = columns
    .filter((c) => c.pinned === 'right')
    .reduce((sum, c) => sum + Math.floor(c.width), 0);

  return { left, right };
}

// ============================================================================
// ROW WALKERS
// ============================================================================

/**
 * Walk through visible rows
 */
export function walkRows(
  startRow: number,
  endRow: number,
  scrollTop: number,
  rowHeight: number,
  getRowNode: (index: number) => IRowNode | null,
  callback: RowWalkCallback,
  api?: GridApi
): void {
  for (let rowIndex = startRow; rowIndex < endRow; rowIndex++) {
    const y = api ? api.getRowY(rowIndex) - scrollTop : rowIndex * rowHeight - scrollTop;
    const rowNode = getRowNode(rowIndex);
    const height = api && rowNode ? rowNode.rowHeight || rowHeight : rowHeight;
    callback(rowIndex, y, height, rowNode);
  }
}

/**
 * Calculate visible row range with buffer
 */
export function getVisibleRowRange(
  scrollTop: number,
  viewportHeight: number,
  rowHeight: number,
  totalRowCount: number,
  buffer: number = 5,
  api?: GridApi
): { startRow: number; endRow: number } {
  if (api) {
    const startRow = Math.max(0, Math.min(totalRowCount - 1, api.getRowAtY(scrollTop)) - buffer);
    const endRow = Math.min(totalRowCount, api.getRowAtY(Math.max(0, scrollTop + viewportHeight)) + buffer + 1);
    return { 
      startRow: Math.max(0, startRow), 
      endRow: Math.max(0, Math.min(totalRowCount, endRow)) 
    };
  }

  const startRow = Math.max(0, Math.floor(scrollTop / rowHeight) - buffer);
  const visibleRowCount = Math.ceil(viewportHeight / rowHeight);
  const endRow = Math.min(totalRowCount, startRow + visibleRowCount + buffer * 2);

  return { startRow, endRow };
}

/**
 * Get row Y position
 */
export function getRowY(rowIndex: number, rowHeight: number, scrollTop: number): number {
  return rowIndex * rowHeight - scrollTop;
}

// ============================================================================
// CELL WALKERS
// ============================================================================

/**
 * Walk through all visible cells
 */
export function walkCells(
  columns: Column[],
  startRow: number,
  endRow: number,
  scrollX: number,
  scrollTop: number,
  viewportWidth: number,
  _viewportHeight: number,
  rowHeight: number,
  getRowNode: (index: number) => IRowNode | null,
  callback: CellWalkCallback
): void {
  const { left: leftPinnedWidth, right: rightPinnedWidth } = getPinnedWidths(columns);

  // Walk columns for each row
  walkRows(startRow, endRow, scrollTop, rowHeight, getRowNode, (rowIndex, y, height, rowNode) => {
    walkColumns(
      columns,
      scrollX,
      viewportWidth,
      leftPinnedWidth,
      rightPinnedWidth,
      (column, x, width, _isPinned) => {
        callback(column, rowIndex, x, y, width, height, rowNode);
      }
    );
  });
}

// ============================================================================
// COLUMN UTILITIES
// ============================================================================

/**
 * Find column at X position
 */
export function getColumnAtX(
  columns: Column[],
  x: number,
  scrollX: number,
  viewportWidth: number,
  availableWidth?: number
): { column: Column | null; index: number; localX: number } {
  const { left: leftPinnedWidth, right: rightPinnedWidth } = getPinnedWidths(columns);
  const effectiveWidth = availableWidth ?? viewportWidth;

  const leftPinned = columns.filter((c) => c.pinned === 'left');
  const rightPinned = columns.filter((c) => c.pinned === 'right');
  const centerColumns = columns.filter((c) => !c.pinned);

  // Check left pinned
  if (x < leftPinnedWidth) {
    let colX = 0;
    for (let i = 0; i < leftPinned.length; i++) {
      const col = leftPinned[i];
      if (x < colX + col.width) {
        return { column: col, index: columns.indexOf(col), localX: x - colX };
      }
      colX += col.width;
    }
  }

  // Check right pinned
  const centerEndX = Math.floor(effectiveWidth - rightPinnedWidth);
  if (x > centerEndX) {
    let colX = centerEndX;
    for (let i = 0; i < rightPinned.length; i++) {
      const col = rightPinned[i];
      if (x < colX + col.width) {
        return { column: col, index: columns.indexOf(col), localX: x - colX };
      }
      colX += col.width;
    }
  }

  // Check center columns
  const scrolledX = x - leftPinnedWidth + scrollX;
  let colX = 0;
  for (let i = 0; i < centerColumns.length; i++) {
    const col = centerColumns[i];
    if (scrolledX < colX + col.width) {
      return { column: col, index: columns.indexOf(col), localX: scrolledX - colX };
    }
    colX += col.width;
  }

  return { column: null, index: -1, localX: 0 };
}

/**
 * Get column index in visible columns array
 */
export function getColumnIndex(columns: Column[], colId: string): number {
  return columns.findIndex((c) => c.colId === colId);
}

/**
 * Calculate total width of columns
 */
export function getTotalColumnWidth(columns: Column[]): number {
  return columns.reduce((sum, col) => sum + Math.floor(col.width), 0);
}

// ============================================================================
// ROW UTILITIES
// ============================================================================

/**
 * Find row at Y position
 */
export function getRowAtY(y: number, rowHeight: number, scrollTop: number): number {
  return Math.floor((y + scrollTop) / rowHeight);
}

/**
 * Check if row is visible in viewport
 */
export function isRowVisible(
  rowIndex: number,
  scrollTop: number,
  viewportHeight: number,
  rowHeight: number
): boolean {
  const y = rowIndex * rowHeight;
  const rowBottom = y + rowHeight;
  const viewportBottom = scrollTop + viewportHeight;

  return y < viewportBottom && rowBottom > scrollTop;
}

// ============================================================================
// VISIBLE RANGE CALCULATION
// ============================================================================

/**
 * Calculate complete visible range for rendering
 */
export function calculateVisibleRange(
  columns: Column[],
  scrollTop: number,
  scrollLeft: number,
  viewportWidth: number,
  viewportHeight: number,
  rowHeight: number,
  totalRowCount: number,
  rowBuffer: number = 5,
  availableWidth?: number
): VisibleRange {
  const { startRow, endRow } = getVisibleRowRange(
    scrollTop,
    viewportHeight,
    rowHeight,
    totalRowCount,
    rowBuffer
  );

  const effectiveWidth = availableWidth ?? viewportWidth;

  // For columns, we just track indices
  const centerColumns = columns.filter((c) => !c.pinned);
  const leftPinned = columns.filter((c) => c.pinned === 'left');
  const rightPinned = columns.filter((c) => c.pinned === 'right');

  const leftPinnedWidth = leftPinned.reduce((sum, c) => sum + Math.floor(c.width), 0);
  const rightPinnedWidth = rightPinned.reduce((sum, c) => sum + Math.floor(c.width), 0);

  // Find first and last visible center column
  let startColumnIndex = leftPinned.length;
  let endColumnIndex = startColumnIndex + centerColumns.length;

  let x = leftPinnedWidth - scrollLeft;
  for (let i = 0; i < centerColumns.length; i++) {
    const col = centerColumns[i];
    const width = Math.floor(col.width);
    if (x + width > leftPinnedWidth) {
      startColumnIndex = leftPinned.length + i;
      break;
    }
    x += width;
  }

  x = leftPinnedWidth - scrollLeft;
  const centerEndX = Math.floor(effectiveWidth - rightPinnedWidth);
  for (let i = 0; i < centerColumns.length; i++) {
    const col = centerColumns[i];
    const width = Math.floor(col.width);
    if (x > centerEndX) {
      endColumnIndex = leftPinned.length + i;
      break;
    }
    x += width;
  }

  // Add right pinned columns
  endColumnIndex += rightPinned.length;

  return {
    startRow,
    endRow,
    startColumnIndex,
    endColumnIndex,
  };
}
