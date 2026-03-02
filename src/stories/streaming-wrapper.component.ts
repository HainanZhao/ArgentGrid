import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ArgentGridComponent, ArgentGridModule, ColDef, GridApi, themeQuartz } from '../public-api';

interface Stock {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePct: number;
  history: number[];
  volume: number;
  marketCap: number;
}

@Component({
  selector: 'app-streaming-wrapper',
  standalone: true,
  imports: [CommonModule, ArgentGridModule],
  template: `
    <div class="streaming-container">
      <div class="header">
        <div class="title">
          <h2>Live Stock Market Feed</h2>
          <div class="status-badge" [class.active]="isRunning">
            <span class="dot"></span>
            {{ isRunning ? 'Streaming Live' : 'Paused' }}
          </div>
        </div>
        <div class="controls">
          <button (click)="checkData()">Check Data</button>
          <button (click)="toggleStreaming()" [class.pause]="isRunning">
            {{ isRunning ? 'Pause Stream' : 'Start Stream' }}
          </button>
          <div class="stats">
            <span class="stat-label">Message Rate:</span>
            <span class="stat-value">{{ messageRate | number:'1.1-1' }} msgs/sec</span>
          </div>
        </div>
      </div>

      <argent-grid
        #grid
        [columnDefs]="columnDefs"
        [rowData]="rowData"
        [height]="height"
        [width]="width"
        [theme]="theme"
        [gridOptions]="gridOptions"
        [renderThrottleMs]="renderThrottleMs"
        (gridReady)="onGridReady($event)"
      />
    </div>
  `,
  styles: [
    `
    .streaming-container {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 20px;
      background: #f8fafc;
      height: 600px;
      box-sizing: border-box;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: white;
      padding: 16px 24px;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .title h2 {
      margin: 0;
      font-size: 1.25rem;
      color: #1e293b;
    }
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      font-weight: 500;
      color: #64748b;
      margin-top: 4px;
    }
    .status-badge.active {
      color: #10b981;
    }
    .dot {
      width: 8px;
      height: 8px;
      background: #cbd5e1;
      border-radius: 50%;
    }
    .active .dot {
      background: #10b981;
      box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0% { transform: scale(0.95); opacity: 0.5; }
      50% { transform: scale(1.05); opacity: 1; }
      100% { transform: scale(0.95); opacity: 0.5; }
    }
    .controls {
      display: flex;
      gap: 20px;
      align-items: center;
    }
    button {
      padding: 8px 20px;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    button:hover {
      background: #2563eb;
    }
    button.pause {
      background: #ef4444;
    }
    button.pause:hover {
      background: #dc2626;
    }
    .stats {
      font-size: 14px;
    }
    .stat-label {
      color: #64748b;
      margin-right: 4px;
    }
    .stat-value {
      color: #1e293b;
      font-weight: 700;
      font-family: monospace;
    }
  `,
  ],
})
export class StreamingWrapperComponent implements OnInit, OnDestroy {
  @ViewChild('grid') gridComponent!: ArgentGridComponent;

  @Input() updateFrequency = 200; // ms
  @Input() batchSize = 10;
  @Input() renderThrottleMs = 16;

  columnDefs: ColDef<Stock>[] = [
    { field: 'symbol', headerName: 'Symbol', width: 100, pinned: 'left', sortable: true },
    { field: 'name', headerName: 'Name', width: 200, sortable: true },
    { 
      field: 'price', 
      headerName: 'Price', 
      width: 120, 
      sortable: true,
      valueFormatter: (params: any) => `$${params.value.toFixed(2)}`
    },
    { 
      field: 'change', 
      headerName: 'Change', 
      width: 100,
      valueFormatter: (params: any) => {
        const val = params.value;
        const sign = val >= 0 ? '+' : '';
        return `${sign}${val.toFixed(2)}`;
      }
    },
    { 
      field: 'changePct', 
      headerName: '% Change', 
      width: 100,
      valueFormatter: (params: any) => {
        const val = params.value;
        const sign = val >= 0 ? '+' : '';
        return `${sign}${val.toFixed(2)}%`;
      }
    },
    {
      field: 'history',
      headerName: 'Last 20 Ticks',
      width: 200,
      cellRenderer: 'sparkline',
      sparklineOptions: {
        type: 'area',
        area: {
          fill: 'rgba(59, 130, 246, 0.1)',
          stroke: '#3b82f6',
          strokeWidth: 2,
        },
      }
    },
    { 
      field: 'volume', 
      headerName: 'Volume', 
      width: 140, 
      sortable: true,
      valueFormatter: (params: any) => params.value.toLocaleString()
    },
    { 
      field: 'marketCap', 
      headerName: 'Mkt Cap', 
      width: 140,
      sortable: true,
      cellRenderer: (params: any) => {
        const val = params.value;
        if (val >= 1e12) return `$${(val / 1e12).toFixed(2)}T`;
        if (val >= 1e9) return `$${(val / 1e9).toFixed(1)}B`;
        return `$${(val / 1e6).toFixed(1)}M`;
      }
    }
  ];

  rowData: Stock[] = [];
  height = '100%';
  width = '100%';
  theme = themeQuartz;

  gridOptions = {
    getRowId: (params: any) => params.data.symbol,
    defaultColDef: {
      resizable: true,
    },
  };

  private gridApi?: GridApi<Stock>;
  private intervalId: any;
  private rateIntervalId: any;
  isRunning = false;
  updateCount = 0;
  messageRate = 0;
  private lastUpdateCount = 0;

  ngOnInit(): void {
    this.rowData = this.generateInitialData();
  }

  onGridReady(api: GridApi<Stock>): void {
    this.gridApi = api;
    console.log('Grid Ready, rowData count:', this.rowData.length);
    this.startStreaming();
  }

