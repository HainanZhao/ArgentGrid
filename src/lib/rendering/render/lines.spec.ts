import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  drawCrispLine,
  drawHorizontalLine,
  drawVerticalLine,
  drawRowLines,
  drawColumnLines,
  drawRangeSelectionBorder,
  getColumnBorderPositions,
  drawFocusBorder,
  drawResizeHandle,
  drawSortIndicator,
  drawFilterIndicator
} from './lines';
import { Column } from '../../types/ag-grid-types';
import { GridTheme, Rectangle } from './types';
import { DEFAULT_THEME } from './theme';

const mockTheme: GridTheme = {
  ...DEFAULT_THEME,
  backgroundColor: '#ffffff',
  rowBackgroundColor: '#ffffff',
  rowHoverBackgroundColor: '#f0f0f0',
  selectedRowBackgroundColor: '#e0e0e0',
  borderColor: '#cccccc',
  textColor: '#000000',
  headerBackgroundColor: '#f5f5f5',
  headerTextColor: '#333333',
  gridLineColor: '#e0e0e0',
  rowHeight: 32,
  headerHeight: 48,
  fontSize: 13,
  fontFamily: 'sans-serif'
};

const mockContext = {
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  stroke: vi.fn(),
  fillRect: vi.fn(),
  fillText: vi.fn(),
  arc: vi.fn(),
  closePath: vi.fn(),
  setTransform: vi.fn(),
  scale: vi.fn(),
  translate: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
  clip: vi.fn(),
  clearRect: vi.fn(),
  measureText: vi.fn((text: string) => ({ width: text.length * 7 })),
  font: '13px sans-serif',
  fillStyle: '#000',
  strokeStyle: '#000',
  lineWidth: 1,
  createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() }))
} as unknown as CanvasRenderingContext2D;

const mockColumn: Column = {
  colId: 'test',
  field: 'test',
  headerName: 'Test',
  width: 100,
  pinned: false,
  visible: true,
  sort: null
};

