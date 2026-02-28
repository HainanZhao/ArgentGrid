import { describe, it, expect, vi } from 'vitest';
import { getValueByPath, getFormattedValue, stripHtmlTags } from './cells';
import { GridApi, ColDef, IRowNode } from '../../types/ag-grid-types';

describe('cells.ts', () => {
  describe('stripHtmlTags', () => {
    it('should strip HTML tags from string', () => {
      expect(stripHtmlTags('<span>active</span>')).toBe('active');
      expect(stripHtmlTags('<div class="test">content</div>')).toBe('content');
    });

    it('should handle complex HTML', () => {
      const html = '<span style="color: green; padding: 4px 8px; background: green20; border-radius: 4px;">active</span>';
      expect(stripHtmlTags(html)).toBe('active');
    });

    it('should handle empty string', () => {
      expect(stripHtmlTags('')).toBe('');
    });

    it('should handle null/undefined', () => {
      expect(stripHtmlTags(null as any)).toBe('');
      expect(stripHtmlTags(undefined as any)).toBe('');
    });

    it('should handle plain text (no HTML)', () => {
      expect(stripHtmlTags('plain text')).toBe('plain text');
    });

    it('should handle multiple tags', () => {
      expect(stripHtmlTags('<strong><em>bold italic</em></strong>')).toBe('bold italic');
    });
  });

  describe('getValueByPath', () => {
    it('should get value from simple path', () => {
      const obj = { name: 'John', age: 30 };
      expect(getValueByPath(obj, 'name')).toBe('John');
      expect(getValueByPath(obj, 'age')).toBe(30);
    });

    it('should get value from nested path', () => {
      const obj = { user: { name: 'John', address: { city: 'NYC' } } };
      expect(getValueByPath(obj, 'user.name')).toBe('John');
      expect(getValueByPath(obj, 'user.address.city')).toBe('NYC');
    });

    it('should return undefined for missing path', () => {
      const obj = { name: 'John' };
      expect(getValueByPath(obj, 'age')).toBe(undefined);
      expect(getValueByPath(obj, 'address.city')).toBe(undefined);
    });

    it('should handle null/undefined objects', () => {
      expect(getValueByPath(null, 'name')).toBe(undefined);
      expect(getValueByPath(undefined, 'name')).toBe(undefined);
    });
  });

  describe('getFormattedValue', () => {
    const mockApi = {} as GridApi;
    const mockRowNode = { data: { name: 'John', age: 30 } } as IRowNode;

    it('should return empty string for null/undefined', () => {
      expect(getFormattedValue(null, null, null as any, mockRowNode, mockApi)).toBe('');
      expect(getFormattedValue(undefined, null, null as any, mockRowNode, mockApi)).toBe('');
    });

    it('should use valueFormatter if provided', () => {
      const colDef = {
        valueFormatter: vi.fn((params) => `$${params.value}`)
      } as ColDef;

      const result = getFormattedValue(100, colDef, { salary: 100 }, mockRowNode, mockApi);
      expect(result).toBe('$100');
      expect(colDef.valueFormatter).toHaveBeenCalled();
    });

    it('should use cellRenderer and strip HTML tags', () => {
      const colDef = {
        cellRenderer: vi.fn((params) => `<span style="color: green">${params.value}</span>`)
      } as ColDef;

      const result = getFormattedValue('active', colDef, { status: 'active' }, mockRowNode, mockApi);
      expect(result).toBe('active'); // HTML stripped
      expect(colDef.cellRenderer).toHaveBeenCalled();
    });

    it('should handle cellRenderer returning plain text', () => {
      const colDef = {
        cellRenderer: vi.fn((params) => params.value.toUpperCase())
      } as ColDef;

      const result = getFormattedValue('hello', colDef, { text: 'hello' }, mockRowNode, mockApi);
      expect(result).toBe('HELLO');
    });

    it('should convert value to string if no formatter/renderer', () => {
      const result = getFormattedValue(123, null, null as any, mockRowNode, mockApi);
      expect(result).toBe('123');
    });

    it('should handle cellRenderer errors gracefully', () => {
      const colDef = {
        cellRenderer: vi.fn(() => { throw new Error('Renderer error'); })
      } as ColDef;

      const result = getFormattedValue('test', colDef, null as any, mockRowNode, mockApi);
      expect(result).toBe('test'); // Falls back to value
    });

    it('should handle valueFormatter errors gracefully', () => {
      const colDef = {
        valueFormatter: vi.fn(() => { throw new Error('Formatter error'); })
      } as ColDef;

      const result = getFormattedValue('test', colDef, null as any, mockRowNode, mockApi);
      expect(result).toBe('test'); // Falls back to value
    });
  });
});
