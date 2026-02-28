/**
 * Unit tests for Walker Functions
 *
 * Tests for walkColumns, walkRows, walkCells, and related utilities.
 */

import { Column } from '../../types/ag-grid-types';
import {
  calculateVisibleRange,
  getColumnAtX,
  getColumnIndex,
  getPinnedWidths,
  getPositionedColumns,
  getRowAtY,
  getRowY,
  getTotalColumnWidth,
  getVisibleRowRange,
  isRowVisible,
  walkColumns,
  walkRows,
} from './walk';

// Helper to create mock columns
function createMockColumn(overrides: Partial<Column> = {}): Column {
  return {
    colId: 'test-col',
    field: 'testField',
    width: 100,
    pinned: false,
    visible: true,
    ...overrides,
  };
}

describe('Walker Functions', () => {
  describe('getPinnedWidths', () => {
    it('should calculate left and right pinned widths', () => {
      const columns: Column[] = [
        createMockColumn({ colId: 'left1', pinned: 'left', width: 50 }),
        createMockColumn({ colId: 'left2', pinned: 'left', width: 50 }),
        createMockColumn({ colId: 'center1', width: 100 }),
        createMockColumn({ colId: 'right1', pinned: 'right', width: 75 }),
        createMockColumn({ colId: 'right2', pinned: 'right', width: 75 }),
      ];

      const widths = getPinnedWidths(columns);

      expect(widths.left).toBe(100);
      expect(widths.right).toBe(150);
    });

    it('should return zeros when no pinned columns', () => {
      const columns: Column[] = [
        createMockColumn({ colId: 'col1', width: 100 }),
        createMockColumn({ colId: 'col2', width: 100 }),
      ];

      const widths = getPinnedWidths(columns);

      expect(widths.left).toBe(0);
      expect(widths.right).toBe(0);
    });
  });

  describe('getVisibleRowRange', () => {
    it('should calculate visible row range with buffer', () => {
      const result = getVisibleRowRange(
        100, // scrollTop
        400, // viewportHeight
        32, // rowHeight
        1000, // totalRowCount
        5 // buffer
      );

      // Starting row: floor(100/32) = 3, minus buffer = -2 -> clamped to 0
      // Rows visible: ceil(400/32) = 13
      // End: 0 + 13 + 10 (buffer*2) = 23
      expect(result.startRow).toBe(0);
      expect(result.endRow).toBeLessThanOrEqual(23);
    });

    it('should clamp start row to 0', () => {
      const result = getVisibleRowRange(
        0, // scrollTop
        400, // viewportHeight
        32, // rowHeight
        1000, // totalRowCount
        5 // buffer
      );

      expect(result.startRow).toBe(0);
    });

    it('should clamp end row to total row count', () => {
      const result = getVisibleRowRange(
        0, // scrollTop
        400, // viewportHeight
        32, // rowHeight
        10, // totalRowCount (small)
        5 // buffer
      );

      expect(result.endRow).toBeLessThanOrEqual(10);
    });
  });

  describe('walkColumns', () => {
    it('should walk through columns in order (left, center, right)', () => {
      const columns: Column[] = [
        createMockColumn({ colId: 'left1', pinned: 'left', width: 50 }),
        createMockColumn({ colId: 'center1', width: 100 }),
        createMockColumn({ colId: 'right1', pinned: 'right', width: 75 }),
      ];

      const visited: string[] = [];
      const xPositions: number[] = [];

      walkColumns(columns, 0, 400, 50, 75, (col, x, _width, _isPinned, _pinSide) => {
        visited.push(col.colId);
        xPositions.push(x);
      });

      expect(visited).toEqual(['left1', 'center1', 'right1']);
      // left1 starts at 0
      // center1 starts after left pinned (50) minus scroll (0) = 50
      // right1 starts at viewport width - right pinned = 400 - 75 = 325
      expect(xPositions[0]).toBe(0);
      expect(xPositions[1]).toBe(50);
      expect(xPositions[2]).toBe(325);
    });

    it('should skip center columns outside viewport', () => {
      const columns: Column[] = [
        createMockColumn({ colId: 'left1', pinned: 'left', width: 50 }),
        createMockColumn({ colId: 'center1', width: 100 }),
        createMockColumn({ colId: 'center2', width: 100 }),
        createMockColumn({ colId: 'center3', width: 100 }),
        createMockColumn({ colId: 'right1', pinned: 'right', width: 75 }),
      ];

      // Scroll so center1 and part of center2 are hidden
      const visited: string[] = [];
      walkColumns(columns, 150, 400, 50, 75, (col, _x, _width, _isPinned) => {
        visited.push(col.colId);
      });

      // Left and right pinned should always be visited
      expect(visited).toContain('left1');
      expect(visited).toContain('right1');
    });
  });

  describe('walkRows', () => {
    it('should walk through rows with correct Y positions', () => {
      const visited: { row: number; y: number }[] = [];
      const getRowNode = (index: number) => ({ data: { id: index } }) as any;

      walkRows(0, 5, 0, 32, getRowNode, (rowIndex, y, _height, _rowNode) => {
        visited.push({ row: rowIndex, y });
      });

      expect(visited).toHaveLength(5);
      expect(visited[0]).toEqual({ row: 0, y: 0 });
      expect(visited[1]).toEqual({ row: 1, y: 32 });
      expect(visited[4]).toEqual({ row: 4, y: 128 });
    });

    it('should account for scroll offset', () => {
      const visited: { row: number; y: number }[] = [];
      const getRowNode = (index: number) => ({ data: { id: index } }) as any;

      walkRows(10, 15, 320, 32, getRowNode, (rowIndex, y, _height, _rowNode) => {
        visited.push({ row: rowIndex, y });
      });

      // Row 10 at scroll 320: y = 10*32 - 320 = 0
      expect(visited[0]).toEqual({ row: 10, y: 0 });
    });
  });

  describe('getRowY', () => {
    it('should calculate Y position with scroll offset', () => {
      expect(getRowY(0, 32, 0)).toBe(0);
      expect(getRowY(10, 32, 0)).toBe(320);
      expect(getRowY(10, 32, 320)).toBe(0);
      expect(getRowY(10, 32, 160)).toBe(160);
    });
  });

  describe('getRowAtY', () => {
    it('should return row index for Y position', () => {
      expect(getRowAtY(0, 32, 0)).toBe(0);
      expect(getRowAtY(31, 32, 0)).toBe(0);
      expect(getRowAtY(32, 32, 0)).toBe(1);
      expect(getRowAtY(100, 32, 0)).toBe(3);
    });

    it('should account for scroll offset', () => {
      // Y=0 with scroll=320 means we're at row 10
      expect(getRowAtY(0, 32, 320)).toBe(10);
      expect(getRowAtY(31, 32, 320)).toBe(10);
      expect(getRowAtY(32, 32, 320)).toBe(11);
    });
  });

  describe('getColumnAtX', () => {
    it('should find left pinned column', () => {
      const columns: Column[] = [
        createMockColumn({ colId: 'left1', pinned: 'left', width: 50 }),
        createMockColumn({ colId: 'left2', pinned: 'left', width: 50 }),
        createMockColumn({ colId: 'center1', width: 100 }),
        createMockColumn({ colId: 'right1', pinned: 'right', width: 75 }),
      ];

      const result = getColumnAtX(columns, 25, 0, 400);
      expect(result.column?.colId).toBe('left1');
      expect(result.index).toBe(0);
      expect(result.localX).toBe(25);

      const result2 = getColumnAtX(columns, 75, 0, 400);
      expect(result2.column?.colId).toBe('left2');
      expect(result2.localX).toBe(25);
    });

    it('should find right pinned column', () => {
      const columns: Column[] = [
        createMockColumn({ colId: 'left1', pinned: 'left', width: 50 }),
        createMockColumn({ colId: 'center1', width: 100 }),
        createMockColumn({ colId: 'right1', pinned: 'right', width: 75 }),
      ];

      // Right pinned starts at 400 - 75 = 325
      const result = getColumnAtX(columns, 350, 0, 400);
      expect(result.column?.colId).toBe('right1');
      expect(result.index).toBe(2);
    });

    it('should find center column accounting for scroll', () => {
      const columns: Column[] = [
        createMockColumn({ colId: 'left1', pinned: 'left', width: 50 }),
        createMockColumn({ colId: 'center1', width: 100 }),
        createMockColumn({ colId: 'center2', width: 100 }),
        createMockColumn({ colId: 'right1', pinned: 'right', width: 75 }),
      ];

      // Center area: 50 to 325 (400-75)
      // X=100 with scroll=0 should hit center1
      const result = getColumnAtX(columns, 100, 0, 400);
      expect(result.column?.colId).toBe('center1');

      // X=160 with scroll=0 should hit center2
      const result2 = getColumnAtX(columns, 160, 0, 400);
      expect(result2.column?.colId).toBe('center2');
    });

    it('should return null for position outside columns', () => {
      const columns: Column[] = [createMockColumn({ colId: 'col1', width: 100 })];

      const result = getColumnAtX(columns, 200, 0, 400);
      expect(result.column).toBeNull();
      expect(result.index).toBe(-1);
    });
  });

  describe('getTotalColumnWidth', () => {
    it('should sum all column widths', () => {
      const columns: Column[] = [
        createMockColumn({ width: 100 }),
        createMockColumn({ width: 150 }),
        createMockColumn({ width: 200 }),
      ];

      expect(getTotalColumnWidth(columns)).toBe(450);
    });

    it('should return 0 for empty array', () => {
      expect(getTotalColumnWidth([])).toBe(0);
    });
  });

  describe('isRowVisible', () => {
    it('should return true for visible rows', () => {
      expect(isRowVisible(5, 160, 400, 32)).toBe(true); // Row 5: y=160-192, in viewport 160-560
    });

    it('should return false for rows above viewport', () => {
      expect(isRowVisible(3, 200, 400, 32)).toBe(false); // Row 3: y=96-128, above 200
    });

    it('should return false for rows below viewport', () => {
      expect(isRowVisible(20, 0, 400, 32)).toBe(false); // Row 20: y=640, below 400
    });

    it('should return true for partially visible rows', () => {
      // Row 12: y=384-416, partially in viewport 0-400
      expect(isRowVisible(12, 0, 400, 32)).toBe(true);
    });
  });

  describe('calculateVisibleRange', () => {
    it('should calculate complete visible range', () => {
      const columns: Column[] = [
        createMockColumn({ colId: 'left1', pinned: 'left', width: 50 }),
        createMockColumn({ colId: 'center1', width: 100 }),
        createMockColumn({ colId: 'center2', width: 100 }),
        createMockColumn({ colId: 'right1', pinned: 'right', width: 75 }),
      ];

      const range = calculateVisibleRange(
        columns,
        0, // scrollTop
        0, // scrollLeft
        400, // viewportWidth
        400, // viewportHeight
        32, // rowHeight
        100, // totalRowCount
        5 // buffer
      );

      expect(range.startRow).toBe(0);
      expect(range.endRow).toBeGreaterThan(0);
      expect(range.startColumnIndex).toBeDefined();
      expect(range.endColumnIndex).toBeDefined();
    });
  });

  describe('getPositionedColumns', () => {
    it('should return all columns with positions', () => {
      const columns: Column[] = [
        createMockColumn({ colId: 'left1', pinned: 'left', width: 50 }),
        createMockColumn({ colId: 'center1', width: 100 }),
        createMockColumn({ colId: 'right1', pinned: 'right', width: 75 }),
      ];

      const positioned = getPositionedColumns(columns, 0, 400, 50, 75);

      expect(positioned.length).toBeGreaterThan(0);
      expect(positioned[0].column.colId).toBe('left1');
      expect(positioned[0].x).toBe(0);
    });
  });

  describe('getColumnIndex', () => {
    it('should find column index by colId', () => {
      const columns: Column[] = [
        createMockColumn({ colId: 'col1' }),
        createMockColumn({ colId: 'col2' }),
        createMockColumn({ colId: 'col3' }),
      ];

      expect(getColumnIndex(columns, 'col1')).toBe(0);
      expect(getColumnIndex(columns, 'col2')).toBe(1);
      expect(getColumnIndex(columns, 'col3')).toBe(2);
      expect(getColumnIndex(columns, 'notfound')).toBe(-1);
    });
  });
});
