/**
 * Column Utilities for Canvas Renderer
 *
 * Helper functions for column management and definition lookup.
 */

import { ColDef, Column, ColumnGroup, GridApi } from '../../types/ag-grid-types';

/**
 * Check if a column or column group is visible, respecting columnGroupShow
 */
export function isColumnVisible(item: Column | ColumnGroup): boolean {
  if (item.columnGroupShow) {
    const parent = item.parent;
    if (parent) {
      if (item.columnGroupShow === 'open') {
        return parent.expanded;
      }
      if (item.columnGroupShow === 'closed') {
        return !parent.expanded;
      }
    }
  }

  if ('children' in item) {
    return item.children.some((child) => isColumnVisible(child));
  }
  return item.visible;
}

/**
 * Find the Column Definition for a given Column
 */
export function getColumnDef<TData = any>(
  column: Column,
  gridApi: GridApi<TData>
): ColDef<TData> | null {
  const allDefs = gridApi.getColumnDefs();
  if (!allDefs) return null;

  const targetId = column.colId;
  const targetField = column.field?.toString();

  for (const def of allDefs) {
    if ('children' in def) {
      const found = def.children.find((c) => {
        const cDef = c as ColDef;
        return (
          cDef.colId === targetId ||
          cDef.field?.toString() === targetId ||
          (targetField && cDef.field?.toString() === targetField)
        );
      });
      if (found) return found as ColDef<TData>;
    } else {
      const cDef = def as ColDef;
      if (
        cDef.colId === targetId ||
        cDef.field?.toString() === targetId ||
        (targetField && cDef.field?.toString() === targetField)
      ) {
        return def as ColDef<TData>;
      }
    }
  }
  return null;
}

/**
 * Get X position for a column
 */
export function getColumnX(
  targetCol: Column,
  columnPositions: Map<string, number>,
  scrollLeft: number,
  leftPinnedWidth: number,
  rightPinnedWidth: number,
  viewportWidth: number
): number {
  // Use cached column position (O(1) lookup)
  const baseX = columnPositions.get(targetCol.colId) || 0;

  // Adjust for pinned columns and scroll position
  if (targetCol.pinned === 'left') {
    return Math.floor(baseX);
  } else if (targetCol.pinned === 'right') {
    // When right-pinned, we need to know the offset from the right edge
    // Our positions are accumulated from left to right.
    // We need to find where the right-pinned section starts.
    const rightPinnedStartX = Math.floor(viewportWidth - rightPinnedWidth);
    return rightPinnedStartX + Math.floor(baseX - (viewportWidth - rightPinnedWidth));
  } else {
    return Math.floor(leftPinnedWidth - scrollLeft + (baseX - leftPinnedWidth));
  }
}
