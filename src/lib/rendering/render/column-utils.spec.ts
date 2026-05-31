import { describe, expect, it } from 'vitest';
import type { ColDef, Column, GridApi } from '../../types/ag-grid-types';
import { getColumnDef } from './column-utils';

// ---------------------------------------------------------------------------
// getColumnDef is the SINGLE resolver shared by the canvas (renderer prep, for
// its "is this a component cell I should NOT paint?" skip decision) and the DOM
// cell overlay (for its "should I mount a component here?" decision). If the two
// ever resolved a column to different ColDefs they could leave a cell blank
// (canvas skipped, overlay didn't mount) or double-drawn. These tests pin the
// matching + defaultColDef-merge behavior both sides depend on.
// ---------------------------------------------------------------------------

function makeColumn(partial: Partial<Column>): Column {
  return partial as unknown as Column;
}

function makeApi(defs: (ColDef | { children: ColDef[] })[], defaultColDef?: ColDef): GridApi {
  return {
    getColumnDefs: () => defs,
    getGridOption: (name: string) => (name === 'defaultColDef' ? defaultColDef : undefined),
  } as unknown as GridApi;
}

describe('getColumnDef (shared canvas/overlay colDef resolver)', () => {
  it('matches a leaf def by colId', () => {
    const def: ColDef = { colId: 'status', field: 'status' };
    const resolved = getColumnDef(makeColumn({ colId: 'status', field: 'status' }), makeApi([def]));
    expect(resolved?.field).toBe('status');
  });

  it('matches by field when the column colId differs from the field (the #6 divergence case)', () => {
    // A column whose colId ('a') is distinct from its field ('b'), and a def
    // declared only by field. The previous overlay resolver collapsed the column
    // to colId || field || groupId === 'a' and failed to match a field-only def,
    // while the canvas matched it by field — yielding a permanently blank cell.
    // The shared resolver must match here so both sides agree.
    const def: ColDef = { field: 'b', cellRenderer: () => 'x' };
    const resolved = getColumnDef(makeColumn({ colId: 'a', field: 'b' }), makeApi([def]));
    expect(resolved).not.toBeNull();
    expect(resolved?.field).toBe('b');
  });

  it('finds a def nested inside a column group', () => {
    const child: ColDef = { colId: 'salary', field: 'salary' };
    const resolved = getColumnDef(
      makeColumn({ colId: 'salary', field: 'salary' }),
      makeApi([{ children: [child] }])
    );
    expect(resolved?.colId).toBe('salary');
  });

  it('merges defaultColDef beneath the matched def (so the canvas honors it like the overlay)', () => {
    const def: ColDef = { colId: 'status', field: 'status' };
    const resolved = getColumnDef(
      makeColumn({ colId: 'status', field: 'status' }),
      makeApi([def], { sortable: true, resizable: true })
    );
    expect(resolved?.sortable).toBe(true);
    expect(resolved?.resizable).toBe(true);
  });

  it('lets an explicit per-column property win over defaultColDef', () => {
    const def: ColDef = { colId: 'status', field: 'status', sortable: false };
    const resolved = getColumnDef(
      makeColumn({ colId: 'status', field: 'status' }),
      makeApi([def], { sortable: true })
    );
    expect(resolved?.sortable).toBe(false);
  });

  it('returns null when no def matches', () => {
    const def: ColDef = { colId: 'status', field: 'status' };
    const resolved = getColumnDef(
      makeColumn({ colId: 'missing', field: 'missing' }),
      makeApi([def])
    );
    expect(resolved).toBeNull();
  });
});
