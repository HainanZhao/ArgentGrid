import { describe, expect, it, vi } from 'vitest';
import type { Column, GridApi, IRowNode } from '../types/ag-grid-types';
import { CellOverlayManager } from './cell-overlay-manager';

function createMockGridApi(rows: any[] = []): GridApi {
  const nodes: IRowNode[] = rows.map((data, i) => ({
    id: String(i),
    data,
    rowPinned: false,
    rowHeight: null,
    displayed: true,
    selected: false,
    expanded: false,
    group: false,
    level: 0,
    firstChild: true,
    lastChild: true,
    rowIndex: i,
    displayedRowIndex: i,
    setSelected: vi.fn(),
  }));

  return {
    getDisplayedRowCount: () => nodes.length,
    getDisplayedRowAtIndex: (index: number) => nodes[index] || null,
    getAllColumns: () => [],
    getColumn: vi.fn(),
    getGridOption: vi.fn((key: string) => {
      if (key === 'rowHeight') return 32;
      if (key === 'context') return undefined;
      if (key === 'defaultColDef') return {};
      return undefined;
    }),
  } as any;
}

function createMockColumn(
  colId: string,
  width = 150,
  pinned: 'left' | 'right' | false = false
): Column {
  return {
    colId,
    field: colId,
    headerName: colId,
    width,
    minWidth: 50,
    maxWidth: 500,
    pinned,
    visible: true,
    sort: null,
    sortIndex: undefined,
    aggFunc: null,
    checkboxSelection: false,
    headerCheckboxSelection: false,
    filter: undefined,
    parent: undefined,
    columnGroupShow: 'all',
    colIndex: 0,
  };
}

describe('CellOverlayManager', () => {
  it('should be creatable', () => {
    const manager = new CellOverlayManager();
    expect(manager).toBeDefined();
    expect(manager.getOverlayCount()).toBe(0);
  });

  describe('registerOverlayColumn', () => {
    it('should register and report overlay columns', () => {
      const manager = new CellOverlayManager();
      class MockRenderer {
        agInit() {}
      }
      manager.registerRendererColumn('status', MockRenderer as any);
      expect(manager.hasOverlayColumn('status')).toBe(true);
      expect(manager.hasOverlayColumn('name')).toBe(false);
      manager.destroy();
    });

    it('should unregister overlay columns and clean up', () => {
      const manager = new CellOverlayManager();
      class MockRenderer {
        agInit() {}
      }
      manager.registerRendererColumn('status', MockRenderer as any);
      manager.unregisterRendererColumn('status');
      expect(manager.hasOverlayColumn('status')).toBe(false);
      manager.destroy();
    });
  });

  describe('computeVisibleOverlayPositions', () => {
    it('should return empty array for no overlay columns', () => {
      const manager = new CellOverlayManager();
      const _api = createMockGridApi([{ name: 'Test' }]);
      const positions = manager.computeVisibleOverlayPositions([], [], 0, 0, 500, 800, 0, 0);
      expect(positions).toEqual([]);
      manager.destroy();
    });

    it('should compute positions for visible overlay columns', () => {
      const manager = new CellOverlayManager();
      const rows = Array.from({ length: 20 }, (_, i) => ({ name: `Row ${i}`, status: 'Active' }));
      const api = createMockGridApi(rows);

      class MockRenderer {
        agInit() {}
      }
      manager.registerRendererColumn('status', MockRenderer as any);

      // Initialize to set gridApi
      const container = document.createElement('div');
      manager.initialize(container, {} as any, {} as any, api, 32);

      const col = createMockColumn('status', 150);
      const allCols = [createMockColumn('name', 200), col];

      const positions = manager.computeVisibleOverlayPositions(
        [col],
        allCols,
        0,
        0,
        500,
        800,
        0,
        0
      );

      expect(positions.length).toBeGreaterThan(0);
      expect(positions[0].colId).toBe('status');
      expect(positions[0].width).toBe(150);
      expect(positions[0].height).toBe(32);

      manager.destroy();
    });

    it('should clip positions outside viewport', () => {
      const manager = new CellOverlayManager();
      const rows = Array.from({ length: 100 }, (_, i) => ({ name: `Row ${i}`, status: 'Active' }));
      const api = createMockGridApi(rows);

      class MockRenderer {
        agInit() {}
      }
      manager.registerRendererColumn('status', MockRenderer as any);

      const container = document.createElement('div');
      manager.initialize(container, {} as any, {} as any, api, 32);

      const col = createMockColumn('status', 150);
      const scrollCol = createMockColumn('scroll', 800);
      const allCols = [scrollCol, col];

      const positions = manager.computeVisibleOverlayPositions(
        [col],
        allCols,
        0,
        0,
        500,
        800,
        0,
        0
      );

      for (const pos of positions) {
        expect(pos.x + pos.width >= 0).toBe(true);
      }

      manager.destroy();
    });
  });

  describe('hideAllOverlays / showAllOverlays', () => {
    it('should not throw when no overlays exist', () => {
      const manager = new CellOverlayManager();
      expect(() => manager.hideAllOverlays()).not.toThrow();
      expect(() => manager.showAllOverlays()).not.toThrow();
      manager.destroy();
    });
  });

  describe('getOverlayColumns', () => {
    it('should return registered overlay column IDs', () => {
      const manager = new CellOverlayManager();
      class MockRenderer {
        agInit() {}
      }
      manager.registerRendererColumn('col1', MockRenderer as any);
      manager.registerRendererColumn('col2', MockRenderer as any);

      const cols = manager.getOverlayColumns();
      expect(cols.has('col1')).toBe(true);
      expect(cols.has('col2')).toBe(true);
      expect(cols.size).toBe(2);
      manager.destroy();
    });
  });
});
