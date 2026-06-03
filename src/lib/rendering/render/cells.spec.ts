import { afterEach, describe, expect, it, vi } from 'vitest';
import { ColDef, GridApi, ICellRendererParams, IRowNode } from '../../types/ag-grid-types';
import { clearCellRendererRegistry, registerCellRenderer } from './cell-renderer-registry';
import {
  drawCellBackground,
  drawCellContent,
  getFormattedValue,
  getTextLineHeight,
  getValueByPath,
  hasConditionalStyle,
  NO_CELL_STYLE,
  resolveCellComponent,
  resolveCellEditor,
  resolveCellPaintStyle,
  resolveFilterComponent,
  resolveHeaderComponent,
  stripHtmlTags,
  usesComponentRenderer,
  wrapLines,
} from './cells';
import { DEFAULT_THEME } from './theme';

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

    describe('resolveCellEditor', () => {
      it('resolves a direct cellEditor component class', () => {
        const comp = fakeComponent('Editor');
        expect(
          resolveCellEditor({ cellEditor: comp } as ColDef, params(apiWithComponents())).component
        ).toBe(comp);
      });

      it('resolves a named cellEditor (global registry + per-grid components)', () => {
        const globalComp = fakeComponent('G');
        const localComp = fakeComponent('L');
        registerCellRenderer('ed', globalComp);
        expect(
          resolveCellEditor({ cellEditor: 'ed' } as ColDef, params(apiWithComponents())).component
        ).toBe(globalComp);
        expect(
          resolveCellEditor(
            { cellEditor: 'ed' } as ColDef,
            params(apiWithComponents({ ed: localComp }))
          ).component
        ).toBe(localComp);
      });

      it('returns null component for a non-component cellEditor (built-in text editor)', () => {
        expect(
          resolveCellEditor(
            { cellEditor: 'agTextCellEditor' } as ColDef,
            params(apiWithComponents())
          ).component
        ).toBeNull();
        expect(resolveCellEditor({} as ColDef, params(apiWithComponents())).component).toBeNull();
      });

      it('resolves component + params from a cellEditorSelector', () => {
        const comp = fakeComponent('Sel');
        const colDef = {
          cellEditorSelector: () => ({ component: comp, params: { values: [1, 2] } }),
        } as ColDef;
        const res = resolveCellEditor(colDef, params(apiWithComponents()));
        expect(res.component).toBe(comp);
        expect(res.params).toEqual({ values: [1, 2] });
      });

      it('resolves a registered name returned by cellEditorSelector', () => {
        const comp = fakeComponent('SelName');
        registerCellRenderer('selEd', comp);
        const colDef = { cellEditorSelector: () => ({ component: 'selEd' }) } as ColDef;
        expect(resolveCellEditor(colDef, params(apiWithComponents())).component).toBe(comp);
      });

      it('returns null component when the selector throws', () => {
        const colDef = {
          cellEditorSelector: () => {
            throw new Error('boom');
          },
        } as ColDef;
        expect(resolveCellEditor(colDef, params(apiWithComponents())).component).toBeNull();
      });
    });

    describe('resolveHeaderComponent', () => {
      it('resolves a direct headerComponent class', () => {
        const comp = fakeComponent('Header');
        expect(
          resolveHeaderComponent({ headerComponent: comp } as ColDef, apiWithComponents())
        ).toBe(comp);
      });

      it('resolves a named headerComponent (global registry + per-grid, per-grid wins)', () => {
        const globalComp = fakeComponent('G');
        const localComp = fakeComponent('L');
        registerCellRenderer('hdr', globalComp);
        expect(
          resolveHeaderComponent({ headerComponent: 'hdr' } as ColDef, apiWithComponents())
        ).toBe(globalComp);
        expect(
          resolveHeaderComponent(
            { headerComponent: 'hdr' } as ColDef,
            apiWithComponents({ hdr: localComp })
          )
        ).toBe(localComp);
      });

      it('returns null when no headerComponent is set', () => {
        expect(resolveHeaderComponent({} as ColDef, apiWithComponents())).toBeNull();
        expect(resolveHeaderComponent(null, apiWithComponents())).toBeNull();
      });

      it('returns null for a name that does not resolve to a component', () => {
        registerCellRenderer('fn', () => 'x');
        expect(
          resolveHeaderComponent({ headerComponent: 'fn' } as ColDef, apiWithComponents())
        ).toBeNull();
        expect(
          resolveHeaderComponent({ headerComponent: 'unknown' } as ColDef, apiWithComponents())
        ).toBeNull();
      });

      it('returns null for a column group def', () => {
        const groupDef = { children: [], headerComponent: fakeComponent('X') } as any;
        expect(resolveHeaderComponent(groupDef, apiWithComponents())).toBeNull();
      });
    });

    describe('resolveFilterComponent', () => {
      it('resolves a direct filter component class', () => {
        const comp = fakeComponent('Filter');
        expect(resolveFilterComponent({ filter: comp } as ColDef, apiWithComponents())).toBe(comp);
      });

      it('resolves a named filter (global registry + per-grid, per-grid wins)', () => {
        const globalComp = fakeComponent('G');
        const localComp = fakeComponent('L');
        registerCellRenderer('flt', globalComp);
        expect(resolveFilterComponent({ filter: 'flt' } as ColDef, apiWithComponents())).toBe(
          globalComp
        );
        expect(
          resolveFilterComponent({ filter: 'flt' } as ColDef, apiWithComponents({ flt: localComp }))
        ).toBe(localComp);
      });

      it('returns null for built-in filter identifiers and booleans', () => {
        for (const f of ['text', 'number', 'date', 'set', 'boolean', 'agTextColumnFilter', true]) {
          expect(resolveFilterComponent({ filter: f } as ColDef, apiWithComponents())).toBeNull();
        }
      });

      it('returns null when no filter is set or for a column group', () => {
        expect(resolveFilterComponent({} as ColDef, apiWithComponents())).toBeNull();
        expect(resolveFilterComponent(null, apiWithComponents())).toBeNull();
        expect(
          resolveFilterComponent(
            { children: [], filter: fakeComponent('X') } as any,
            apiWithComponents()
          )
        ).toBeNull();
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

  describe('resolveCellPaintStyle (conditional cell styling)', () => {
    const node = { data: { qty: -5 } } as IRowNode;
    const column = { colId: 'qty' } as any;
    const params = { value: -5, data: node.data, node, column, api: {} as GridApi };

    it('returns the shared empty style (no allocation) for plain columns', () => {
      const result = resolveCellPaintStyle({ field: 'qty' } as ColDef, params, undefined);
      expect(result).toBe(NO_CELL_STYLE);
      expect(hasConditionalStyle({ field: 'qty' } as ColDef)).toBe(false);
    });

    it('paints a cellClassRules class via the grid-level cellClassStyles map', () => {
      const colDef = {
        field: 'qty',
        cellClassRules: { negative: (p: any) => p.value < 0 },
      } as ColDef;
      const grid = { negative: { color: 'red', fontWeight: 'bold' } };
      expect(resolveCellPaintStyle(colDef, params, grid)).toEqual({
        color: 'red',
        fontWeight: 'bold',
      });
    });

    it('does not paint a rule whose predicate is false', () => {
      const colDef = {
        field: 'qty',
        cellClassRules: { negative: (p: any) => p.value > 0 },
      } as ColDef;
      expect(resolveCellPaintStyle(colDef, params, { negative: { color: 'red' } })).toBe(
        NO_CELL_STYLE
      );
    });

    it('maps a static cellClass (string and array forms)', () => {
      const grid = { hot: { backgroundColor: 'orange' }, big: { fontWeight: '600' } };
      expect(
        resolveCellPaintStyle({ field: 'qty', cellClass: 'hot' } as ColDef, params, grid)
      ).toEqual({ backgroundColor: 'orange' });
      expect(
        resolveCellPaintStyle({ field: 'qty', cellClass: ['hot', 'big'] } as ColDef, params, grid)
      ).toEqual({ backgroundColor: 'orange', fontWeight: '600' });
    });

    it('lets colDef.cellClassStyles override the grid-level map for the same class', () => {
      const colDef = {
        field: 'qty',
        cellClass: 'flag',
        cellClassStyles: { flag: { color: 'green' } },
      } as ColDef;
      const grid = { flag: { color: 'red' } };
      expect(resolveCellPaintStyle(colDef, params, grid)).toEqual({ color: 'green' });
    });

    it('lets cellStyle win over class-derived styles (inline-style semantics)', () => {
      const colDef = {
        field: 'qty',
        cellClassRules: { negative: () => true },
        cellStyle: { color: 'blue', background: '#eee' },
      } as ColDef;
      const grid = { negative: { color: 'red', fontWeight: 'bold' } };
      // class supplies fontWeight; cellStyle overrides color and adds background.
      expect(resolveCellPaintStyle(colDef, params, grid)).toEqual({
        color: 'blue',
        fontWeight: 'bold',
        backgroundColor: '#eee',
      });
    });

    it('reads backgroundColor/fontStyle from a function cellStyle and ignores unpaintable props', () => {
      const colDef = {
        field: 'qty',
        cellStyle: () => ({ backgroundColor: 'yellow', fontStyle: 'italic', border: '1px solid' }),
      } as ColDef;
      expect(resolveCellPaintStyle(colDef, params, undefined)).toEqual({
        backgroundColor: 'yellow',
        fontStyle: 'italic',
      });
    });

    it('returns the empty style when an active class has no entry in any map', () => {
      const colDef = { field: 'qty', cellClass: 'unmapped' } as ColDef;
      expect(resolveCellPaintStyle(colDef, params, { other: { color: 'red' } })).toBe(
        NO_CELL_STYLE
      );
    });
  });

  describe('conditional styling — draw pipeline', () => {
    /** A ctx that records the fillStyle/font in effect at each paint call. */
    function recordingCtx() {
      const fills: { kind: 'rect' | 'text'; fillStyle: string; font: string }[] = [];
      const ctx: any = {
        _fillStyle: '',
        _font: '',
        set fillStyle(v: string) {
          this._fillStyle = v;
        },
        get fillStyle() {
          return this._fillStyle;
        },
        set font(v: string) {
          this._font = v;
        },
        get font() {
          return this._font;
        },
        textBaseline: '',
        measureText: (s: string) => ({ width: s.length * 6 }),
        fillRect() {
          fills.push({ kind: 'rect', fillStyle: this._fillStyle, font: this._font });
        },
        fillText() {
          fills.push({ kind: 'text', fillStyle: this._fillStyle, font: this._font });
        },
      };
      return { ctx, fills };
    }

    function ctxOf(theme = DEFAULT_THEME, extra: Partial<any> = {}) {
      return {
        theme,
        column: { colId: 'qty' },
        colDef: { field: 'qty' },
        rowNode: { data: { qty: -5 } },
        rowIndex: 1,
        x: 0,
        y: 0,
        width: 100,
        height: 24,
        value: -5,
        formattedValue: '-5',
        isSelected: false,
        isHovered: false,
        isEvenRow: false,
        api: {} as GridApi,
        ...extra,
      } as any;
    }

    it('paints the conditional background when not selected/hovered', () => {
      const { ctx, fills } = recordingCtx();
      drawCellBackground(ctx, ctxOf(), { backgroundColor: '#ffcccc' });
      expect(fills[0]).toMatchObject({ kind: 'rect', fillStyle: '#ffcccc' });
    });

    it('lets selection win over the conditional background', () => {
      const { ctx, fills } = recordingCtx();
      drawCellBackground(ctx, ctxOf(DEFAULT_THEME, { isSelected: true }), {
        backgroundColor: '#ffcccc',
      });
      expect(fills[0].fillStyle).toBe(DEFAULT_THEME.bgSelection);
    });

    it('applies the conditional text color and bold font, then restores the column font', () => {
      const { ctx, fills } = recordingCtx();
      const prep = { font: 'base-font' } as any;
      ctx.font = 'base-font';
      drawCellContent(ctx, prep, ctxOf(), { color: '#c00', fontWeight: 'bold' });
      const text = fills.find((f) => f.kind === 'text')!;
      expect(text.fillStyle).toBe('#c00');
      expect(text.font).toContain('bold');
      // restored for the next cell in the row
      expect(ctx.font).toBe('base-font');
    });

    it('leaves the column font untouched when no weight/style override is given', () => {
      const { ctx, fills } = recordingCtx();
      const prep = { font: 'base-font' } as any;
      ctx.font = 'base-font';
      drawCellContent(ctx, prep, ctxOf(), { color: '#c00' });
      expect(fills.find((f) => f.kind === 'text')!.font).toBe('base-font');
      expect(ctx.font).toBe('base-font');
    });
  });
});
