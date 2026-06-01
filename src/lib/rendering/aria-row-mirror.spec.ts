import { beforeEach, describe, expect, it } from 'vitest';
import type { Column, GridApi, IRowNode, OverlayLayout } from '../types/ag-grid-types';
import { AriaRowMirror } from './aria-row-mirror';

// ---------------------------------------------------------------------------
// Test doubles
// ---------------------------------------------------------------------------

function makeColumn(colId: string, extra: Partial<Column> = {}): Column {
  return { colId, field: colId, width: 150, visible: true, ...extra } as unknown as Column;
}

function makeNode(id: string, data: any, extra: Partial<IRowNode> = {}): IRowNode {
  return {
    id,
    data,
    group: false,
    selected: false,
    expanded: false,
    ...extra,
  } as unknown as IRowNode;
}

/**
 * Mock GridApi backed by mutable maps so tests can simulate sort/scroll and
 * column changes. `allColumns` order drives the absolute aria-colindex.
 */
function makeApi(
  rowsByIndex: Map<number, IRowNode>,
  allColumns: Column[],
  gridOptions: Record<string, any> = {},
  headerDepth = 1
): GridApi {
  const byId = new Map(allColumns.map((c) => [c.colId, c]));
  return {
    getGridId: () => 'g',
    getAllColumns: () => allColumns,
    getColumn: (id: string | Column) => byId.get(typeof id === 'string' ? id : id.colId) ?? null,
    getDisplayedRowAtIndex: (i: number) => rowsByIndex.get(i) ?? null,
    getDisplayedRowCount: () => rowsByIndex.size,
    getHeaderDepth: () => headerDepth,
    getGridOption: (key: string) => gridOptions[key],
  } as unknown as GridApi;
}

function layout(
  columns: Column[],
  startRow: number,
  endRow: number,
  opts: { dataChanged?: boolean } = {}
): OverlayLayout {
  return {
    startRow,
    endRow,
    scrollTop: 0,
    rowHeight: 32,
    viewportWidth: 800,
    dataChanged: opts.dataChanged ?? true,
    columns: columns.map((c) => ({ colId: c.colId, x: 0, width: c.width || 150, isPinned: false })),
  };
}

