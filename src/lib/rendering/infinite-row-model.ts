/**
 * Infinite Row Model
 *
 * Lazy, block-loading row model for `rowModelType: 'infinite'`. Rows are fetched
 * from an {@link IDatasource} one block at a time as they scroll into view; the
 * canvas render loop pulls each visible row through {@link getRow}, which returns
 * a loaded node or a "loading" placeholder and schedules the containing block's
 * fetch on demand. Sort/filter are delegated to the datasource (the cache is
 * purged and reloaded on change). Mirrors AG Grid's infinite row model.
 */

import {
  FilterModel,
  IDatasource,
  IGetRowsParams,
  IRowNode,
  SortModelItem,
} from '../types/ag-grid-types';

/** A node flagged while its block is still loading (used for loading visuals). */
export type LoadingRowNode<TData> = IRowNode<TData> & { __loading?: boolean };

export interface InfiniteRowModelConfig {
  cacheBlockSize: number;
  maxBlocksInCache: number | null;
  cacheOverflowSize: number;
  infiniteInitialRowCount: number;
  maxConcurrentDatasourceRequests: number;
}

export interface InfiniteRowModelDeps<TData> {
  /** Builds a real row node from fetched data at an absolute row index. */
  makeRowNode(data: TData, index: number): IRowNode<TData>;
  /** Called whenever blocks load / the row count changes → triggers a repaint. */
  onBlocksLoaded(): void;
  /** Arbitrary context forwarded to the datasource (`gridOptions.context`). */
  context?: any;
}

type BlockState = 'loading' | 'loaded' | 'failed';

interface Block<TData> {
  state: BlockState;
  nodes: IRowNode<TData>[];
  /** Monotonic access stamp for LRU eviction. */
  lastAccess: number;
}

export const DEFAULT_INFINITE_CONFIG: InfiniteRowModelConfig = {
  cacheBlockSize: 100,
  maxBlocksInCache: null,
  cacheOverflowSize: 1,
  infiniteInitialRowCount: 1,
  maxConcurrentDatasourceRequests: 2,
};

export class InfiniteRowModel<TData = any> {
  private blocks = new Map<number, Block<TData>>();
  private queue: number[] = [];
  private inFlight = 0;
  /** Bumped on every purge so stale in-flight callbacks can be dropped. */
  private generation = 0;
  private accessSeq = 0;

  private rowCount: number;
  private lastRowKnown = false;

  private sortModel: SortModelItem[] = [];
  private filterModel: FilterModel = {};

  constructor(
    private datasource: IDatasource<TData>,
    private readonly config: InfiniteRowModelConfig,
    private readonly deps: InfiniteRowModelDeps<TData>
  ) {
    this.rowCount = Math.max(1, config.infiniteInitialRowCount);
  }

  /** Block index for an absolute row index. */
  blockNumberForIndex(index: number): number {
    return Math.floor(index / this.config.cacheBlockSize);
  }

  /** Current (estimated, then exact once `lastRow` is known) total row count. */
  getRowCount(): number {
    return this.rowCount;
  }

  isLastRowKnown(): boolean {
    return this.lastRowKnown;
  }

  /**
   * Return the node at an absolute index, scheduling its block's fetch if not
   * yet loaded. Returns a loading placeholder until the block arrives.
   */
  getRow(index: number): IRowNode<TData> {
    if (index < 0) return this.placeholder(index);
    const blockNumber = this.blockNumberForIndex(index);
    let block = this.blocks.get(blockNumber);

    if (!block) {
      block = { state: 'loading', nodes: [], lastAccess: ++this.accessSeq };
      this.blocks.set(blockNumber, block);
      this.enqueue(blockNumber);
    } else {
      block.lastAccess = ++this.accessSeq;
      if (block.state === 'failed') {
        block.state = 'loading';
        this.enqueue(blockNumber);
      }
    }

    if (block.state === 'loaded') {
      const offset = index - blockNumber * this.config.cacheBlockSize;
      return block.nodes[offset] ?? this.placeholder(index);
    }
    return this.placeholder(index);
  }

  /** Find a loaded node by id (the infinite-mode `getRowNode`). */
  getRowNodeById(id: string): IRowNode<TData> | null {
    for (const block of this.blocks.values()) {
      if (block.state !== 'loaded') continue;
      const found = block.nodes.find((n) => n.id === id);
      if (found) return found;
    }
    return null;
  }

  /** All currently-loaded nodes, in row order. */
  getLoadedNodes(): IRowNode<TData>[] {
    const out: IRowNode<TData>[] = [];
    const sorted = [...this.blocks.entries()].sort((a, b) => a[0] - b[0]);
    for (const [, block] of sorted) {
      if (block.state === 'loaded') out.push(...block.nodes);
    }
    return out;
  }

  setSortModel(model: SortModelItem[]): void {
    this.sortModel = model;
    this.purge();
  }

  setFilterModel(model: FilterModel): void {
    this.filterModel = model;
    this.purge();
  }

