/**
 * Unit tests for the Infinite Row Model (T3.1).
 *
 * Covers block math, lazy fetch + placeholders, row-count growth/pinning,
 * concurrency capping + queueing, LRU eviction, fail/retry, sort/filter purge,
 * and destroy.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { IRowNode } from '../types/ag-grid-types';
import {
  DEFAULT_INFINITE_CONFIG,
  InfiniteRowModel,
  InfiniteRowModelConfig,
} from './infinite-row-model';

interface Row {
  id: number;
  name: string;
}

/** A datasource whose requests are resolved manually by the test. */
function controllableDatasource() {
  const requests: {
    startRow: number;
    endRow: number;
    sortModel: any[];
    filterModel: any;
    success: (rows: Row[], lastRow?: number) => void;
    fail: () => void;
  }[] = [];
  return {
    requests,
    getRows(params: any) {
      requests.push({
        startRow: params.startRow,
        endRow: params.endRow,
        sortModel: params.sortModel,
        filterModel: params.filterModel,
        success: params.successCallback,
        fail: params.failCallback,
      });
    },
    /** Resolve a pending request with a full/short block of synthetic rows. */
    resolve(reqIndex: number, count: number, lastRow?: number) {
      const req = requests[reqIndex];
      const rows: Row[] = [];
      for (let i = 0; i < count; i++) {
        const id = req.startRow + i;
        rows.push({ id, name: `row-${id}` });
      }
      req.success(rows, lastRow);
    },
    destroy: vi.fn(),
  };
}

const makeRowNode = (data: Row, index: number): IRowNode<Row> =>
  ({
    id: String(data.id),
    data,
    rowIndex: index,
    displayedRowIndex: index,
    selected: false,
  }) as IRowNode<Row>;

function build(
  ds: ReturnType<typeof controllableDatasource>,
  config: Partial<InfiniteRowModelConfig> = {}
) {
  const onBlocksLoaded = vi.fn();
  const model = new InfiniteRowModel<Row>(
    ds as any,
    { ...DEFAULT_INFINITE_CONFIG, cacheBlockSize: 10, ...config },
    { makeRowNode, onBlocksLoaded }
  );
  return { model, onBlocksLoaded };
}