describe('lines.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('drawCrispLine', () => {
    it('should draw a crisp line', () => {
      drawCrispLine(mockContext, 0, 0, 100, 100);
      expect(mockContext.beginPath).toHaveBeenCalled();
      expect(mockContext.moveTo).toHaveBeenCalledWith(0.5, 0.5);
      expect(mockContext.lineTo).toHaveBeenCalledWith(100.5, 100.5);
      expect(mockContext.stroke).toHaveBeenCalled();
    });

    it('should handle negative coordinates', () => {
      drawCrispLine(mockContext, -10, -10, 100, 100);
      expect(mockContext.moveTo).toHaveBeenCalledWith(-10.5, -10.5);
    });

    it('should handle horizontal line', () => {
      drawCrispLine(mockContext, 0, 50, 100, 50);
      expect(mockContext.moveTo).toHaveBeenCalledWith(0.5, 50.5);
      expect(mockContext.lineTo).toHaveBeenCalledWith(100.5, 50.5);
    });

    it('should handle vertical line', () => {
      drawCrispLine(mockContext, 50, 0, 50, 100);
      expect(mockContext.moveTo).toHaveBeenCalledWith(50.5, 0.5);
      expect(mockContext.lineTo).toHaveBeenCalledWith(50.5, 100.5);
    });
  });

  describe('drawHorizontalLine', () => {
    it('should draw horizontal line', () => {
      drawHorizontalLine(mockContext, 50, 0, 100);
      expect(mockContext.moveTo).toHaveBeenCalledWith(0.5, 50.5);
      expect(mockContext.lineTo).toHaveBeenCalledWith(100.5, 50.5);
    });

    it('should handle zero width', () => {
      drawHorizontalLine(mockContext, 50, 0, 0);
      expect(mockContext.moveTo).toHaveBeenCalledWith(0.5, 50.5);
      expect(mockContext.lineTo).toHaveBeenCalledWith(0.5, 50.5);
    });
  });

  describe('drawVerticalLine', () => {
    it('should draw vertical line', () => {
      drawVerticalLine(mockContext, 50, 0, 100);
      expect(mockContext.moveTo).toHaveBeenCalledWith(50.5, 0.5);
      expect(mockContext.lineTo).toHaveBeenCalledWith(50.5, 100.5);
    });

    it('should handle zero height', () => {
      drawVerticalLine(mockContext, 50, 0, 0);
      expect(mockContext.moveTo).toHaveBeenCalledWith(50.5, 0.5);
      expect(mockContext.lineTo).toHaveBeenCalledWith(50.5, 0.5);
    });
  });

  describe('drawRowLines', () => {
    it('should draw multiple row lines', () => {
      drawRowLines(mockContext, 0, 10, 32, 0, 800, mockTheme);
      expect(mockContext.beginPath).toHaveBeenCalled();
      expect(mockContext.stroke).toHaveBeenCalled();
    });

    it('should handle scroll offset', () => {
      drawRowLines(mockContext, 0, 10, 32, 100, 800, mockTheme);
      expect(mockContext.stroke).toHaveBeenCalled();
    });

    it('should handle single row', () => {
      drawRowLines(mockContext, 5, 5, 32, 0, 800, mockTheme);
      expect(mockContext.stroke).toHaveBeenCalled();
    });

    it('should handle empty range', () => {
      drawRowLines(mockContext, 10, 5, 32, 0, 800, mockTheme);
      // Should not throw
    });

    it('should use theme border color', () => {
      drawRowLines(mockContext, 0, 10, 32, 0, 800, mockTheme);
      expect(mockContext.strokeStyle).toBe(mockTheme.borderColor);
    });

    it('should use theme grid line color if border color not set', () => {
      const themeWithoutBorder = { ...mockTheme, borderColor: undefined };
      drawRowLines(mockContext, 0, 10, 32, 0, 800, themeWithoutBorder);
      expect(mockContext.strokeStyle).toBe(mockTheme.gridLineColor);
    });
  });

  describe('drawColumnLines', () => {
    it('should draw column lines', () => {
      const columns: Column[] = [mockColumn];
      drawColumnLines(
        mockContext, columns, 0, 0, 800, 600, 0, 0, mockTheme, 0, 10, 32
      );
      expect(mockContext.beginPath).toHaveBeenCalled();
      expect(mockContext.stroke).toHaveBeenCalled();
    });

    it('should handle pinned columns', () => {
      const columns: Column[] = [mockColumn];
      drawColumnLines(
        mockContext, columns, 0, 0, 800, 600, 100, 50, mockTheme, 0, 10, 32
      );
      expect(mockContext.stroke).toHaveBeenCalled();
    });

    it('should handle scroll offset', () => {
      const columns: Column[] = [mockColumn];
      drawColumnLines(
        mockContext, columns, 100, 0, 800, 600, 0, 0, mockTheme, 0, 10, 32
      );
      expect(mockContext.stroke).toHaveBeenCalled();
    });

    it('should handle empty columns', () => {
      drawColumnLines(
        mockContext, [], 0, 0, 800, 600, 0, 0, mockTheme, 0, 10, 32
      );
      // Should not throw
    });

    it('should use theme border color', () => {
      const columns: Column[] = [mockColumn];
      drawColumnLines(
        mockContext, columns, 0, 0, 800, 600, 0, 0, mockTheme, 0, 10, 32
      );
      expect(mockContext.strokeStyle).toBe(mockTheme.borderColor);
    });
  });

  describe('drawRangeSelectionBorder', () => {
    it('should draw selection border', () => {
      const range: Rectangle = { x: 0, y: 0, width: 100, height: 32 };
      drawRangeSelectionBorder(mockContext, range, mockTheme);
      expect(mockContext.strokeRect).toBeDefined();
      expect(mockContext.beginPath).toHaveBeenCalled();
    });

    it('should draw border with theme color', () => {
      const range: Rectangle = { x: 0, y: 0, width: 100, height: 32 };
      drawRangeSelectionBorder(mockContext, range, mockTheme);
      expect(mockContext.strokeStyle).toBe(mockTheme.accentColor || mockTheme.borderColor);
    });

    it('should handle zero dimensions', () => {
      const range: Rectangle = { x: 0, y: 0, width: 0, height: 0 };
      drawRangeSelectionBorder(mockContext, range, mockTheme);
      // Should not throw
    });
  });

  describe('getColumnBorderPositions', () => {
    it('should get border positions for column', () => {
      const positions = getColumnBorderPositions(mockColumn, 0, 0, 100, 600);
      expect(positions).toBeDefined();
      expect(positions.left).toBe(0);
      expect(positions.right).toBe(100);
    });

    it('should handle scroll offset', () => {
      const positions = getColumnBorderPositions(mockColumn, 50, 0, 100, 600);
      expect(positions.left).toBe(50);
      expect(positions.right).toBe(150);
    });

    it('should handle pinned column', () => {
      const pinnedColumn: Column = { ...mockColumn, pinned: 'left' };
      const positions = getColumnBorderPositions(pinnedColumn, 0, 0, 100, 600);
      expect(positions.left).toBe(0);
    });
  });

  describe('drawFocusBorder', () => {
    it('should draw focus border', () => {
      const rect: Rectangle = { x: 0, y: 0, width: 100, height: 32 };
      drawFocusBorder(mockContext, rect, mockTheme);
      expect(mockContext.beginPath).toHaveBeenCalled();
      expect(mockContext.stroke).toHaveBeenCalled();
    });

    it('should use accent color', () => {
      const rect: Rectangle = { x: 0, y: 0, width: 100, height: 32 };
      drawFocusBorder(mockContext, rect, mockTheme);
      expect(mockContext.strokeStyle).toBe(mockTheme.accentColor || mockTheme.borderColor);
    });

    it('should handle negative positions', () => {
      const rect: Rectangle = { x: -10, y: -10, width: 100, height: 32 };
      drawFocusBorder(mockContext, rect, mockTheme);
      // Should not throw
    });
  });

  describe('drawResizeHandle', () => {
    it('should draw resize handle', () => {
      drawResizeHandle(mockContext, 100, 0, 48, mockTheme);
      expect(mockContext.fillRect).toHaveBeenCalled();
    });

    it('should use resize handle color', () => {
      drawResizeHandle(mockContext, 100, 0, 48, mockTheme);
      expect(mockContext.fillStyle).toBe(mockTheme.resizeHandleColor || mockTheme.accentColor || mockTheme.borderColor);
    });

    it('should handle different header heights', () => {
      drawResizeHandle(mockContext, 100, 0, 60, mockTheme);
      expect(mockContext.fillRect).toHaveBeenCalled();
    });
  });

  describe('drawSortIndicator', () => {
    it('should draw asc sort indicator', () => {
      drawSortIndicator(mockContext, 100, 24, 'asc', mockTheme);
      expect(mockContext.beginPath).toHaveBeenCalled();
      expect(mockContext.fill).toHaveBeenCalled();
    });

    it('should draw desc sort indicator', () => {
      drawSortIndicator(mockContext, 100, 24, 'desc', mockTheme);
      expect(mockContext.beginPath).toHaveBeenCalled();
    });

    it('should use header text color', () => {
      drawSortIndicator(mockContext, 100, 24, 'asc', mockTheme);
      expect(mockContext.fillStyle).toBe(mockTheme.headerTextColor);
    });

    it('should handle null sort', () => {
      drawSortIndicator(mockContext, 100, 24, null, mockTheme);
      // Should not draw anything
    });
  });

  describe('drawFilterIndicator', () => {
    it('should draw filter indicator', () => {
      drawFilterIndicator(mockContext, 100, 24, mockTheme);
      expect(mockContext.beginPath).toHaveBeenCalled();
      expect(mockContext.fill).toHaveBeenCalled();
    });

    it('should use header text color', () => {
      drawFilterIndicator(mockContext, 100, 24, mockTheme);
      expect(mockContext.fillStyle).toBe(mockTheme.headerTextColor);
    });

    it('should draw funnel shape', () => {
      drawFilterIndicator(mockContext, 100, 24, mockTheme);
      expect(mockContext.moveTo).toHaveBeenCalled();
      expect(mockContext.lineTo).toHaveBeenCalled();
    });
  });

  describe('integration tests', () => {
    it('should draw complete grid lines', () => {
      const columns: Column[] = [
        { ...mockColumn, colId: 'col1', width: 100 },
        { ...mockColumn, colId: 'col2', width: 150 },
        { ...mockColumn, colId: 'col3', width: 200 }
      ];

      // Draw row lines
      drawRowLines(mockContext, 0, 20, 32, 0, 800, mockTheme);
      
      // Draw column lines
      drawColumnLines(mockContext, columns, 0, 0, 800, 600, 0, 0, mockTheme, 0, 20, 32);

      expect(mockContext.beginPath).toHaveBeenCalled();
      expect(mockContext.stroke).toHaveBeenCalled();
    });

    it('should draw with different themes', () => {
      const darkTheme: GridTheme = {
        ...mockTheme,
        backgroundColor: '#1a1a1a',
        rowBackgroundColor: '#2a2a2a',
        textColor: '#ffffff',
        borderColor: '#444444',
        gridLineColor: '#333333'
      };

      drawRowLines(mockContext, 0, 10, 32, 0, 800, darkTheme);
      expect(mockContext.strokeStyle).toBe(darkTheme.borderColor);
    });

    it('should handle large grids', () => {
      const columns: Column[] = Array(50).fill(mockColumn).map((col, i) => ({
        ...col, colId: `col${i}`, width: 100
      }));

      drawColumnLines(mockContext, columns, 0, 0, 5000, 2000, 0, 0, mockTheme, 0, 100, 32);
      expect(mockContext.stroke).toHaveBeenCalled();
    });

    it('should handle scroll positions', () => {
      drawRowLines(mockContext, 50, 100, 32, 1600, 800, mockTheme);
      drawColumnLines(mockContext, [mockColumn], 500, 1600, 800, 600, 0, 0, mockTheme, 50, 100, 32);
      expect(mockContext.stroke).toHaveBeenCalled();
    });
  });
});
