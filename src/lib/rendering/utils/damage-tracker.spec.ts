/**
 * Unit tests for Damage Tracker
 *
 * Tests for DamageTracker class and related utilities.
 */

import {
  DamageTracker,
  getDirtyBounds,
  mergeRectangles,
} from './damage-tracker';
import { DirtyRegions, Rectangle } from '../render/types';

describe('DamageTracker', () => {
  let tracker: DamageTracker;

  beforeEach(() => {
    tracker = new DamageTracker();
  });

  describe('markCellDirty', () => {
    it('should mark a single cell as dirty', () => {
      tracker.markCellDirty(2, 5);

      expect(tracker.isCellDirty(2, 5)).toBe(true);
      expect(tracker.isCellDirty(2, 6)).toBe(false);
      expect(tracker.isCellDirty(3, 5)).toBe(false);
    });

    it('should mark multiple cells', () => {
      tracker.markCellsDirty([
        [0, 0],
        [1, 1],
        [2, 2],
      ]);

      expect(tracker.isCellDirty(0, 0)).toBe(true);
      expect(tracker.isCellDirty(1, 1)).toBe(true);
      expect(tracker.isCellDirty(2, 2)).toBe(true);
    });
  });

  describe('markRowDirty', () => {
    it('should mark a row as dirty', () => {
      tracker.markRowDirty(5);

      expect(tracker.isRowDirty(5)).toBe(true);
      expect(tracker.isRowDirty(4)).toBe(false);
      expect(tracker.isRowDirty(6)).toBe(false);
    });

    it('should mark multiple rows', () => {
      tracker.markRowsDirty([1, 3, 5]);

      expect(tracker.isRowDirty(1)).toBe(true);
      expect(tracker.isRowDirty(3)).toBe(true);
      expect(tracker.isRowDirty(5)).toBe(true);
      expect(tracker.isRowDirty(2)).toBe(false);
    });

    it('should make all cells in row dirty', () => {
      tracker.markRowDirty(3);

      expect(tracker.isCellDirty(0, 3)).toBe(true);
      expect(tracker.isCellDirty(5, 3)).toBe(true);
      expect(tracker.isCellDirty(10, 3)).toBe(true);
    });
  });

  describe('markColumnDirty', () => {
    it('should mark a column as dirty', () => {
      tracker.markColumnDirty(2);

      expect(tracker.isColumnDirty(2)).toBe(true);
      expect(tracker.isColumnDirty(1)).toBe(false);
      expect(tracker.isColumnDirty(3)).toBe(false);
    });

    it('should mark multiple columns', () => {
      tracker.markColumnsDirty([0, 2, 4]);

      expect(tracker.isColumnDirty(0)).toBe(true);
      expect(tracker.isColumnDirty(2)).toBe(true);
      expect(tracker.isColumnDirty(4)).toBe(true);
      expect(tracker.isColumnDirty(1)).toBe(false);
    });

    it('should make all cells in column dirty', () => {
      tracker.markColumnDirty(3);

      expect(tracker.isCellDirty(3, 0)).toBe(true);
      expect(tracker.isCellDirty(3, 5)).toBe(true);
      expect(tracker.isCellDirty(3, 10)).toBe(true);
    });
  });

  describe('markAllDirty', () => {
    it('should require full redraw', () => {
      tracker.markAllDirty();

      expect(tracker.needsFullRedraw()).toBe(true);
    });

    it('should clear existing damage', () => {
      tracker.markCellDirty(0, 0);
      tracker.markRowDirty(5);
      tracker.markColumnDirty(2);
      tracker.markAllDirty();

      const regions = tracker.getDirtyRegions();
      expect(regions.rows.size).toBe(0);
      expect(regions.columns.size).toBe(0);
      expect(regions.cells.size).toBe(0);
    });
  });

  describe('markSelectionChanged', () => {
    it('should mark rows that changed selection state', () => {
      const oldSelection = new Set([1, 2, 3]);
      const newSelection = new Set([2, 3, 4]);

      tracker.markSelectionChanged(oldSelection, newSelection);

      // Row 1 was deselected
      expect(tracker.isRowDirty(1)).toBe(true);
      // Row 4 was newly selected
      expect(tracker.isRowDirty(4)).toBe(true);
      // Rows 2, 3 unchanged selection state
      expect(tracker.isRowDirty(2)).toBe(false);
      expect(tracker.isRowDirty(3)).toBe(false);
    });

    it('should handle empty selections', () => {
      tracker.markSelectionChanged(new Set(), new Set([1, 2, 3]));

      expect(tracker.isRowDirty(1)).toBe(true);
      expect(tracker.isRowDirty(2)).toBe(true);
      expect(tracker.isRowDirty(3)).toBe(true);
    });
  });

  describe('hasDamage', () => {
    it('should return false when clean', () => {
      expect(tracker.hasDamage()).toBe(false);
    });

    it('should return true when cell is dirty', () => {
      tracker.markCellDirty(0, 0);
      expect(tracker.hasDamage()).toBe(true);
    });

    it('should return true when row is dirty', () => {
      tracker.markRowDirty(0);
      expect(tracker.hasDamage()).toBe(true);
    });

    it('should return true when column is dirty', () => {
      tracker.markColumnDirty(0);
      expect(tracker.hasDamage()).toBe(true);
    });

    it('should return true when full redraw needed', () => {
      tracker.markAllDirty();
      expect(tracker.hasDamage()).toBe(true);
    });
  });

  describe('isCellDirty', () => {
    it('should return true when cell is directly marked', () => {
      tracker.markCellDirty(3, 7);
      expect(tracker.isCellDirty(3, 7)).toBe(true);
    });

    it('should return true when row is marked', () => {
      tracker.markRowDirty(5);
      expect(tracker.isCellDirty(0, 5)).toBe(true);
      expect(tracker.isCellDirty(10, 5)).toBe(true);
    });

    it('should return true when column is marked', () => {
      tracker.markColumnDirty(2);
      expect(tracker.isCellDirty(2, 0)).toBe(true);
      expect(tracker.isCellDirty(2, 100)).toBe(true);
    });

    it('should return true when full redraw needed', () => {
      tracker.markAllDirty();
      expect(tracker.isCellDirty(100, 100)).toBe(true);
    });
  });

  describe('getDirtyRegions', () => {
    it('should return all dirty information', () => {
      tracker.markCellDirty(0, 0);
      tracker.markRowDirty(5);
      tracker.markColumnDirty(3);

      const regions = tracker.getDirtyRegions();

      expect(regions.full).toBe(false);
      expect(regions.cells.has('0,0')).toBe(true);
      expect(regions.rows.has(5)).toBe(true);
      expect(regions.columns.has(3)).toBe(true);
    });
  });

  describe('getDirtyRows/Cols/Cells', () => {
    it('should return dirty rows as array', () => {
      tracker.markRowsDirty([1, 3, 5]);
      expect(tracker.getDirtyRows()).toEqual(expect.arrayContaining([1, 3, 5]));
    });

    it('should return dirty columns as array', () => {
      tracker.markColumnsDirty([0, 2, 4]);
      expect(tracker.getDirtyColumns()).toEqual(expect.arrayContaining([0, 2, 4]));
    });

    it('should return dirty cells as array', () => {
      tracker.markCellsDirty([
        [1, 2],
        [3, 4],
      ]);
      const cells = tracker.getDirtyCells();
      expect(cells).toEqual(expect.arrayContaining([[1, 2], [3, 4]]));
    });
  });

  describe('optimize', () => {
    it('should promote cells to rows when concentrated', () => {
      // Many cells in the same row
      for (let col = 0; col < 20; col++) {
        tracker.markCellDirty(col, 5);
      }

      tracker.optimize({ maxCells: 10 });

      // Should have promoted to row
      expect(tracker.isRowDirty(5)).toBe(true);
      // Individual cells should be cleared
      expect(tracker.getDirtyCells().length).toBe(0);
    });

    it('should do full redraw when too many rows', () => {
      for (let i = 0; i < 150; i++) {
        tracker.markRowDirty(i);
      }

      tracker.optimize({ maxRows: 100 });

      expect(tracker.needsFullRedraw()).toBe(true);
    });

    it('should do full redraw when too many columns', () => {
      for (let i = 0; i < 25; i++) {
        tracker.markColumnDirty(i);
      }

      tracker.optimize({ maxColumns: 20 });

      expect(tracker.needsFullRedraw()).toBe(true);
    });
  });

  describe('clear', () => {
    it('should clear all damage', () => {
      tracker.markCellDirty(0, 0);
      tracker.markRowDirty(5);
      tracker.markColumnDirty(3);
      tracker.markAllDirty();

      tracker.clear();

      expect(tracker.hasDamage()).toBe(false);
      expect(tracker.needsFullRedraw()).toBe(false);
    });
  });

  describe('reset', () => {
    it('should clear all damage and reset timing', () => {
      tracker.markCellDirty(0, 0);
      tracker.clear();

      tracker.reset();

      expect(tracker.hasDamage()).toBe(false);
      expect(tracker.getLastRenderTime()).toBe(0);
    });
  });

  describe('render timing', () => {
    it('should track last render time', () => {
      tracker.clear(); // Sets lastRenderTime
      expect(tracker.getLastRenderTime()).toBeGreaterThan(0);
    });

    it('should calculate time since last render', () => {
      tracker.clear();
      const time = tracker.getTimeSinceLastRender();
      expect(time).toBeGreaterThanOrEqual(0);
    });
  });
});

