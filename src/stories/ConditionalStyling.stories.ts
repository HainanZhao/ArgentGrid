import { BrowserModule } from '@angular/platform-browser';
import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { ArgentGridComponent, ArgentGridModule, themeQuartz } from '../public-api';

interface Position {
  ticker: string;
  qty: number;
  pnl: number;
  status: 'open' | 'filled' | 'rejected';
}

const TICKERS = ['AAPL', 'MSFT', 'GOOG', 'AMZN', 'NVDA', 'META', 'TSLA', 'NFLX'];
const STATUSES: Position['status'][] = ['open', 'filled', 'rejected'];

function makeData(count: number): Position[] {
  return Array.from({ length: count }, (_, i) => ({
    ticker: TICKERS[i % TICKERS.length],
    qty: ((i * 37) % 500) - 250,
    pnl: (((i * 91) % 4000) - 2000) / 10,
    status: STATUSES[i % STATUSES.length],
  }));
}

const meta: Meta<ArgentGridComponent<Position>> = {
  title: 'Features/ConditionalStyling',
  component: ArgentGridComponent,
  decorators: [moduleMetadata({ imports: [ArgentGridModule, BrowserModule] })],
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj<ArgentGridComponent<Position>>;

/**
 * Canvas cells have no DOM, so a CSS `cellClass` can't be styled the usual way.
 * The bridge is `gridOptions.cellClassStyles` (or `colDef.cellClassStyles`): a
 * map from the class names your `cellClassRules` / `cellClass` produce to a
 * canvas-paintable `{ color, backgroundColor, fontWeight, fontStyle }`. Migrating
 * from AG Grid means moving the few CSS declarations behind those class names
 * into this map; the rule functions themselves are unchanged.
 *
 * Here `pnl` colours its text by sign via `cellClassRules`, `status` paints a
 * background per state, and `qty` uses a `cellStyle` function directly (which
 * always wins over class-derived styles, matching CSS inline-style precedence).
 */
export const ConditionalFormatting: Story = {
  args: {
    columnDefs: [
      { field: 'ticker', headerName: 'Ticker', width: 110, pinned: 'left' },
      {
        field: 'qty',
        headerName: 'Qty',
        width: 120,
        // cellStyle wins over any class — dynamic text colour by sign.
        cellStyle: (p) => ({ color: p.value < 0 ? '#b42318' : '#067647', fontWeight: 'bold' }),
      },
      {
        field: 'pnl',
        headerName: 'P&L',
        width: 130,
        valueFormatter: (p) => `$${Number(p.value).toFixed(1)}`,
        cellClassRules: {
          profit: (p) => p.value > 0,
          loss: (p) => p.value < 0,
          flat: (p) => p.value === 0,
        },
      },
      {
        field: 'status',
        headerName: 'Status',
        width: 140,
        // Static-per-row class chosen from the value.
        cellClass: (p) => `status-${p.value}`,
      },
    ],
    rowData: makeData(500),
    gridOptions: {
      // The canvas analogue of the CSS you'd write for these class names.
      cellClassStyles: {
        profit: { color: '#067647', fontWeight: 'bold' },
        loss: { color: '#b42318', fontWeight: 'bold' },
        flat: { color: '#667085', fontStyle: 'italic' },
        'status-open': { backgroundColor: '#fff8e1', color: '#8a6d00' },
        'status-filled': { backgroundColor: '#e6f4ea', color: '#067647' },
        'status-rejected': { backgroundColor: '#fde7e7', color: '#b42318' },
      },
    },
    height: 'calc(100vh - 20px)',
    width: '100%',
    theme: themeQuartz,
  },
};