  toggleStreaming(): void {
    if (this.isRunning) {
      this.stopStreaming();
    } else {
      this.startStreaming();
    }
  }

  private startStreaming(): void {
    this.isRunning = true;
    this.intervalId = setInterval(() => {
      this.updateStocks();
    }, this.updateFrequency);

    // Calculate message rate every second
    this.rateIntervalId = setInterval(() => {
      this.messageRate = this.updateCount - this.lastUpdateCount;
      this.lastUpdateCount = this.updateCount;
    }, 1000);
  }

  private stopStreaming(): void {
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    if (this.rateIntervalId) {
      clearInterval(this.rateIntervalId);
    }
  }

  forceRender(): void {
    if (this.gridComponent) {
      console.log('Forcing grid render...');
      this.gridComponent.refresh();
    }
  }

  checkData(): void {
    if (this.gridApi) {
      console.log('Current Row Data:', this.gridApi.getRowData());
      console.log('Displayed Count:', this.gridApi.getDisplayedRowCount());
    }
  }

  private generateInitialData(): Stock[] {
    const symbols = [
      { s: 'AAPL', n: 'Apple Inc.', p: 185.92, m: 2.89e12 },
      { s: 'MSFT', n: 'Microsoft Corp.', p: 406.32, m: 3.02e12 },
      { s: 'GOOGL', n: 'Alphabet Inc.', p: 142.65, m: 1.79e12 },
      { s: 'AMZN', n: 'Amazon.com Inc.', p: 174.45, m: 1.81e12 },
      { s: 'NVDA', n: 'NVIDIA Corp.', p: 788.17, m: 1.94e12 },
      { s: 'META', n: 'Meta Platforms Inc.', p: 484.03, m: 1.24e12 },
      { s: 'TSLA', n: 'Tesla Inc.', p: 191.97, m: 611.3e9 },
      { s: 'BRK.B', n: 'Berkshire Hathaway', p: 408.84, m: 882.4e9 },
      { s: 'V', n: 'Visa Inc.', p: 282.43, m: 581.2e9 },
      { s: 'JPM', n: 'JPMorgan Chase & Co.', p: 184.21, m: 531.5e9 },
      { s: 'UNH', n: 'UnitedHealth Group', p: 525.44, m: 485.1e9 },
      { s: 'LLY', n: 'Eli Lilly & Co.', p: 769.72, m: 730.8e9 },
      { s: 'XOM', n: 'Exxon Mobil Corp.', p: 105.21, m: 417.3e9 },
      { s: 'MA', n: 'Mastercard Inc.', p: 471.22, m: 439.1e9 },
      { s: 'AVGO', n: 'Broadcom Inc.', p: 1304.11, m: 605.4e9 },
      { s: 'HD', n: 'Home Depot Inc.', p: 372.44, m: 369.2e9 },
      { s: 'PG', n: 'Procter & Gamble', p: 160.21, m: 377.1e9 },
      { s: 'COST', n: 'Costco Wholesale', p: 742.11, m: 329.4e9 },
      { s: 'CVX', n: 'Chevron Corp.', p: 154.32, m: 289.1e9 },
      { s: 'ABBV', n: 'AbbVie Inc.', p: 178.44, m: 315.2e9 },
    ];

    // Expand to 100 stocks for more activity
    const allStocks: Stock[] = [];
    for (let i = 0; i < 5; i++) {
      symbols.forEach(sym => {
        const symbol = i === 0 ? sym.s : `${sym.s}_${i}`;
        const name = i === 0 ? sym.n : `${sym.n} Class ${i}`;
        const price = sym.p * (0.8 + Math.random() * 0.4);
        const history = Array.from({ length: 20 }, () => price * (0.95 + Math.random() * 0.1));
        
        allStocks.push({
          id: symbol,
          symbol,
          name,
          price,
          change: 0,
          changePct: 0,
          history,
          volume: Math.floor(Math.random() * 10000000) + 1000000,
          marketCap: sym.m * (0.8 + Math.random() * 0.4)
        });
      });
    }

    return allStocks;
  }

  private updateStocks(): void {
    if (!this.gridApi || !this.rowData.length) return;

    const updates: Stock[] = [];
    const indicesToUpdate = new Set<number>();
    
    // Pick unique random stocks to update
    while (indicesToUpdate.size < Math.min(this.batchSize, this.rowData.length)) {
      indicesToUpdate.add(Math.floor(Math.random() * this.rowData.length));
    }

    // Create a NEW array for rowData to ensure OnPush detects change
    const newRowData = [...this.rowData];

    indicesToUpdate.forEach(idx => {
      const stock = newRowData[idx];
      
      // Realistic price movement (Random Walk with slight mean reversion)
      const volatility = 0.002; // 0.2% per update
      const drift = 0.00001; // slight upward drift
      const change = stock.price * (volatility * (Math.random() - 0.5) + drift);
      
      const newPrice = Math.max(0.01, stock.price + change);
      const dayChange = newPrice - (stock.price - stock.change);
      const dayChangePct = (dayChange / (newPrice - dayChange)) * 100;
      
      // Update history
      const newHistory = [...stock.history.slice(1), newPrice];
      
      const updatedStock = {
        ...stock,
        price: newPrice,
        change: dayChange,
        changePct: dayChangePct,
        history: newHistory,
        volume: stock.volume + Math.floor(Math.random() * 1000)
      };
      
      newRowData[idx] = updatedStock;
      updates.push(updatedStock);
    });

    this.rowData = newRowData;

    // Apply updates to grid via transaction
    this.gridApi.applyTransaction({ update: updates });
    this.updateCount += updates.length;
  }

  ngOnDestroy(): void {
    this.stopStreaming();
  }
}