describe('InfiniteRowModel', () => {
  let ds: ReturnType<typeof controllableDatasource>;
  beforeEach(() => {
    ds = controllableDatasource();
  });

  describe('block math', () => {
    it('maps absolute indices to block numbers', () => {
      const { model } = build(ds, { cacheBlockSize: 10 });
      expect(model.blockNumberForIndex(0)).toBe(0);
      expect(model.blockNumberForIndex(9)).toBe(0);
      expect(model.blockNumberForIndex(10)).toBe(1);
      expect(model.blockNumberForIndex(25)).toBe(2);
    });
  });

  describe('lazy fetch + placeholders', () => {
    it('requests the containing block on first access and returns a placeholder', () => {
      const { model } = build(ds, { cacheBlockSize: 10 });
      const node = model.getRow(3);
      expect((node as any).__loading).toBe(true);
      expect(ds.requests).toHaveLength(1);
      expect(ds.requests[0]).toMatchObject({ startRow: 0, endRow: 10 });
    });

    it('does not re-request a block already loading', () => {
      const { model } = build(ds, { cacheBlockSize: 10 });
      model.getRow(0);
      model.getRow(5);
      model.getRow(9);
      expect(ds.requests).toHaveLength(1);
    });

    it('returns the loaded node after the block resolves', () => {
      const { model, onBlocksLoaded } = build(ds, { cacheBlockSize: 10 });
      model.getRow(3);
      ds.resolve(0, 10, 10);
      const node = model.getRow(3);
      expect((node as any).__loading).toBeUndefined();
      expect(node.data).toEqual({ id: 3, name: 'row-3' });
      expect(onBlocksLoaded).toHaveBeenCalled();
    });

    it('requests a different block when scrolling past the first', () => {
      const { model } = build(ds, { cacheBlockSize: 10 });
      model.getRow(0);
      model.getRow(15); // block 1
      expect(ds.requests).toHaveLength(2);
      expect(ds.requests[1]).toMatchObject({ startRow: 10, endRow: 20 });
    });
  });

  describe('row count growth and pinning', () => {
    it('starts at infiniteInitialRowCount', () => {
      const { model } = build(ds, { infiniteInitialRowCount: 1 });
      expect(model.getRowCount()).toBe(1);
      expect(model.isLastRowKnown()).toBe(false);
    });

    it('pins the count when lastRow is provided', () => {
      const { model } = build(ds, { cacheBlockSize: 10 });
      model.getRow(0);
      ds.resolve(0, 10, 42);
      expect(model.getRowCount()).toBe(42);
      expect(model.isLastRowKnown()).toBe(true);
    });

    it('grows with headroom for a full block when total is unknown', () => {
      const { model } = build(ds, { cacheBlockSize: 10, cacheOverflowSize: 1 });
      model.getRow(0);
      ds.resolve(0, 10); // full block, no lastRow
      // loadedEnd (10) + overflow (1 * 10) = 20
      expect(model.getRowCount()).toBe(20);
      expect(model.isLastRowKnown()).toBe(false);
    });

    it('treats a short block as the final one', () => {
      const { model } = build(ds, { cacheBlockSize: 10 });
      model.getRow(0);
      ds.resolve(0, 7); // short block
      expect(model.getRowCount()).toBe(7);
      expect(model.isLastRowKnown()).toBe(true);
    });
  });

  describe('concurrency', () => {
    it('caps in-flight requests and queues the rest', () => {
      const { model } = build(ds, { cacheBlockSize: 10, maxConcurrentDatasourceRequests: 2 });
      model.getRow(0); // block 0
      model.getRow(10); // block 1
      model.getRow(20); // block 2 — queued
      expect(ds.requests).toHaveLength(2);

      // Resolving one in-flight request frees a slot for the queued block.
      ds.resolve(0, 10);
      expect(ds.requests).toHaveLength(3);
      expect(ds.requests[2]).toMatchObject({ startRow: 20, endRow: 30 });
    });
  });

  describe('LRU eviction', () => {
    it('evicts the least-recently-accessed loaded block beyond the cap', () => {
      const { model } = build(ds, {
        cacheBlockSize: 10,
        maxBlocksInCache: 2,
        maxConcurrentDatasourceRequests: 10,
      });
      // Load blocks 0, 1, 2.
      model.getRow(0);
      model.getRow(10);
      model.getRow(20);
      ds.resolve(0, 10);
      ds.resolve(1, 10);
      // Touch block 0 so block 1 becomes least-recently-used.
      model.getRow(0);
      ds.resolve(2, 10); // triggers eviction (3 loaded > cap 2)

      // Block 1 (LRU) evicted → re-access refetches it.
      const before = ds.requests.length;
      model.getRow(15);
      expect(ds.requests.length).toBe(before + 1);
      // Block 0 retained (recently accessed) → no new request.
      const after = ds.requests.length;
      model.getRow(5);
      expect(ds.requests.length).toBe(after);
    });
  });

  describe('failure + retry', () => {
    it('marks a failed block and retries it on next access', () => {
      const { model } = build(ds, { cacheBlockSize: 10 });
      model.getRow(0);
      ds.requests[0].fail();
      // Re-access retries the fetch.
      const node = model.getRow(0);
      expect((node as any).__loading).toBe(true);
      expect(ds.requests).toHaveLength(2);
    });
  });

  describe('sort / filter purge', () => {
    it('purges the cache and refetches block 0 with the new sort model', () => {
      const { model } = build(ds, { cacheBlockSize: 10 });
      model.getRow(0);
      ds.resolve(0, 10, 100);
      expect(model.getRowCount()).toBe(100);

      model.setSortModel([{ colId: 'name', sort: 'asc' }]);
      expect(model.getRowCount()).toBe(1); // reset to initial
      expect(model.isLastRowKnown()).toBe(false);

      // Next access refetches with the sort model applied.
      model.getRow(0);
      const last = ds.requests[ds.requests.length - 1];
      expect(last.startRow).toBe(0);
      expect(last.sortModel).toEqual([{ colId: 'name', sort: 'asc' }]);
    });

    it('forwards the filter model to the datasource after a purge', () => {
      const { model } = build(ds, { cacheBlockSize: 10 });
      model.setFilterModel({ name: { type: 'contains', filter: 'a' } } as any);
      model.getRow(0);
      const last = ds.requests[ds.requests.length - 1];
      expect(last.filterModel).toEqual({ name: { type: 'contains', filter: 'a' } });
    });

    it('drops stale in-flight results from before a purge', () => {
      const { model } = build(ds, { cacheBlockSize: 10 });
      model.getRow(0);
      model.purge();
      // Resolving the pre-purge request must not populate the cache.
      ds.resolve(0, 10, 100);
      expect(model.getRowCount()).toBe(1);
      const node = model.getRow(0);
      expect((node as any).__loading).toBe(true);
    });
  });

  describe('lookup helpers', () => {
    it('finds a loaded node by id and lists loaded nodes in order', () => {
      const { model } = build(ds, { cacheBlockSize: 10, maxConcurrentDatasourceRequests: 10 });
      model.getRow(0);
      model.getRow(10);
      ds.resolve(1, 10); // block 1 first
      ds.resolve(0, 10); // then block 0
      expect(model.getRowNodeById('12')?.data).toEqual({ id: 12, name: 'row-12' });
      const loaded = model.getLoadedNodes();
      expect(loaded[0].data.id).toBe(0);
      expect(loaded[loaded.length - 1].data.id).toBe(19);
    });
  });

  describe('destroy', () => {
    it('destroys the datasource and clears state', () => {
      const { model } = build(ds, { cacheBlockSize: 10 });
      model.getRow(0);
      ds.resolve(0, 10, 10);
      model.destroy();
      expect(ds.destroy).toHaveBeenCalled();
      expect(model.getRowNodeById('0')).toBeNull();
    });
  });
});