function rows(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll('[role="row"]')) as HTMLElement[];
}
function cells(rowEl: HTMLElement): HTMLElement[] {
  return Array.from(rowEl.querySelectorAll('[role="gridcell"]')) as HTMLElement[];
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AriaRowMirror (claude)', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
  });

  function makeMirror(
    rowsByIndex: Map<number, IRowNode>,
    allColumns: Column[],
    gridOptions: Record<string, any> = {},
    headerDepth = 1
  ): AriaRowMirror {
    return new AriaRowMirror({
      container,
      gridApi: makeApi(rowsByIndex, allColumns, gridOptions, headerDepth),
      getColDef: (col) => allColumns.find((c) => c.colId === col.colId) as any,
      headerRowCount: () => headerDepth,
    });
  }

  it('mirrors visible rows with role=row and a header-offset aria-rowindex', () => {
    const cols = [makeColumn('a'), makeColumn('b')];
    const data = new Map([
      [0, makeNode('r0', { a: 'A0', b: 'B0' })],
      [1, makeNode('r1', { a: 'A1', b: 'B1' })],
    ]);
    const mirror = makeMirror(data, cols);

    mirror.sync(layout(cols, 0, 2));

    const r = rows(container);
    expect(r).toHaveLength(2);
    // headerDepth (1) rows precede; ARIA is 1-based → row 0 => index 2.
    expect(r[0].getAttribute('aria-rowindex')).toBe('2');
    expect(r[1].getAttribute('aria-rowindex')).toBe('3');
    expect(r[0].id).toBe('g-arow-r0');

    mirror.destroy();
  });

  it('emits role=gridcell per column with formatted text and 1-based aria-colindex', () => {
    const cols = [
      makeColumn('price', { valueFormatter: (p: any) => `$${p.value}` } as any),
      makeColumn('name'),
    ];
    const data = new Map([[0, makeNode('r0', { price: 10, name: 'Widget' })]]);
    const mirror = makeMirror(data, cols);

    mirror.sync(layout(cols, 0, 1));

    const c = cells(rows(container)[0]);
    expect(c).toHaveLength(2);
    expect(c[0].getAttribute('aria-colindex')).toBe('1');
    expect(c[0].textContent).toBe('$10'); // proves getFormattedValue is used
    expect(c[1].getAttribute('aria-colindex')).toBe('2');
    expect(c[1].textContent).toBe('Widget');
    expect(c[0].id).toBe('g-acell-r0-price');

    mirror.destroy();
  });

  it('uses the FULL column order for aria-colindex even when columns scroll off the left', () => {
    const all = [makeColumn('a'), makeColumn('b'), makeColumn('c')];
    const data = new Map([[0, makeNode('r0', { a: 'A', b: 'B', c: 'C' })]]);
    const mirror = makeMirror(data, all);

    // Window shows only b and c (a is scrolled off): colindex must be 2 and 3.
    mirror.sync(layout([all[1], all[2]], 0, 1));

    const c = cells(rows(container)[0]);
    expect(c.map((x) => x.getAttribute('aria-colindex'))).toEqual(['2', '3']);
    expect(c.map((x) => x.textContent)).toEqual(['B', 'C']);

    mirror.destroy();
  });

  it('sets aria-selected only when row selection is enabled', () => {
    const cols = [makeColumn('a')];
    const data = new Map([[0, makeNode('r0', { a: 'A' }, { selected: true })]]);

    const off = makeMirror(data, cols, {});
    off.sync(layout(cols, 0, 1));
    expect(rows(container)[0].hasAttribute('aria-selected')).toBe(false);
    off.destroy();

    container = document.createElement('div');
    const on = makeMirror(data, cols, { rowSelection: 'multiple' });
    on.sync(layout(cols, 0, 1));
    expect(rows(container)[0].getAttribute('aria-selected')).toBe('true');
    on.destroy();
  });

  it('renders a group row as a single gridcell with aria-expanded', () => {
    const cols = [makeColumn('a'), makeColumn('b')];
    const group = makeNode(
      'grp',
      { 'ag-Grid-AutoColumn': 'East' },
      { group: true, expanded: true, allLeafChildren: [1, 2, 3] as any }
    );
    const data = new Map([[0, group]]);
    const mirror = makeMirror(data, cols);

    mirror.sync(layout(cols, 0, 1));

    const r = rows(container)[0];
    expect(r.getAttribute('aria-expanded')).toBe('true');
    const c = cells(r);
    expect(c).toHaveLength(1);
    expect(c[0].getAttribute('aria-colindex')).toBe('1');
    expect(c[0].textContent).toBe('East (3)');

    mirror.destroy();
  });

  it('renders a detail row as a single gridcell and never aria-expanded', () => {
    const cols = [makeColumn('a')];
    const detail = makeNode('d', {}, { detail: true } as any);
    const data = new Map([[0, detail]]);
    const mirror = makeMirror(data, cols);

    mirror.sync(layout(cols, 0, 1));

    const r = rows(container)[0];
    expect(r.hasAttribute('aria-expanded')).toBe(false);
    expect(cells(r)).toHaveLength(1);
    expect(cells(r)[0].textContent).toBe('Detail row');

    mirror.destroy();
  });

  it('recycles rows that scroll out of view and reuses the element', () => {
    const cols = [makeColumn('a')];
    const data = new Map([
      [0, makeNode('r0', { a: 'A0' })],
      [1, makeNode('r1', { a: 'A1' })],
    ]);
    const mirror = makeMirror(data, cols);

    mirror.sync(layout(cols, 0, 2));
    expect(rows(container)).toHaveLength(2);
    const firstEl = rows(container)[0];

    // Scroll so only row index 1 remains visible.
    mirror.sync(layout(cols, 1, 2));
    expect(rows(container)).toHaveLength(1);
    expect(rows(container)[0].id).toBe('g-arow-r1');

    // Scrolling row 0 back in should reuse the pooled element (no leak).
    mirror.sync(layout(cols, 0, 2));
    const r = rows(container);
    expect(r).toHaveLength(2);
    expect(r.includes(firstEl)).toBe(true);

    mirror.destroy();
  });

  it('updates text after a sort changes the node at a row index', () => {
    const cols = [makeColumn('a')];
    const data = new Map([[0, makeNode('r0', { a: 'first' })]]);
    const mirror = makeMirror(data, cols);

    mirror.sync(layout(cols, 0, 1));
    expect(cells(rows(container)[0])[0].textContent).toBe('first');

    // Sort: index 0 now resolves to a different node.
    data.set(0, makeNode('r9', { a: 'second' }));
    mirror.sync(layout(cols, 0, 1));
    expect(cells(rows(container)[0])[0].textContent).toBe('second');

    mirror.destroy();
  });

  it('reuses the same cell element across an unchanged scroll frame (no DOM churn)', () => {
    const cols = [makeColumn('a')];
    const node = makeNode('r0', { a: 'A' });
    const data = new Map([[0, node]]);
    const mirror = makeMirror(data, cols);

    mirror.sync(layout(cols, 0, 1, { dataChanged: true }));
    const cell = cells(rows(container)[0])[0];

    // A pure scroll frame with nothing changed must keep the same element
    // (binding-key guard skips the rewrite) and the same correct text.
    mirror.sync(layout(cols, 0, 1, { dataChanged: false }));
    expect(cells(rows(container)[0])[0]).toBe(cell);
    expect(cell.textContent).toBe('A');

    mirror.destroy();
  });

  it('drops gridcells for columns no longer in the window on horizontal scroll', () => {
    const all = [makeColumn('a'), makeColumn('b'), makeColumn('c')];
    const data = new Map([[0, makeNode('r0', { a: 'A', b: 'B', c: 'C' })]]);
    const mirror = makeMirror(data, all);

    mirror.sync(layout([all[0], all[1]], 0, 1));
    expect(cells(rows(container)[0]).map((c) => c.textContent)).toEqual(['A', 'B']);

    // Scroll right: window now b, c.
    mirror.sync(layout([all[1], all[2]], 0, 1));
    expect(cells(rows(container)[0]).map((c) => c.textContent)).toEqual(['B', 'C']);

    mirror.destroy();
  });

  it('getActiveDescendantId returns the computed cell id for a displayed row, null otherwise', () => {
    const cols = [makeColumn('a')];
    const data = new Map([[0, makeNode('r0', { a: 'A' })]]);
    const mirror = makeMirror(data, cols);

    // Deterministic — does NOT require a prior sync to have mounted the cell.
    expect(mirror.getActiveDescendantId(0, 'a')).toBe('g-acell-r0-a');
    expect(mirror.getActiveDescendantId(5, 'a')).toBeNull(); // no such displayed row

    mirror.destroy();
  });

  it('destroy() removes all mirror nodes from the container', () => {
    const cols = [makeColumn('a')];
    const data = new Map([[0, makeNode('r0', { a: 'A' })]]);
    const mirror = makeMirror(data, cols);

    mirror.sync(layout(cols, 0, 1));
    expect(container.children.length).toBeGreaterThan(0);

    mirror.destroy();
    expect(container.children.length).toBe(0);
  });
});
