import {
  Component,
  inject,
  provideExperimentalZonelessChangeDetection,
  ViewContainerRef,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import type {
  Column,
  GridApi,
  ICellRendererAngularComp,
  ICellRendererParams,
  IRowNode,
  OverlayLayout,
} from '../types/ag-grid-types';
import { CellOverlayManager } from './cell-overlay-manager';
import { resolveCellComponent } from './render/cells';

// ---------------------------------------------------------------------------
// Test doubles
// ---------------------------------------------------------------------------

/** Every instance registers itself so tests can assert on lifecycle hooks. */
const instances: TestRenderer[] = [];

@Component({ standalone: true, template: `<span class="val">{{ text }}</span>` })
class TestRenderer implements ICellRendererAngularComp {
  text = '';
  agInitCount = 0;
  refreshCount = 0;

  constructor() {
    instances.push(this);
  }

  // Render both the keyed value AND a second data field, so tests can prove a
  // refresh happens when only the non-keyed field changed.
  private render(params: ICellRendererParams): void {
    this.text = `${String(params.value)}/${(params.data as any)?.label ?? ''}`;
  }

  agInit(params: ICellRendererParams): void {
    this.agInitCount++;
    this.render(params);
  }

  refresh(params: ICellRendererParams): boolean {
    this.refreshCount++;
    this.render(params);
    return true;
  }
}

/** Host that simply exposes a real ViewContainerRef for the manager to use. */
@Component({ standalone: true, template: '' })
class HostComponent {
  vcr = inject(ViewContainerRef);
}

function makeColumn(colId: string, width = 150): Column {
  return { colId, field: colId, width } as unknown as Column;
}

function makeNode(id: string, data: any): IRowNode {
  return { id, data, group: false } as unknown as IRowNode;
}

/**
 * Mock GridApi backed by a mutable `rowsByIndex` map so tests can simulate a
 * sort/filter (the node living at a given display index changes).
 */
function makeApi(rowsByIndex: Map<number, IRowNode>, columnsById: Map<string, Column>): GridApi {
  return {
    getColumn: (id: string | Column) =>
      columnsById.get(typeof id === 'string' ? id : id.colId) ?? null,
    getDisplayedRowAtIndex: (i: number) => rowsByIndex.get(i) ?? null,
    getGridOption: () => undefined,
  } as unknown as GridApi;
}

function layout(
  columns: Column[],
  rowCount: number,
  opts: { scrollTop?: number; dataChanged?: boolean; rowHeight?: number } = {}
): OverlayLayout {
  return {
    startRow: 0,
    endRow: rowCount,
    scrollTop: opts.scrollTop ?? 0,
    rowHeight: opts.rowHeight ?? 32,
    dataChanged: opts.dataChanged ?? true,
    columns: columns.map((c) => ({
      colId: c.colId,
      x: 0,
      width: c.width || 150,
      isPinned: false,
    })),
  };
}

function visibleHosts(container: HTMLElement): HTMLElement[] {
  return Array.from(container.children).filter(
    (el) => (el as HTMLElement).style.display !== 'none'
  ) as HTMLElement[];
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('CellOverlayManager (claude)', () => {
  let vcr: ViewContainerRef;
  let container: HTMLElement;

  beforeEach(async () => {
    instances.length = 0;
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideExperimentalZonelessChangeDetection()],
    }).compileComponents();
    const fixture = TestBed.createComponent(HostComponent);
    vcr = fixture.componentInstance.vcr;
    container = document.createElement('div');
  });

  function makeManager(
    rowsByIndex: Map<number, IRowNode>,
    columnsById: Map<string, Column>,
    colDef: any
  ): CellOverlayManager {
    return new CellOverlayManager({
      container,
      gridApi: makeApi(rowsByIndex, columnsById),
      viewContainerRef: vcr,
      getColDef: () => colDef,
    });
  }

  it('mounts a DOM component for a component-renderer column', () => {
    const col = makeColumn('status');
    const colDef = { field: 'status', cellRenderer: TestRenderer };
    const rows = new Map([[0, makeNode('a', { status: 'Active' })]]);
    const mgr = makeManager(rows, new Map([['status', col]]), colDef);

    mgr.sync(layout([col], 1));

    const hosts = visibleHosts(container);
    expect(hosts).toHaveLength(1);
    expect(hosts[0].textContent).toContain('Active');
    expect(instances).toHaveLength(1);
    expect(instances[0].agInitCount).toBe(1);

    mgr.destroy();
  });

  it('does NOT mount anything for a plain (non-component) column', () => {
    const col = makeColumn('status');
    // A string-returning function renderer is NOT an Angular component.
    const colDef = { field: 'status', cellRenderer: () => 'plain' };
    const rows = new Map([[0, makeNode('a', { status: 'Active' })]]);
    const mgr = makeManager(rows, new Map([['status', col]]), colDef);

    mgr.sync(layout([col], 1));

    expect(visibleHosts(container)).toHaveLength(0);
    expect(instances).toHaveLength(0);

    mgr.destroy();
  });

  it('clip-paths a center overlay cell that overflows under a pinned column', () => {
    const col = makeColumn('status', 150);
    const colDef = { field: 'status', cellRenderer: TestRenderer };
    const rows = new Map([[0, makeNode('a', { status: 'Active' })]]);
    const mgr = makeManager(rows, new Map([['status', col]]), colDef);

    // Center region [100, 400]; the cell sits at x=50 → 50px hangs under the
    // left-pinned area and must be clipped away, nothing clipped on the right.
    mgr.sync({
      startRow: 0,
      endRow: 1,
      scrollTop: 0,
      rowHeight: 32,
      dataChanged: true,
      centerClip: { left: 100, right: 400 },
      columns: [{ colId: 'status', x: 50, width: 150, isPinned: false }],
    });

    expect(visibleHosts(container)[0].style.clipPath).toBe('inset(0 0px 0 50px)');
    mgr.destroy();
  });

  it('does not clip a center overlay cell fully inside the center region', () => {
    const col = makeColumn('status', 150);
    const colDef = { field: 'status', cellRenderer: TestRenderer };
    const rows = new Map([[0, makeNode('a', { status: 'Active' })]]);
    const mgr = makeManager(rows, new Map([['status', col]]), colDef);

    mgr.sync({
      startRow: 0,
      endRow: 1,
      scrollTop: 0,
      rowHeight: 32,
      dataChanged: true,
      centerClip: { left: 100, right: 400 },
      columns: [{ colId: 'status', x: 150, width: 150, isPinned: false }],
    });

    expect(visibleHosts(container)[0].style.clipPath).toBe('');
    mgr.destroy();
  });

  it('never clips a pinned overlay cell', () => {
    const col = makeColumn('status', 100);
    const colDef = { field: 'status', cellRenderer: TestRenderer };
    const rows = new Map([[0, makeNode('a', { status: 'Active' })]]);
    const mgr = makeManager(rows, new Map([['status', col]]), colDef);

    // Pinned cell sits in the pinned area (x < centerClip.left) but must NOT be
    // clipped — pinned cells legitimately live outside the center region.
    mgr.sync({
      startRow: 0,
      endRow: 1,
      scrollTop: 0,
      rowHeight: 32,
      dataChanged: true,
      centerClip: { left: 100, right: 400 },
      columns: [{ colId: 'status', x: 0, width: 100, isPinned: true }],
    });

    expect(visibleHosts(container)[0].style.clipPath).toBe('');
    mgr.destroy();
  });

  it('refreshes value in place after a sort changes the node at a row index', () => {
    const col = makeColumn('status');
    const colDef = { field: 'status', cellRenderer: TestRenderer };
    const rows = new Map([[0, makeNode('a', { status: 'A' })]]);
    const mgr = makeManager(rows, new Map([['status', col]]), colDef);

    mgr.sync(layout([col], 1));
    expect(visibleHosts(container)[0].textContent).toContain('A');
    expect(instances).toHaveLength(1);

    // Simulate a sort: index 0 now resolves to a different node/value.
    rows.set(0, makeNode('b', { status: 'B' }));
    mgr.sync(layout([col], 1));

    // The very bug glm51 had: stale content. Here the cell must show 'B'.
    const hosts = visibleHosts(container);
    expect(hosts).toHaveLength(1);
    expect(hosts[0].textContent).toContain('B');
    // Same pooled instance reused via refresh(), not re-created.
    expect(instances).toHaveLength(1);
    expect(instances[0].agInitCount).toBe(1);
    expect(instances[0].refreshCount).toBeGreaterThanOrEqual(1);

    mgr.destroy();
  });

  it('re-binds a cell on a data-change frame even when the keyed value is unchanged', () => {
    const col = makeColumn('status');
    const colDef = { field: 'status', cellRenderer: TestRenderer };
    // Same node, same `value`, but a different (non-keyed) data field changes.
    const node = makeNode('a', { status: 'A', label: 'L1' });
    const rows = new Map([[0, node]]);
    const mgr = makeManager(rows, new Map([['status', col]]), colDef);

    mgr.sync(layout([col], 1, { dataChanged: true }));
    expect(visibleHosts(container)[0].textContent).toContain('A/L1');

    // Mutate a non-keyed field in place (as an edit/transaction would).
    (node.data as any).label = 'L2';

    // A pure scroll frame (dataChanged:false) must NOT refresh — bindingKey
    // is unchanged (same node id + value), so it's a cheap reposition.
    mgr.sync(layout([col], 1, { dataChanged: false }));
    expect(visibleHosts(container)[0].textContent).toContain('A/L1');

    // A data-change frame must re-bind and pick up the new field.
    mgr.sync(layout([col], 1, { dataChanged: true }));
    expect(visibleHosts(container)[0].textContent).toContain('A/L2');
    expect(instances[0].refreshCount).toBeGreaterThanOrEqual(1);

    mgr.destroy();
  });

  it('skips group and master-detail rows', () => {
    const col = makeColumn('status');
    const colDef = { field: 'status', cellRenderer: TestRenderer };
    const groupNode = { id: 'g', data: {}, group: true } as unknown as IRowNode;
    const detailNode = { id: 'd', data: {}, detail: true } as unknown as IRowNode;
    const leafNode = makeNode('leaf', { status: 'Active' });
    const rows = new Map([
      [0, groupNode],
      [1, detailNode],
      [2, leafNode],
    ]);
    const mgr = makeManager(rows, new Map([['status', col]]), colDef);

    mgr.sync({ ...layout([col], 3), startRow: 0, endRow: 3 });

    // Only the leaf row gets an overlay; group/detail rows are skipped.
    expect(visibleHosts(container)).toHaveLength(1);
    expect(visibleHosts(container)[0].textContent).toContain('Active');

    mgr.destroy();
  });

  it('sizes the host to the row variable height', () => {
    const col = makeColumn('status');
    const colDef = { field: 'status', cellRenderer: TestRenderer };
    const node = {
      id: 'a',
      data: { status: 'A' },
      group: false,
      rowHeight: 64,
    } as unknown as IRowNode;
    const rows = new Map([[0, node]]);
    const mgr = makeManager(rows, new Map([['status', col]]), colDef);

    mgr.sync(layout([col], 1, { rowHeight: 32 }));

    // Host height follows node.rowHeight (64), not the layout/theme height (32).
    expect(visibleHosts(container)[0].style.height).toBe('64px');

    mgr.destroy();
  });

  it('recycles cells that scroll out of view (no leaked visible hosts)', () => {
    const col = makeColumn('status');
    const colDef = { field: 'status', cellRenderer: TestRenderer };
    const rows = new Map([
      [0, makeNode('r0', { status: 'Row0' })],
      [1, makeNode('r1', { status: 'Row1' })],
    ]);
    const mgr = makeManager(rows, new Map([['status', col]]), colDef);

    mgr.sync(layout([col], 2));
    expect(visibleHosts(container)).toHaveLength(2);

    // Scroll so only one row remains in the rendered window.
    const scrolled: OverlayLayout = { ...layout([col], 1), startRow: 1, endRow: 2 };
    mgr.sync(scrolled);

    // One visible host; the other is recycled (hidden in the pool), not leaked.
    expect(visibleHosts(container)).toHaveLength(1);

    mgr.destroy();
  });

  it('hideCell hides a single cell across re-syncs; showAll reveals it', () => {
    const col = makeColumn('status');
    const colDef = { field: 'status', cellRenderer: TestRenderer };
    const rows = new Map([[0, makeNode('a', { status: 'Active' })]]);
    const mgr = makeManager(rows, new Map([['status', col]]), colDef);

    mgr.sync(layout([col], 1));
    expect(visibleHosts(container)).toHaveLength(1);

    mgr.hideCell(0, 'status');
    expect(visibleHosts(container)).toHaveLength(0);

    // A re-sync (e.g. canvas repaint) must NOT reveal the edited cell.
    mgr.sync(layout([col], 1));
    expect(visibleHosts(container)).toHaveLength(0);

    mgr.showAll();
    expect(visibleHosts(container)).toHaveLength(1);

    mgr.destroy();
  });

  it('destroy() tears down all hosts', () => {
    const col = makeColumn('status');
    const colDef = { field: 'status', cellRenderer: TestRenderer };
    const rows = new Map([[0, makeNode('a', { status: 'Active' })]]);
    const mgr = makeManager(rows, new Map([['status', col]]), colDef);

    mgr.sync(layout([col], 1));
    expect(container.children.length).toBeGreaterThan(0);

    mgr.destroy();
    expect(container.children.length).toBe(0);
  });
});

