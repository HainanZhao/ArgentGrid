/**
 * Damage Tracking for Canvas Renderer
 *
 * Tracks which regions of the grid need to be redrawn.
 * Enables efficient partial redraws for better performance.
 */

import { DirtyRegions, Rectangle } from '../render/types';

// ============================================================================
// DAMAGE TRACKER CLASS
// ============================================================================

/**
 * Tracks dirty regions for partial redraws
 */
export class DamageTracker {
  private damagedCells: Set<string> = new Set();
  private damagedRows: Set<number> = new Set();
  private damagedColumns: Set<number> = new Set();
  private fullRedrawNeeded: boolean = false;
  private lastRenderTime: number = 0;

  // ============================================================================
  // MARK DIRTY METHODS
  // ============================================================================

  /**
   * Mark a single cell as dirty
   */
  markCellDirty(col: number, row: number): void {
    this.damagedCells.add(`${col},${row}`);
  }

  /**
   * Mark multiple cells as dirty
   */
  markCellsDirty(cells: Array<[number, number]>): void {
    for (const [col, row] of cells) {
      this.damagedCells.add(`${col},${row}`);
    }
  }

  /**
   * Mark an entire row as dirty
   */
  markRowDirty(row: number): void {
    this.damagedRows.add(row);
  }

  /**
   * Mark multiple rows as dirty
   */
  markRowsDirty(rows: number[]): void {
    for (const row of rows) {
      this.damagedRows.add(row);
    }
  }

  /**
   * Mark an entire column as dirty
   */
  markColumnDirty(col: number): void {
    this.damagedColumns.add(col);
  }

  /**
   * Mark multiple columns as dirty
   */
  markColumnsDirty(cols: number[]): void {
    for (const col of cols) {
      this.damagedColumns.add(col);
    }
  }

  /**
   * Mark entire grid as dirty (requires full redraw)
   */
  markAllDirty(): void {
    this.fullRedrawNeeded = true;
    this.damagedCells.clear();
    this.damagedRows.clear();
    this.damagedColumns.clear();
  }

  /**
   * Mark dirty based on selection change
   */
  markSelectionChanged(oldSelection: Set<number>, newSelection: Set<number>): void {
    // Mark rows that changed selection state
    for (const row of oldSelection) {
      if (!newSelection.has(row)) {
        this.markRowDirty(row);
      }
    }
    for (const row of newSelection) {
      if (!oldSelection.has(row)) {
        this.markRowDirty(row);
      }
    }
  }

  // ============================================================================
  // QUERY METHODS
  // ============================================================================

  /**
   * Check if a full redraw is needed
   */
  needsFullRedraw(): boolean {
    return this.fullRedrawNeeded;
  }

  /**
   * Check if any damage exists
   */
  hasDamage(): boolean {
    return (
      this.fullRedrawNeeded ||
      this.damagedCells.size > 0 ||
      this.damagedRows.size > 0 ||
      this.damagedColumns.size > 0
    );
  }

  /**
   * Check if a specific cell is dirty
   */
  isCellDirty(col: number, row: number): boolean {
    if (this.fullRedrawNeeded) return true;
    if (this.damagedRows.has(row)) return true;
    if (this.damagedColumns.has(col)) return true;
    return this.damagedCells.has(`${col},${row}`);
  }

  /**
   * Check if a row is dirty
   */
  isRowDirty(row: number): boolean {
    if (this.fullRedrawNeeded) return true;
    return this.damagedRows.has(row);
  }

  /**
   * Check if a column is dirty
   */
  isColumnDirty(col: number): boolean {
    if (this.fullRedrawNeeded) return true;
    return this.damagedColumns.has(col);
  }

  // ============================================================================
  // GET DIRTY REGIONS
  // ============================================================================

  /**
   * Get all dirty regions
   */
  getDirtyRegions(): DirtyRegions {
    return {
      full: this.fullRedrawNeeded,
      rows: new Set(this.damagedRows),
      columns: new Set(this.damagedColumns),
      cells: new Set(this.damagedCells),
    };
  }

  /**
   * Get dirty rows
   */
  getDirtyRows(): number[] {
    return Array.from(this.damagedRows);
  }

  /**
   * Get dirty columns
   */
  getDirtyColumns(): number[] {
    return Array.from(this.damagedColumns);
  }

  /**
   * Get dirty cells
   */
  getDirtyCells(): Array<[number, number]> {
    return Array.from(this.damagedCells).map((key) => {
      const [col, row] = key.split(',').map(Number);
      return [col, row];
    });
  }

  // ============================================================================
  // OPTIMIZATION
  // ============================================================================