describe('getDirtyBounds', () => {
  it('should return full viewport for full redraw', () => {
    const dirty: DirtyRegions = {
      full: true,
      rows: new Set(),
      columns: new Set(),
      cells: new Set(),
    };

    const bounds = getDirtyBounds(dirty, 32, [100, 100, 100], 0, 0, 400, 600);

    expect(bounds).toHaveLength(1);
    expect(bounds[0]).toEqual({ x: 0, y: 0, width: 400, height: 600 });
  });

  it('should return bounds for dirty rows', () => {
    const dirty: DirtyRegions = {
      full: false,
      rows: new Set([5, 10]),
      columns: new Set(),
      cells: new Set(),
    };

    const bounds = getDirtyBounds(dirty, 32, [100, 100], 0, 0, 400, 600);

    // Row 5 at y=160, Row 10 at y=320
    expect(bounds.length).toBe(2);
  });

  it('should clip bounds to viewport', () => {
    const dirty: DirtyRegions = {
      full: false,
      rows: new Set([0]), // First row
      columns: new Set(),
      cells: new Set(),
    };

    // With scroll, first row is above viewport
    const bounds = getDirtyBounds(dirty, 32, [100], 100, 0, 400, 600);

    // Should be empty since row 0 is scrolled out
    expect(bounds.length).toBe(0);
  });

  it('should return bounds for dirty columns', () => {
    const dirty: DirtyRegions = {
      full: false,
      rows: new Set(),
      columns: new Set([1]),
      cells: new Set(),
    };

    const bounds = getDirtyBounds(dirty, 32, [50, 100, 75], 0, 0, 400, 600);

    // Column 1 starts at x=50, width=100
    expect(bounds.length).toBe(1);
    expect(bounds[0].x).toBe(50);
    expect(bounds[0].width).toBe(100);
  });

  it('should return bounds for dirty cells', () => {
    const dirty: DirtyRegions = {
      full: false,
      rows: new Set(),
      columns: new Set(),
      cells: new Set(['2,5']),
    };

    const bounds = getDirtyBounds(dirty, 32, [50, 100, 75], 0, 0, 400, 600);

    // Cell (2,5): column 2 starts at x=150, row 5 at y=160
    expect(bounds.length).toBe(1);
  });

  it('should skip cells covered by dirty rows/columns', () => {
    const dirty: DirtyRegions = {
      full: false,
      rows: new Set([5]),
      columns: new Set(),
      cells: new Set(['2,5']), // Same row as dirty row
    };

    const bounds = getDirtyBounds(dirty, 32, [100, 100, 100], 0, 0, 400, 600);

    // Should only have bounds for row 5, not separate cell
    expect(bounds.length).toBe(1);
    expect(bounds[0].y).toBe(160); // Row 5
  });
});