describe('resolveCellComponent (canvas/overlay shared decision)', () => {
  @Component({ standalone: true, template: '' })
  class Comp implements ICellRendererAngularComp {
    agInit(): void {}
  }
  const params = { value: 1 } as unknown as ICellRendererParams;

  it('resolves a static Angular cellRenderer component', () => {
    expect(resolveCellComponent({ cellRenderer: Comp } as any, params)).toBe(Comp);
  });

  it('returns null for a string renderer and a plain function renderer', () => {
    expect(resolveCellComponent({ cellRenderer: 'agTextCellRenderer' } as any, params)).toBeNull();
    expect(resolveCellComponent({ cellRenderer: () => 'x' } as any, params)).toBeNull();
  });

  it('resolves a cellRendererSelector that returns an Angular component', () => {
    const colDef = { cellRendererSelector: () => ({ component: Comp }) } as any;
    expect(resolveCellComponent(colDef, params)).toBe(Comp);
  });

  it('returns null when the selector picks a non-Angular component or undefined (so the canvas still draws)', () => {
    expect(
      resolveCellComponent({ cellRendererSelector: () => ({ component: 'agText' }) } as any, params)
    ).toBeNull();
    expect(
      resolveCellComponent({ cellRendererSelector: () => undefined } as any, params)
    ).toBeNull();
  });

  it('returns null (does not throw) when the selector throws', () => {
    const colDef = {
      cellRendererSelector: () => {
        throw new Error('boom');
      },
    } as any;
    expect(resolveCellComponent(colDef, params)).toBeNull();
  });
});
