import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getValueByPath,
  prepColumn,
  prepColumns,
  drawCell,
  drawCellBackground,
  drawCellContent,
  drawGroupIndicators,
  formatNumber,
  formatCurrency,
  formatDate,
  formatPercentage,
  getCellAlignment,
  getCellBackgroundColor,
  getCellTextColor,
  truncateText
} from './cells';
import { Column, IRowNode, ColDef, GridApi } from '../types/ag-grid-types';
import { CellDrawContext, ColumnPrepResult, GridTheme } from './types';
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

const mockColumn: Column = {
  colId: 'test',
  field: 'test',
  headerName: 'Test',
  width: 100,
  pinned: false,
  visible: true,
  sort: null
};

const mockColDef: ColDef = {
  colId: 'test',
  field: 'test',
  headerName: 'Test',
  width: 100
};

const mockRowNode: IRowNode = {
  id: '1',
  data: { test: 'value' },
  rowHeight: 32,
  rowPinned: null,
  displayed: true,
  group: false,
  level: 0,
  selected: false,
  expanded: false,
  master: false,
  grouped: false,
  allChildrenCount: 0,
  uiLevel: 0,
  tooltip: null,
  childIndex: 0,
  firstChild: false,
  lastChild: false,
  rowIndex: 0
};

const mockContext = {
  font: '13px sans-serif',
  fillStyle: '#000',
  strokeStyle: '#000',
  clearRect: vi.fn(),
  fillRect: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  stroke: vi.fn(),
  fillText: vi.fn(),
  measureText: vi.fn((text: string) => ({ width: text.length * 7 })),
  clip: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
  arc: vi.fn(),
  closePath: vi.fn(),
  setTransform: vi.fn(),
  scale: vi.fn(),
  translate: vi.fn(),
  createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() }))
} as unknown as CanvasRenderingContext2D;

