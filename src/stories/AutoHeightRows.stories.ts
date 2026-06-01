import { BrowserModule } from '@angular/platform-browser';
import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { ArgentGridComponent, ArgentGridModule, themeQuartz } from '../public-api';

interface Article {
  id: number;
  title: string;
  summary: string;
  tags: string;
}

const LOREM = [
  'Canvas rendering keeps the grid fast at a million rows, but wrapping long text means each row can no longer assume a fixed height.',
  'Auto-height measures the wrapped content of every auto-height column and sizes the row to the tallest one, feeding the existing cumulative row-offset model.',
  'Resize a column and the wrapped text reflows; the row heights are re-measured on release so the scrollbar and virtualization stay correct.',
  'Short.',
  'A moderately long summary that wraps onto two lines at the default column width but collapses to one when the column is widened.',
];

function makeData(count: number): Article[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    title: `Article ${i + 1}`,
    summary: LOREM[i % LOREM.length],
    tags: ['alpha', 'beta', 'gamma', 'delta', 'epsilon'].slice(0, (i % 5) + 1).join(', '),
  }));
}

const meta: Meta<ArgentGridComponent<Article>> = {
  title: 'Features/AutoHeightRows',
  component: ArgentGridComponent,
  decorators: [moduleMetadata({ imports: [ArgentGridModule, BrowserModule] })],
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj<ArgentGridComponent<Article>>;

/**
 * The `summary` and `tags` columns set `wrapText` + `autoHeight`, so each row
 * grows to fit its tallest wrapped cell. Resize the `summary` column to watch
 * the text reflow and the rows re-measure. `id`/`title` are fixed single-line
 * columns sharing the same (variable) row height.
 */
export const WrappedText: Story = {
  args: {
    columnDefs: [
      { field: 'id', headerName: 'ID', width: 70, pinned: 'left' },
      { field: 'title', headerName: 'Title', width: 130 },
      {
        field: 'summary',
        headerName: 'Summary',
        width: 280,
        wrapText: true,
        autoHeight: true,
      },
      {
        field: 'tags',
        headerName: 'Tags',
        width: 120,
        wrapText: true,
        autoHeight: true,
      },
    ],
    rowData: makeData(300),
    height: 'calc(100vh - 20px)',
    width: '100%',
    theme: themeQuartz,
  },
};
