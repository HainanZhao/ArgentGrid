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

  agInit(params: ICellRendererParams): void {
    this.agInitCount++;
    this.text = String(params.value);
  }

  refresh(params: ICellRendererParams): boolean {
    this.refreshCount++;
    this.text = String(params.value);
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

function layout(columns: Column[], rowCount: number, scrollTop = 0): OverlayLayout {
  return {
    startRow: 0,
    endRow: rowCount,
    scrollTop,
    rowHeight: 32,
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