describe('mergeRectangles', () => {
  it('should return single rectangle unchanged', () => {
    const rects: Rectangle[] = [{ x: 0, y: 0, width: 100, height: 100 }];
    expect(mergeRectangles(rects)).toEqual(rects);
  });

  it('should merge overlapping rectangles', () => {
    const rects: Rectangle[] = [
      { x: 0, y: 0, width: 100, height: 100 },
      { x: 50, y: 50, width: 100, height: 100 },
    ];

    const merged = mergeRectangles(rects);

    expect(merged.length).toBe(1);
    expect(merged[0].x).toBe(0);
    expect(merged[0].y).toBe(0);
    expect(merged[0].width).toBe(150);
    expect(merged[0].height).toBe(150);
  });

  it('should not merge non-overlapping rectangles', () => {
    const rects: Rectangle[] = [
      { x: 0, y: 0, width: 50, height: 50 },
      { x: 100, y: 100, width: 50, height: 50 },
    ];

    const merged = mergeRectangles(rects);
    expect(merged.length).toBe(2);
  });

  it('should merge adjacent rectangles', () => {
    const rects: Rectangle[] = [
      { x: 0, y: 0, width: 100, height: 50 },
      { x: 0, y: 50, width: 100, height: 50 },
    ];

    const merged = mergeRectangles(rects);

    expect(merged.length).toBe(1);
    expect(merged[0].height).toBe(100);
  });

  it('should handle empty array', () => {
    expect(mergeRectangles([])).toEqual([]);
  });
});