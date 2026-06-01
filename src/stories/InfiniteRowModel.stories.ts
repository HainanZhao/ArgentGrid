import { BrowserModule } from '@angular/platform-browser';
import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { expect, waitFor } from '@storybook/test';
import {
  ArgentGridComponent,
  ArgentGridModule,
  type ColDef,
  type GridOptions,
  type IDatasource,
  type IGetRowsParams,
  themeQuartz,
} from '../public-api';

// ---------------------------------------------------------------------------
// Infinite Row Model (T3.1)
//
// `rowModelType: 'infinite'` fetches rows lazily, one block at a time, from an
// `IDatasource` as they scroll into view. This story backs the datasource with
// a large in-memory array and an artificial latency, and applies the grid's
// sort/filter models server-side — exactly how a real backend datasource would.
// ---------------------------------------------------------------------------

interface Trade {
  id: number;
  symbol: string;
  side: 'BUY' | 'SELL';
  qty: number;
  price: number;
}

const SYMBOLS = ['AAPL', 'MSFT', 'GOOG', 'AMZN', 'TSLA', 'NVDA', 'META', 'NFLX'];

/** The full server-side dataset (the grid never sees this directly). */
function makeTrades(count: number): Trade[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    symbol: SYMBOLS[i % SYMBOLS.length],
    side: i % 2 === 0 ? 'BUY' : 'SELL',
    qty: ((i * 37) % 500) + 1,
    price: Number((50 + ((i * 13) % 9500) / 100).toFixed(2)),
  }));
}

/**
 * A mock backend datasource over an in-memory array. Applies the requested
 * filter then sort, slices the block, and reports `lastRow` once the end is
 * reached. `latency` simulates network round-trips so block loading is visible.
 */
function makeDatasource(rows: Trade[], latency = 250): IDatasource<Trade> {
  return {
    getRows(params: IGetRowsParams<Trade>) {
      let result = [...rows];

      // --- filter (server-side) ---
      for (const [colId, model] of Object.entries(params.filterModel ?? {})) {
        const m = model as any;
        const needle = String(m.filter ?? '').toLowerCase();
        if (!needle) continue;
        result = result.filter((r) =>
          String((r as any)[colId] ?? '')
            .toLowerCase()
            .includes(needle)
        );
      }

      // --- sort (server-side) ---
      if (params.sortModel?.length) {
        const { colId, sort } = params.sortModel[0];
        const dir = sort === 'desc' ? -1 : 1;
        result.sort((a, b) => {
          const av = (a as any)[colId];
          const bv = (b as any)[colId];
          if (av < bv) return -1 * dir;
          if (av > bv) return 1 * dir;
          return 0;
        });
      }

      const block = result.slice(params.startRow, params.endRow);
      const lastRow = params.endRow >= result.length ? result.length : undefined;

      setTimeout(() => params.successCallback(block, lastRow), latency);
    },
  };
}

const columns: ColDef<Trade>[] = [
  { colId: 'id', field: 'id', headerName: '#', width: 90, sortable: true },
  { colId: 'symbol', field: 'symbol', headerName: 'Symbol', width: 130, sortable: true },
  { colId: 'side', field: 'side', headerName: 'Side', width: 110, sortable: true },
  { colId: 'qty', field: 'qty', headerName: 'Qty', width: 120, sortable: true },
  { colId: 'price', field: 'price', headerName: 'Price', width: 140, sortable: true },
];

const meta: Meta<ArgentGridComponent<Trade>> = {
  title: 'Features/InfiniteRowModel',
  component: ArgentGridComponent,
  decorators: [moduleMetadata({ imports: [ArgentGridModule, BrowserModule] })],
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj<ArgentGridComponent<Trade>>;

/**
 * 100,000 rows served lazily in 100-row blocks. Scroll fast and watch blocks
 * stream in (rows are momentarily blank while their block loads). Click a header
 * to sort or type in a filter — the cache purges and reloads from the server.
 */
export const LazyBlocks: Story = {
  args: {
    columnDefs: columns,
    gridOptions: {
      rowModelType: 'infinite',
      datasource: makeDatasource(makeTrades(100_000)),
      cacheBlockSize: 100,
      maxBlocksInCache: 20,
      ariaLabel: 'Trades',
    } as GridOptions<Trade>,
    height: 'calc(100vh - 20px)',
    width: '100%',
    rowHeight: 36,
    theme: themeQuartz,
  },
};

/**
 * A small dataset that fits within the first block: the datasource returns a
 * short block, which immediately reports the exact `lastRow`, so the scroll
 * height is exact from the first load (no scrolling needed to discover the end).
 */
export const KnownTotal: Story = {
  args: {
    columnDefs: columns,
    gridOptions: {
      rowModelType: 'infinite',
      datasource: makeDatasource(makeTrades(40), 150),
      cacheBlockSize: 50,
      ariaLabel: 'Trades',
    } as GridOptions<Trade>,
    height: 'calc(100vh - 20px)',
    width: '100%',
    rowHeight: 36,
    theme: themeQuartz,
  },
  // Verify, via the off-screen ARIA mirror, that the first block loads lazily
  // and the total row count becomes exact once the short block reports lastRow.
  play: async ({ canvasElement }) => {
    const root = canvasElement as HTMLElement;
    const grid = () => root.querySelector('[role="grid"]') as HTMLElement | null;

    await waitFor(async () => {
      await expect(Boolean(grid())).toBe(true);
    });

    // Block 0 streams in (latency 150ms) → mirrored gridcells carry real values.
    await waitFor(
      async () => {
        const cells = root.querySelectorAll('[role="row"] [role="gridcell"]');
        const text = Array.from(cells)
          .map((c) => c.textContent ?? '')
          .join('|');
        await expect(text).toContain('AAPL');
      },
      { timeout: 4000 }
    );

    // The short block (40 < cacheBlockSize 50) is the last one, so the total is
    // exact: 40 data rows + 1 header row reported via aria-rowcount.
    await waitFor(
      async () => {
        await expect(grid()?.getAttribute('aria-rowcount')).toBe('41');
      },
      { timeout: 4000 }
    );
  },
};