  /**
   * Optimize dirty regions
   * - If too many individual cells, promote to row/column
   * - If too many rows/columns, promote to full redraw
   */
  optimize(thresholds: { maxCells?: number; maxRows?: number; maxColumns?: number } = {}): void {
    const { maxCells = 50, maxRows = 100, maxColumns = 20 } = thresholds;

    // If too many cells, check if we should promote to rows
    if (this.damagedCells.size > maxCells) {
      const rowsWithDirtyCells = new Set<number>();
      for (const cell of this.damagedCells) {
        const [_, row] = cell.split(',').map(Number);
        rowsWithDirtyCells.add(row);
      }

      // If cells are concentrated in few rows, promote to those rows
      if (rowsWithDirtyCells.size <= 10) {
        for (const row of rowsWithDirtyCells) {
          this.damagedRows.add(row);
        }
        this.damagedCells.clear();
      } else {
        // Too spread out, just do full redraw
        this.markAllDirty();
        return;
      }
    }

    // If too many rows, do full redraw
    if (this.damagedRows.size > maxRows) {
      this.markAllDirty();
      return;
    }

    // If too many columns, do full redraw
    if (this.damagedColumns.size > maxColumns) {
      this.markAllDirty();
      return;
    }
  }

  // ============================================================================
  // CLEAR
  // ============================================================================

  /**
   * Clear all damage tracking
   */
  clear(): void {
    this.damagedCells.clear();
    this.damagedRows.clear();
    this.damagedColumns.clear();
    this.fullRedrawNeeded = false;
    this.lastRenderTime = performance.now();
  }

  /**
   * Reset completely
   */
  reset(): void {
    this.clear();
    this.lastRenderTime = 0;
  }

  // ============================================================================
  // RENDER TIMING
  // ============================================================================

  /**
   * Get time since last render
   */
  getTimeSinceLastRender(): number {
    return performance.now() - this.lastRenderTime;
  }

  /**
   * Get last render time
   */
  getLastRenderTime(): number {
    return this.lastRenderTime;
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate bounding rectangle for dirty regions
 */
export function getDirtyBounds(
  dirty: DirtyRegions,
  rowHeight: number,
  columnWidths: number[],
  scrollTop: number,
  scrollLeft: number,
  viewportWidth: number,
  viewportHeight: number
): Rectangle[] {
  if (dirty.full) {
    return [{ x: 0, y: 0, width: viewportWidth, height: viewportHeight }];
  }

  const rects: Rectangle[] = [];

  // Add rectangles for dirty rows
  for (const row of dirty.rows) {
    const y = row * rowHeight - scrollTop;
    if (y + rowHeight >= 0 && y <= viewportHeight) {
      rects.push({
        x: 0,
        y: Math.max(0, y),
        width: viewportWidth,
        height: rowHeight,
      });
    }
  }

  // Add rectangles for dirty columns
  for (const col of dirty.columns) {
    if (col >= 0 && col < columnWidths.length) {
      let x = 0;
      for (let i = 0; i < col; i++) {
        x += columnWidths[i] || 0;
      }
      x -= scrollLeft;

      const width = columnWidths[col] || 0;

      if (x + width >= 0 && x <= viewportWidth) {
        rects.push({
          x: Math.max(0, x),
          y: 0,
          width,
          height: viewportHeight,
        });
      }
    }
  }

  // Add rectangles for dirty cells
  for (const cell of dirty.cells) {
    const [col, row] = cell.split(',').map(Number);

    // Skip if row or column already covered
    if (dirty.rows.has(row) || dirty.columns.has(col)) continue;

    const y = row * rowHeight - scrollTop;
    let x = 0;
    for (let i = 0; i < col; i++) {
      x += columnWidths[i] || 0;
    }
    x -= scrollLeft;

    const width = columnWidths[col] || 0;

    if (x + width >= 0 && x <= viewportWidth && y + rowHeight >= 0 && y <= viewportHeight) {
      rects.push({
        x: Math.max(0, x),
        y: Math.max(0, y),
        width,
        height: rowHeight,
      });
    }
  }

  return rects;
}

/**
 * Merge overlapping rectangles
 */
export function mergeRectangles(rects: Rectangle[]): Rectangle[] {
  if (rects.length <= 1) return rects;

  // Simple merge - find bounding box
  // For more complex merging, use a proper rectangle packing algorithm
  const merged: Rectangle[] = [];
  const used = new Set<number>();

  for (let i = 0; i < rects.length; i++) {
    if (used.has(i)) continue;

    let current = rects[i];

    for (let j = i + 1; j < rects.length; j++) {
      if (used.has(j)) continue;

      const other = rects[j];

      // Check if they overlap or are adjacent
      if (
        current.x <= other.x + other.width &&
        current.x + current.width >= other.x &&
        current.y <= other.y + other.height &&
        current.y + current.height >= other.y
      ) {
        // Merge
        const newX = Math.min(current.x, other.x);
        const newY = Math.min(current.y, other.y);
        current = {
          x: newX,
          y: newY,
          width: Math.max(current.x + current.width, other.x + other.width) - newX,
          height: Math.max(current.y + current.height, other.y + other.height) - newY,
        };
        used.add(j);
      }
    }

    merged.push(current);
  }

  return merged;
}