  /** Drop all blocks and reload lazily; next access refetches from the datasource. */
  purge(): void {
    this.generation++;
    this.blocks.clear();
    this.queue = [];
    this.inFlight = 0;
    this.rowCount = Math.max(1, this.config.infiniteInitialRowCount);
    this.lastRowKnown = false;
    this.deps.onBlocksLoaded();
  }

  /** Alias for {@link purge} — re-fetches all blocks. */
  refresh(): void {
    this.purge();
  }

  /** Replace the datasource and reload from block 0. */
  setDatasource(datasource: IDatasource<TData>): void {
    if (this.datasource !== datasource) {
      this.datasource.destroy?.();
    }
    this.datasource = datasource;
    this.purge();
  }

  destroy(): void {
    this.datasource.destroy?.();
    this.blocks.clear();
    this.queue = [];
    this.inFlight = 0;
  }

  // --- internals ---------------------------------------------------------

  private placeholder(index: number): LoadingRowNode<TData> {
    return {
      id: null,
      data: {} as TData,
      rowPinned: false,
      rowHeight: null,
      displayed: true,
      selected: false,
      expanded: false,
      group: false,
      level: 0,
      firstChild: false,
      lastChild: false,
      rowIndex: index,
      displayedRowIndex: index,
      setSelected: () => {},
      __loading: true,
    };
  }

  private enqueue(blockNumber: number): void {
    if (!this.queue.includes(blockNumber)) {
      this.queue.push(blockNumber);
    }
    this.pump();
  }

  private pump(): void {
    while (this.inFlight < this.config.maxConcurrentDatasourceRequests && this.queue.length > 0) {
      const blockNumber = this.queue.shift()!;
      const block = this.blocks.get(blockNumber);
      // Block may have been purged/loaded/failed-then-retried while queued.
      if (!block || block.state !== 'loading') continue;
      this.loadBlock(blockNumber);
    }
  }

  private loadBlock(blockNumber: number): void {
    this.inFlight++;
    const generation = this.generation;
    const startRow = blockNumber * this.config.cacheBlockSize;
    const endRow = startRow + this.config.cacheBlockSize;
    const params: IGetRowsParams<TData> = {
      startRow,
      endRow,
      sortModel: this.sortModel,
      filterModel: this.filterModel,
      context: this.deps.context,
      successCallback: (rows, lastRow) =>
        this.onSuccess(blockNumber, generation, rows ?? [], lastRow),
      failCallback: () => this.onFail(blockNumber, generation),
    };
    this.datasource.getRows(params);
  }

  private onSuccess(
    blockNumber: number,
    generation: number,
    rows: TData[],
    lastRow?: number
  ): void {
    // A purge since this request started invalidates it entirely (inFlight was
    // already reset by purge(), so don't touch it here).
    if (generation !== this.generation) return;

    this.inFlight = Math.max(0, this.inFlight - 1);

    const block = this.blocks.get(blockNumber);
    if (block) {
      block.state = 'loaded';
      const base = blockNumber * this.config.cacheBlockSize;
      block.nodes = rows.map((data, i) => this.deps.makeRowNode(data, base + i));
      this.updateRowCount(blockNumber, rows.length, lastRow);
      this.evictIfNeeded(blockNumber);
    }

    this.pump();
    this.deps.onBlocksLoaded();
  }

  private onFail(blockNumber: number, generation: number): void {
    if (generation !== this.generation) return;
    this.inFlight = Math.max(0, this.inFlight - 1);
    const block = this.blocks.get(blockNumber);
    if (block) block.state = 'failed';
    this.pump();
    this.deps.onBlocksLoaded();
  }

  private updateRowCount(blockNumber: number, rowsReturned: number, lastRow?: number): void {
    const blockSize = this.config.cacheBlockSize;
    const loadedEnd = blockNumber * blockSize + rowsReturned;

    if (lastRow != null && lastRow >= 0) {
      this.rowCount = lastRow;
      this.lastRowKnown = true;
      return;
    }
    if (this.lastRowKnown) return;

    if (rowsReturned < blockSize) {
      // A short block is the final one — the total is now exact.
      this.rowCount = loadedEnd;
      this.lastRowKnown = true;
    } else {
      // A full block may have more behind it — keep scroll headroom.
      const headroom = loadedEnd + this.config.cacheOverflowSize * blockSize;
      this.rowCount = Math.max(this.rowCount, headroom);
    }
  }

  private evictIfNeeded(protectBlock: number): void {
    const max = this.config.maxBlocksInCache;
    if (max == null) return;
    const loaded = [...this.blocks.entries()].filter(([, b]) => b.state === 'loaded');
    if (loaded.length <= max) return;

    // Evict least-recently-accessed loaded blocks (never the one just loaded).
    loaded.sort((a, b) => a[1].lastAccess - b[1].lastAccess);
    let removable = loaded.length - max;
    for (const [bn] of loaded) {
      if (removable <= 0) break;
      if (bn === protectBlock) continue;
      this.blocks.delete(bn);
      removable--;
    }
  }
}