describe('cells.ts', () => {
  describe('getValueByPath', () => {
    it('should get simple property value', () => {
      const obj = { name: 'John' };
      expect(getValueByPath(obj, 'name')).toBe('John');
    });

    it('should get nested property value', () => {
      const obj = { user: { name: 'John' } };
      expect(getValueByPath(obj, 'user.name')).toBe('John');
    });

    it('should handle deep nesting', () => {
      const obj = { a: { b: { c: { d: 'deep' } } } };
      expect(getValueByPath(obj, 'a.b.c.d')).toBe('deep');
    });

    it('should return undefined for missing path', () => {
      const obj = { name: 'John' };
      expect(getValueByPath(obj, 'missing')).toBeUndefined();
    });

    it('should return undefined for null object', () => {
      expect(getValueByPath(null, 'name')).toBeUndefined();
    });

    it('should return undefined for undefined path', () => {
      const obj = { name: 'John' };
      expect(getValueByPath(obj, undefined as any)).toBeUndefined();
    });

    it('should handle empty path', () => {
      const obj = { name: 'John' };
      expect(getValueByPath(obj, '')).toBeUndefined();
    });
  });

  describe('prepColumn', () => {
    it('should prepare column for rendering', () => {
      const result = prepColumn(mockContext, mockColumn, mockColDef, mockTheme);
      expect(result.column).toBe(mockColumn);
      expect(result.colDef).toBe(mockColDef);
      expect(result.theme).toBe(mockTheme);
      expect(result.font).toBeTruthy();
    });

    it('should handle null colDef', () => {
      const result = prepColumn(mockContext, mockColumn, null, mockTheme);
      expect(result.colDef).toBeNull();
    });
  });

  describe('prepColumns', () => {
    it('should prepare multiple columns', () => {
      const columns = [mockColumn];
      const getColDef = vi.fn(() => mockColDef);
      const results = prepColumns(mockContext, columns, getColDef, mockTheme);
      expect(results.size).toBe(1);
      expect(results.has('test')).toBe(true);
    });

    it('should handle empty columns array', () => {
      const results = prepColumns(mockContext, [], vi.fn(), mockTheme);
      expect(results.size).toBe(0);
    });
  });

  describe('drawCellBackground', () => {
    it('should draw cell background', () => {
      const context: CellDrawContext = {
        x: 0, y: 0, width: 100, height: 32,
        value: 'test', formattedValue: 'test',
        column: mockColumn, rowNode: mockRowNode,
        theme: mockTheme, isSelected: false,
        isHovered: false, isEvenRow: true,
        isPinned: false, isHeader: false
      };
      drawCellBackground(mockContext, context);
      expect(mockContext.fillRect).toHaveBeenCalled();
    });

    it('should draw selected cell background', () => {
      const context: CellDrawContext = {
        x: 0, y: 0, width: 100, height: 32,
        value: 'test', formattedValue: 'test',
        column: mockColumn, rowNode: mockRowNode,
        theme: mockTheme, isSelected: true,
        isHovered: false, isEvenRow: true,
        isPinned: false, isHeader: false
      };
      drawCellBackground(mockContext, context);
      expect(mockContext.fillRect).toHaveBeenCalled();
    });

    it('should draw hovered cell background', () => {
      const context: CellDrawContext = {
        x: 0, y: 0, width: 100, height: 32,
        value: 'test', formattedValue: 'test',
        column: mockColumn, rowNode: mockRowNode,
        theme: mockTheme, isSelected: false,
        isHovered: true, isEvenRow: true,
        isPinned: false, isHeader: false
      };
      drawCellBackground(mockContext, context);
    });
  });

  describe('drawCellContent', () => {
    it('should draw text content', () => {
      const context: CellDrawContext = {
        x: 0, y: 0, width: 100, height: 32,
        value: 'test', formattedValue: 'test',
        column: mockColumn, rowNode: mockRowNode,
        theme: mockTheme, isSelected: false,
        isHovered: false, isEvenRow: true,
        isPinned: false, isHeader: false
      };
      const prep: ColumnPrepResult = {
        column: mockColumn, colDef: mockColDef,
        theme: mockTheme, font: '13px sans-serif'
      };
      drawCellContent(mockContext, prep, context);
      expect(mockContext.fillText).toHaveBeenCalled();
    });

    it('should draw numeric content', () => {
      const context: CellDrawContext = {
        x: 0, y: 0, width: 100, height: 32,
        value: 123, formattedValue: '123',
        column: mockColumn, rowNode: mockRowNode,
        theme: mockTheme, isSelected: false,
        isHovered: false, isEvenRow: true,
        isPinned: false, isHeader: false
      };
      const prep: ColumnPrepResult = {
        column: mockColumn, colDef: mockColDef,
        theme: mockTheme, font: '13px sans-serif'
      };
      drawCellContent(mockContext, prep, context);
    });

    it('should handle null value', () => {
      const context: CellDrawContext = {
        x: 0, y: 0, width: 100, height: 32,
        value: null, formattedValue: '',
        column: mockColumn, rowNode: mockRowNode,
        theme: mockTheme, isSelected: false,
        isHovered: false, isEvenRow: true,
        isPinned: false, isHeader: false
      };
      const prep: ColumnPrepResult = {
        column: mockColumn, colDef: mockColDef,
        theme: mockTheme, font: '13px sans-serif'
      };
      drawCellContent(mockContext, prep, context);
    });
  });

  describe('drawGroupIndicators', () => {
    it('should draw group indicators for grouped rows', () => {
      const groupedNode: IRowNode = {
        ...mockRowNode,
        group: true,
        level: 1,
        expanded: true
      };
      const context: CellDrawContext = {
        x: 0, y: 0, width: 100, height: 32,
        value: 'test', formattedValue: 'test',
        column: mockColumn, rowNode: groupedNode,
        theme: mockTheme, isSelected: false,
        isHovered: false, isEvenRow: true,
        isPinned: false, isHeader: false
      };
      const prep: ColumnPrepResult = {
        column: mockColumn, colDef: mockColDef,
        theme: mockTheme, font: '13px sans-serif'
      };
      drawGroupIndicators(mockContext, prep, context);
      expect(mockContext.beginPath).toHaveBeenCalled();
    });

    it('should handle collapsed groups', () => {
      const groupedNode: IRowNode = {
        ...mockRowNode,
        group: true,
        level: 1,
        expanded: false
      };
      const context: CellDrawContext = {
        x: 0, y: 0, width: 100, height: 32,
        value: 'test', formattedValue: 'test',
        column: mockColumn, rowNode: groupedNode,
        theme: mockTheme, isSelected: false,
        isHovered: false, isEvenRow: true,
        isPinned: false, isHeader: false
      };
      const prep: ColumnPrepResult = {
        column: mockColumn, colDef: mockColDef,
        theme: mockTheme, font: '13px sans-serif'
      };
      drawGroupIndicators(mockContext, prep, context);
    });
  });

  describe('drawCell', () => {
    it('should draw complete cell', () => {
      const context: CellDrawContext = {
        x: 0, y: 0, width: 100, height: 32,
        value: 'test', formattedValue: 'test',
        column: mockColumn, rowNode: mockRowNode,
        theme: mockTheme, isSelected: false,
        isHovered: false, isEvenRow: true,
        isPinned: false, isHeader: false
      };
      const prep: ColumnPrepResult = {
        column: mockColumn, colDef: mockColDef,
        theme: mockTheme, font: '13px sans-serif'
      };
      drawCell(mockContext, prep, context);
      expect(mockContext.fillRect).toHaveBeenCalled();
      expect(mockContext.fillText).toHaveBeenCalled();
    });
  });

  describe('formatNumber', () => {
    it('should format number', () => {
      expect(formatNumber(1234.567)).toBe('1,234.57');
    });

    it('should format integer', () => {
      expect(formatNumber(1234)).toBe('1,234');
    });

    it('should handle negative numbers', () => {
      expect(formatNumber(-1234.5)).toBe('-1,234.5');
    });

    it('should handle zero', () => {
      expect(formatNumber(0)).toBe('0');
    });

    it('should handle null', () => {
      expect(formatNumber(null)).toBe('');
    });

    it('should handle undefined', () => {
      expect(formatNumber(undefined)).toBe('');
    });
  });

  describe('formatCurrency', () => {
    it('should format currency', () => {
      expect(formatCurrency(1234.56)).toBe('$1,234.56');
    });

    it('should format negative currency', () => {
      expect(formatCurrency(-1234.56)).toBe('-$1,234.56');
    });

    it('should handle zero currency', () => {
      expect(formatCurrency(0)).toBe('$0.00');
    });

    it('should handle null', () => {
      expect(formatCurrency(null)).toBe('');
    });
  });

  describe('formatDate', () => {
    it('should format date string', () => {
      const result = formatDate('2024-01-15');
      expect(result).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
    });

    it('should format Date object', () => {
      const date = new Date('2024-01-15');
      const result = formatDate(date);
      expect(result).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
    });

    it('should handle null', () => {
      expect(formatDate(null)).toBe('');
    });

    it('should handle invalid date', () => {
      expect(formatDate('invalid')).toBe('Invalid Date');
    });
  });

  describe('formatPercentage', () => {
    it('should format percentage', () => {
      expect(formatPercentage(0.75)).toBe('75.00%');
    });

    it('should format percentage over 100', () => {
      expect(formatPercentage(1.5)).toBe('150.00%');
    });

    it('should handle zero', () => {
      expect(formatPercentage(0)).toBe('0.00%');
    });

    it('should handle null', () => {
      expect(formatPercentage(null)).toBe('');
    });
  });

  describe('getCellAlignment', () => {
    it('should get left alignment for text', () => {
      const colDef: ColDef = { field: 'name', type: 'text' };
      expect(getCellAlignment(colDef)).toBe('left');
    });

    it('should get right alignment for numbers', () => {
      const colDef: ColDef = { field: 'age', type: 'number' };
      expect(getCellAlignment(colDef)).toBe('right');
    });

    it('should get center alignment', () => {
      const colDef: ColDef = { field: 'status', cellClass: 'text-center' };
      expect(getCellAlignment(colDef)).toBe('center');
    });

    it('should default to left', () => {
      const colDef: ColDef = { field: 'test' };
      expect(getCellAlignment(colDef)).toBe('left');
    });
  });

  describe('getCellBackgroundColor', () => {
    it('should get background color from colDef', () => {
      const colDef: ColDef = { field: 'test', cellStyle: { backgroundColor: '#ff0000' } };
      expect(getCellBackgroundColor(colDef, mockRowNode, 0)).toBe('#ff0000');
    });

    it('should get background color from rowNode', () => {
      const node: IRowNode = {
        ...mockRowNode,
        rowStyle: { backgroundColor: '#00ff00' }
      };
      expect(getCellBackgroundColor(null, node, 0)).toBe('#00ff00');
    });

    it('should get background color from callback', () => {
      const colDef: ColDef = {
        field: 'test',
        cellClassRules: { 'red-bg': (params: any) => true }
      };
      expect(getCellBackgroundColor(colDef, mockRowNode, 0)).toBe('');
    });

    it('should return default for even rows', () => {
      expect(getCellBackgroundColor(null, mockRowNode, 0)).toBe(mockTheme.rowBackgroundColor);
    });

    it('should return alternate for odd rows', () => {
      expect(getCellBackgroundColor(null, mockRowNode, 1)).toBe(mockTheme.rowAltBackgroundColor || mockTheme.rowBackgroundColor);
    });
  });

  describe('getCellTextColor', () => {
    it('should get text color from colDef', () => {
      const colDef: ColDef = { field: 'test', cellStyle: { color: '#ff0000' } };
      expect(getCellTextColor(colDef, mockRowNode)).toBe('#ff0000');
    });

    it('should get text color from rowNode', () => {
      const node: IRowNode = {
        ...mockRowNode,
        rowStyle: { color: '#00ff00' }
      };
      expect(getCellTextColor(null, node)).toBe('#00ff00');
    });

    it('should return default text color', () => {
      expect(getCellTextColor(null, mockRowNode)).toBe(mockTheme.textColor);
    });
  });

  describe('truncateText', () => {
    it('should truncate long text', () => {
      const result = truncateText('This is a very long text', 100, mockContext);
      expect(result.length).toBeLessThanOrEqual('This is a very long text'.length);
    });

    it('should not truncate short text', () => {
      const text = 'Short';
      const result = truncateText(text, 100, mockContext);
      expect(result).toBe(text);
    });

    it('should handle empty text', () => {
      expect(truncateText('', 100, mockContext)).toBe('');
    });

    it('should handle null text', () => {
      expect(truncateText(null as any, 100, mockContext)).toBe('');
    });

    it('should add ellipsis when truncating', () => {
      const longText = 'This is a very long text that should be truncated';
      const result = truncateText(longText, 50, mockContext);
      expect(result).toBeTruthy();
    });
  });
});
