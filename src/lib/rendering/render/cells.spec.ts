import { afterEach, describe, expect, it, vi } from 'vitest';
import { ColDef, GridApi, ICellRendererParams, IRowNode } from '../../types/ag-grid-types';
import { clearCellRendererRegistry, registerCellRenderer } from './cell-renderer-registry';
import {
  getFormattedValue,
  getTextLineHeight,
  getValueByPath,
  resolveCellComponent,
  stripHtmlTags,
  usesComponentRenderer,
  wrapLines,
} from './cells';

/** A ctx whose measureText is deterministic: 10px per character. */
function measuringCtx(): CanvasRenderingContext2D {
  return { measureText: (s: string) => ({ width: s.length * 10 }) } as any;
}

/** A stand-in for an Angular component class — `isAngularComponent` checks `ɵcmp`. */
function fakeComponent(name: string): any {
  const cls = class {};
  (cls as any).ɵcmp = { name };
  return cls;
}

/** A GridApi whose `getGridOption('components')` returns the given map. */
function apiWithComponents(components?: Record<string, any>): GridApi {
  return { getGridOption: (key: string) => (key === 'components' ? components : undefined) } as any;
}

describe('cells.ts', () => {
  describe('stripHtmlTags', () => {
    it('should strip HTML tags from string', () => {
      expect(stripHtmlTags('<span>active</span>')).toBe('active');
      expect(stripHtmlTags('<div class="test">content</div>')).toBe('content');
    });

    it('should handle complex HTML', () => {
      const html =
        '<span style="color: green; padding: 4px 8px; background: green20; border-radius: 4px;">active</span>';
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

    afterEach(() => clearCellRendererRegistry());

    it('should return empty string for null/undefined', () => {
      expect(getFormattedValue(null, null, null as any, mockRowNode, mockApi)).toBe('');
      expect(getFormattedValue(undefined, null, null as any, mockRowNode, mockApi)).toBe('');
    });

    it('should use valueFormatter if provided', () => {
      const colDef = {
        valueFormatter: vi.fn((params) => `$${params.value}`),
      } as ColDef;

      const result = getFormattedValue(100, colDef, { salary: 100 }, mockRowNode, mockApi);
      expect(result).toBe('$100');
      expect(colDef.valueFormatter).toHaveBeenCalled();
    });

    it('should use cellRenderer and strip HTML tags', () => {
      const colDef = {
        cellRenderer: vi.fn((params) => `<span style="color: green">${params.value}</span>`),
      } as ColDef;

      const result = getFormattedValue(
        'active',
        colDef,
        { status: 'active' },
        mockRowNode,
        mockApi
      );
      expect(result).toBe('active'); // HTML stripped
      expect(colDef.cellRenderer).toHaveBeenCalled();
    });

    it('should handle cellRenderer returning plain text', () => {
      const colDef = {
        cellRenderer: vi.fn((params) => params.value.toUpperCase()),
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
        cellRenderer: vi.fn(() => {
          throw new Error('Renderer error');
        }),
      } as ColDef;

      const result = getFormattedValue('test', colDef, null as any, mockRowNode, mockApi);
      expect(result).toBe('test'); // Falls back to value
    });

    it('should handle valueFormatter errors gracefully', () => {
      const colDef = {
        valueFormatter: vi.fn(() => {
          throw new Error('Formatter error');
        }),
      } as ColDef;

      const result = getFormattedValue('test', colDef, null as any, mockRowNode, mockApi);
      expect(result).toBe('test'); // Falls back to value
    });

    it('resolves a named function renderer from the registry', () => {
      registerCellRenderer('upper', (p: any) => String(p.value).toUpperCase());
      const colDef = { cellRenderer: 'upper' } as ColDef;
      const result = getFormattedValue('hi', colDef, { v: 'hi' }, mockRowNode, mockApi);
      expect(result).toBe('HI');
    });

    it('leaves a built-in/unknown string name to the canvas (no resolution)', () => {
      // 'checkbox' is not registered — getFormattedValue must not try to call it
      // as a function, and falls through to String(value).
      const colDef = { cellRenderer: 'checkbox' } as ColDef;
      const result = getFormattedValue('x', colDef, { v: 'x' }, mockRowNode, mockApi);
      expect(result).toBe('x');
    });

    it('prefers gridOptions.components over the global registry', () => {
      registerCellRenderer('r', () => 'GLOBAL');
      const colDef = { cellRenderer: 'r' } as ColDef;
      const api = apiWithComponents({ r: () => 'LOCAL' });
      expect(getFormattedValue('v', colDef, {}, mockRowNode, api)).toBe('LOCAL');
    });
  });

  describe('named cell-renderer resolution', () => {
    afterEach(() => clearCellRendererRegistry());

    const params = (api: GridApi): ICellRendererParams => ({
      value: 1,
      data: {},
      node: {} as any,
      rowIndex: 0,
      colDef: {} as any,
      column: {} as any,
      api,
    });

    describe('usesComponentRenderer', () => {
      it('is true for a direct Angular component class', () => {
        expect(usesComponentRenderer({ cellRenderer: fakeComponent('C') } as ColDef)).toBe(true);
      });

      it('is true for a cellRendererSelector (opaque at column level)', () => {
        expect(usesComponentRenderer({ cellRendererSelector: () => ({}) } as ColDef)).toBe(true);
      });

      it('is true for a name that resolves to a component (global registry)', () => {
        registerCellRenderer('pill', fakeComponent('Pill'));
        expect(usesComponentRenderer({ cellRenderer: 'pill' } as ColDef)).toBe(true);
      });

      it('is true for a name that resolves to a component (per-grid components)', () => {
        const comp = fakeComponent('Pill');
        expect(usesComponentRenderer({ cellRenderer: 'pill' } as ColDef, { pill: comp })).toBe(
          true
        );
      });

      it('is false for a name that resolves to a plain function (canvas-drawn)', () => {
        registerCellRenderer('fn', () => 'x');
        expect(usesComponentRenderer({ cellRenderer: 'fn' } as ColDef)).toBe(false);
      });

      it('is false for a built-in/unknown string', () => {
        expect(usesComponentRenderer({ cellRenderer: 'checkbox' } as ColDef)).toBe(false);
      });

      it('is false for a null colDef', () => {
        expect(usesComponentRenderer(null)).toBe(false);
      });
    });

    describe('resolveCellComponent', () => {
      it('resolves a direct component class', () => {
        const comp = fakeComponent('C');
        expect(
          resolveCellComponent({ cellRenderer: comp } as ColDef, params(apiWithComponents()))
        ).toBe(comp);
      });

      it('resolves a named component from the global registry', () => {
        const comp = fakeComponent('Pill');
        registerCellRenderer('pill', comp);
        expect(
          resolveCellComponent({ cellRenderer: 'pill' } as ColDef, params(apiWithComponents()))
        ).toBe(comp);
      });

      it('resolves a named component from gridOptions.components, preferred over global', () => {
        const globalComp = fakeComponent('Global');
        const localComp = fakeComponent('Local');
        registerCellRenderer('pill', globalComp);
        expect(
          resolveCellComponent(
            { cellRenderer: 'pill' } as ColDef,
            params(apiWithComponents({ pill: localComp }))
          )
        ).toBe(localComp);
      });

      it('returns null for a name resolving to a function (canvas path handles it)', () => {
        registerCellRenderer('fn', () => 'x');
        expect(
          resolveCellComponent({ cellRenderer: 'fn' } as ColDef, params(apiWithComponents()))
        ).toBeNull();
      });

      it('resolves a component name returned by cellRendererSelector', () => {
        const comp = fakeComponent('Sel');
        registerCellRenderer('sel', comp);
        const colDef = { cellRendererSelector: () => ({ component: 'sel' }) } as ColDef;
        expect(resolveCellComponent(colDef, params(apiWithComponents()))).toBe(comp);
      });

      it('resolves a component class returned by cellRendererSelector', () => {
        const comp = fakeComponent('Sel');
        const colDef = { cellRendererSelector: () => ({ component: comp }) } as ColDef;
        expect(resolveCellComponent(colDef, params(apiWithComponents()))).toBe(comp);
      });

      it('returns null when the selector throws', () => {
        const colDef = {
          cellRendererSelector: () => {
            throw new Error('boom');
          },
        } as ColDef;
        expect(resolveCellComponent(colDef, params(apiWithComponents()))).toBeNull();
      });
    });
  });

  describe('text wrapping (auto-height)', () => {
    it('getTextLineHeight scales with font size', () => {
      expect(getTextLineHeight({ fontSize: 10 } as any)).toBe(14); // ceil(10 * 1.4)
      expect(getTextLineHeight({ fontSize: 13 } as any)).toBe(19); // ceil(13 * 1.4)
    });

    it('wraps on word boundaries to fit the width (10px/char)', () => {
      // 'hello'=50 fits 50; 'hello world'=110 doesn't → break before 'world'.
      expect(wrapLines(measuringCtx(), 'hello world', 50)).toEqual(['hello', 'world']);
    });

    it('keeps as many words per line as fit', () => {
      // width 120 fits 'aa bb' (50) but not 'aa bb cc' (80? 'aa bb cc'=8chars=80<=120) →
      // actually all fit on one line at 120.
      expect(wrapLines(measuringCtx(), 'aa bb cc', 120)).toEqual(['aa bb cc']);
      // width 50 only fits one 2-char word at a time ('aa bb'=50 fits, +cc=80>50).
      expect(wrapLines(measuringCtx(), 'aa bb cc', 50)).toEqual(['aa bb', 'cc']);
    });

    it('honors explicit newlines', () => {
      expect(wrapLines(measuringCtx(), 'a\nb', 100)).toEqual(['a', 'b']);
    });

    it('character-breaks a single word wider than the cell', () => {
      // 30px width = 3 chars per chunk.
      expect(wrapLines(measuringCtx(), 'abcdefgh', 30)).toEqual(['abc', 'def', 'gh']);
    });

    it('returns no lines for empty/null text', () => {
      expect(wrapLines(measuringCtx(), '', 100)).toEqual([]);
      expect(wrapLines(measuringCtx(), null as any, 100)).toEqual([]);
    });

    it('returns the whole string when width is non-positive', () => {
      expect(wrapLines(measuringCtx(), 'abc', 0)).toEqual(['abc']);
    });
  });
});
