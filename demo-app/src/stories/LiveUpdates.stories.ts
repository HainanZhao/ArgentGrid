import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { ArgentGridComponent, ArgentGridModule, LiveDataOptimizations } from 'argent-grid';

interface StockTicker {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  lastUpdate: string;
}

// Create optimized renderer class
class OptimizedGridComponent extends LiveDataOptimizations(ArgentGridComponent) {}

const meta: Meta<OptimizedGridComponent<StockTicker>> = {
  title: 'ArgentGrid/Live Updates',
  component: OptimizedGridComponent,
  decorators: [
    moduleMetadata({
      imports: [ArgentGridModule],
    }),
  ],
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<OptimizedGridComponent<StockTicker>>;

// Initial stock data
const initialStocks: StockTicker[] = [
  { symbol: 'AAPL', price: 150.25, change: 2.5, changePercent: 1.69, volume: 50000000, lastUpdate: new Date().toISOString() },
  { symbol: 'GOOGL', price: 2800.50, change: -15.30, changePercent: -0.54, volume: 2000000, lastUpdate: new Date().toISOString() },
  { symbol: 'MSFT', price: 420.75, change: 5.25, changePercent: 1.26, volume: 30000000, lastUpdate: new Date().toISOString() },
  { symbol: 'AMZN', price: 180.90, change: 3.40, changePercent: 1.91, volume: 45000000, lastUpdate: new Date().toISOString() },
  { symbol: 'TSLA', price: 250.30, change: -8.70, changePercent: -3.36, volume: 100000000, lastUpdate: new Date().toISOString() },
  { symbol: 'META', price: 500.20, change: 12.80, changePercent: 2.63, volume: 25000000, lastUpdate: new Date().toISOString() },
  { symbol: 'NVDA', price: 900.15, change: 25.40, changePercent: 2.90, volume: 60000000, lastUpdate: new Date().toISOString() },
  { symbol: 'BRK.B', price: 420.50, change: 1.20, changePercent: 0.29, volume: 5000000, lastUpdate: new Date().toISOString() },
  { symbol: 'JPM', price: 195.80, change: -2.10, changePercent: -1.06, volume: 15000000, lastUpdate: new Date().toISOString() },
  { symbol: 'V', price: 280.40, change: 4.60, changePercent: 1.67, volume: 10000000, lastUpdate: new Date().toISOString() },
];

export const StockTicker: Story = {
  args: {
    columnDefs: [
      { field: 'symbol', headerName: 'Symbol', width: 100 },
      { field: 'price', headerName: 'Price', width: 100 },
      { 
        field: 'change', 
        headerName: 'Change', 
        width: 100,
        cellRenderer: (params: any) => {
          const color = params.value >= 0 ? 'green' : 'red';
          return `<span style="color: ${color}; font-weight: bold;">${params.value >= 0 ? '+' : ''}${params.value.toFixed(2)}</span>`;
        }
      },
      { 
        field: 'changePercent', 
        headerName: 'Change %', 
        width: 100,
        cellRenderer: (params: any) => {
          const color = params.value >= 0 ? 'green' : 'red';
          return `<span style="color: ${color}; font-weight: bold;">${params.value >= 0 ? '+' : ''}${params.value.toFixed(2)}%</span>`;
        }
      },
      { field: 'volume', headerName: 'Volume', width: 120 },
      { field: 'lastUpdate', headerName: 'Last Update', width: 150 },
    ],
    rowData: initialStocks,
    height: '400px',
    width: '100%',
  },
  play: async ({ canvasElement }) => {
    // Simulate live updates
    const canvas = canvasElement.querySelector('argent-grid') as any;
    if (canvas && canvas.gridApi) {
      const renderer = canvas.gridApi.getRenderer();
      renderer.setBatchInterval(100); // Batch updates every 100ms
      
      // Simulate price updates every 500ms
      setInterval(() => {
        const stock = initialStocks[Math.floor(Math.random() * initialStocks.length)];
        const change = (Math.random() - 0.5) * 2;
        stock.price += change;
        stock.change += change;
        stock.changePercent = (stock.change / (stock.price - stock.change)) * 100;
        stock.lastUpdate = new Date().toISOString();
        
        renderer.updateRowById(stock.symbol, {
          price: stock.price,
          change: stock.change,
          changePercent: stock.changePercent,
          lastUpdate: stock.lastUpdate,
        });
      }, 500);
    }
  },
  parameters: {
    docs: {
      description: {
        story: 'Real-time stock ticker with 10 updates/second. Uses update batching and dirty row tracking for smooth 60fps performance.',
      },
    },
  },
};

export const LogStream: Story = {
  args: {
    columnDefs: [
      { field: 'timestamp', headerName: 'Time', width: 150 },
      { field: 'level', headerName: 'Level', width: 100 },
      { field: 'source', headerName: 'Source', width: 150 },
      { field: 'message', headerName: 'Message', width: 600 },
    ],
    rowData: [],
    height: '600px',
    width: '100%',
  },
  play: async ({ canvasElement }) => {
    const canvas = canvasElement.querySelector('argent-grid') as any;
    if (canvas && canvas.gridApi) {
      const renderer = canvas.getRenderer();
      renderer.setBatchInterval(50); // Batch every 50ms for 20fps
      
      const levels = ['INFO', 'WARN', 'ERROR', 'DEBUG'];
      const sources = ['AuthService', 'UserService', 'Database', 'API', 'Cache'];
      const messages = [
        'User logged in successfully',
        'Database connection established',
        'Cache miss for key user:123',
        'API request completed in 150ms',
        'Authentication token refreshed',
        'Rate limit exceeded for IP 192.168.1.1',
        'Session expired for user 456',
        'Background job completed',
      ];
      
      let logId = 0;
      
      // Simulate log stream at 100 logs/second
      setInterval(() => {
        const log = {
          id: ++logId,
          timestamp: new Date().toISOString(),
          level: levels[Math.floor(Math.random() * levels.length)],
          source: sources[Math.floor(Math.random() * sources.length)],
          message: messages[Math.floor(Math.random() * messages.length)],
        };
        
        renderer.addRowData(log);
      }, 10); // 100 logs/second
    }
  },
  parameters: {
    docs: {
      description: {
        story: 'Real-time log stream at 100 logs/second. Demonstrates update batching and efficient rendering for high-frequency data.',
      },
    },
  },
};
