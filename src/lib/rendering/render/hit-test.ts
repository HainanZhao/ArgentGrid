/**
 * Hit Testing for Canvas Renderer
 *
 * Utilities for detecting which grid element is under a given coordinate.
 */

import { Column } from '../../types/ag-grid-types';
import { HitTestResult } from './types';
import { getColumnAtX, getRowAtY } from './walk';

/**
 * Perform a hit test on the grid
 */
export function performHitTest(
  canvasX: number,
  canvasY: number,
  rowHeight: number,
  scrollTop: number,
  scrollLeft: number,
  viewportWidth: number,
  columns: Column[],
  availableWidth?: number
): HitTestResult {
  // Use walker utility for row detection
  const rowIndex = getRowAtY(canvasY, rowHeight, scrollTop);

  // Use walker utility for column detection
  const result = getColumnAtX(columns, canvasX, scrollLeft, viewportWidth, availableWidth);

  return {
    rowIndex,
    columnIndex: result.index,
    column: result.column,
    rowNode: null, // Should be populated by caller if needed
    hitArea: result.column ? 'cell' : 'empty',
  };
}

/**
 * Get the horizontal offset of a center column
 */
export function getCenterColumnOffset(targetCol: Column, columns: Column[]): number {
  const centerColumns = columns.filter((c) => !c.pinned);
  let offset = 0;
  for (const col of centerColumns) {
    if (col === targetCol) return offset;
    offset += col.width;
  }
  return offset;
}
