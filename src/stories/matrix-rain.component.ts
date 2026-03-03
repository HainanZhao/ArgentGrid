import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import {
  ArgentGridComponent,
  ArgentGridModule,
  ColDef,
  colorSchemeDark,
  GridApi,
  themeQuartz,
} from '../public-api';

interface MatrixCell {
  char: string;
  age: number; // 0 = empty, 1 = head, 2+ = trail
}

interface MatrixColumn {
  id: number;
  [key: string]: number | MatrixCell;
}

interface Drop {
  colIndex: number;
  y: number;
  speed: number;
  length: number;
  lastUpdate: number;
}

@Component({
  selector: 'app-matrix-rain',
  standalone: true,
  imports: [CommonModule, ArgentGridModule],
  template: `
    <argent-grid
      #grid
      [columnDefs]="columnDefs"
      [height]="height"
      [width]="width"
      [theme]="theme"
      [gridOptions]="gridOptions"
      (gridReady)="onGridReady($event)"
    />
  `,
  styles: [
    `
    :host {
      display: block;
      background: #000;
    }

    ::ng-deep .argent-grid-root {
      background: #000 !important;
      border: none !important;
    }

    ::ng-deep .argent-grid-viewport {
      background: #000 !important;
    }

    ::ng-deep .argent-grid-canvas {
      background: #000 !important;
    }
  `,
  ],
})
export class MatrixRainComponent implements OnInit, OnDestroy {
  @ViewChild('grid') gridComponent!: ArgentGridComponent;

  @Input() updateInterval = 40;
  @Input() columnCount = 80;
  @Input() rowCount = 50;

  columnDefs: ColDef<MatrixColumn>[] = [];
  height = 'calc(100vh - 80px)';
  width = '100%';

  // Use a fully black theme with green text
  theme = themeQuartz.withPart(colorSchemeDark).withParams({
    backgroundColor: '#000000',
    rowBackgroundColor: '#000000',
    rowEvenBackgroundColor: '#000000',
    foregroundColor: '#00ff41',
    borderColor: 'transparent',
    fontFamily: "'Courier New', monospace",
    fontWeight: 'bold',
    fontSize: 16,
    cellPadding: 0,
  });

  gridOptions = {
    domLayout: 'normal',
    rowHeight: 20,
    headerHeight: 0,
    getRowId: (params: any) => params.data.id,
    suppressCellFocus: true,
  };

  private gridApi?: GridApi<MatrixColumn>;
  private intervalId: any;
  private internalRowData: MatrixColumn[] = [];
  private drops: Drop[] = [];

  // Matrix rain characters: Half-width Katakana + Symbols + Math + Greek + Numbers
  private readonly MATRIX_CHARS =
    'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜｦﾝ0123456789ZXVBNMLKJHGFDSAQWERTYUIOP<>:;{}[]=+-_!@#$%^&*()|~¦çòù';

  ngOnInit(): void {
    this.setupColumns();
    this.internalRowData = this.generateInitialData();
    this.setupDrops();
  }

  private setupColumns(): void {
    this.columnDefs = Array.from({ length: this.columnCount }, (_, i) => ({
      field: `col${i + 1}`,
      width: 22,
      suppressHeader: true,
      suppressEllipsis: true,
      cellStyle: (params: any) => {
        const cell = params.value as MatrixCell;
        if (!cell || cell.age === 0) return { color: 'transparent' };

        if (cell.age === 1) return { color: '#ffffff' }; // Bright white head
        if (cell.age < 12) return { color: '#00ff41' }; // Bright green
        if (cell.age < 25) return { color: '#008f11' }; // Dim green
        return { color: '#003b00' }; // Faint green
      },
      cellRenderer: (params: any) => {
        const cell = params.value as MatrixCell;
        return cell?.char || ' ';
      },
    }));
  }

  private generateInitialData(): MatrixColumn[] {
    return Array.from({ length: this.rowCount }, (_, rowIndex) => {
      const row: MatrixColumn = { id: rowIndex };
      for (let colIndex = 0; colIndex < this.columnCount; colIndex++) {
        row[`col${colIndex + 1}`] = { char: ' ', age: 0 };
      }
      return row;
    });
  }

  private setupDrops(): void {
    this.drops = Array.from({ length: this.columnCount }, (_, i) => {
      const drop = this.createDrop(i);
      // Start some drops further down for immediate effect
      if (Math.random() > 0.5) {
        drop.y = Math.floor(Math.random() * this.rowCount);
      }
      return drop;
    });
  }

  private createDrop(colIndex: number): Drop {
    return {
      colIndex,
      y: -Math.floor(Math.random() * 20), // Start above screen
      speed: 1 + Math.random() * 2,
      length: 10 + Math.floor(Math.random() * 20),
      lastUpdate: 0,
    };
  }

  onGridReady(api: GridApi<MatrixColumn>): void {
    this.gridApi = api;
    this.gridApi.setRowData(this.internalRowData);
    this.startRain();
  }

  private startRain(): void {
    if (this.intervalId) clearInterval(this.intervalId);
    this.intervalId = setInterval(() => this.updateRain(), this.updateInterval);
  }

  private updateRain(): void {
    if (!this.gridApi) return;

    const rowUpdates = new Set<number>();

    // 1. Aging logic - much simpler
    for (let r = 0; r < this.rowCount; r++) {
      const row = this.internalRowData[r];
      let rowDirty = false;
      for (let c = 0; c < this.columnCount; c++) {
        const field = `col${c + 1}`;
        const cell = row[field] as MatrixCell;
        if (cell.age > 0) {
          cell.age++;
          // Randomly change character
          if (Math.random() < 0.03) cell.char = this.getRandomChar();
          // Fade out
          if (cell.age > 35) {
            cell.age = 0;
            cell.char = ' ';
          }
          rowDirty = true;
        }
      }
      if (rowDirty) rowUpdates.add(r);
    }

    // 2. Move drops logic
    this.drops.forEach((drop) => {
      drop.lastUpdate++;
      if (drop.lastUpdate >= 2 / drop.speed) {
        drop.y++;
        drop.lastUpdate = 0;

        if (drop.y >= 0 && drop.y < this.rowCount) {
          const row = this.internalRowData[drop.y];
          row[`col${drop.colIndex + 1}`] = {
            char: this.getRandomChar(),
            age: 1,
          };
          rowUpdates.add(drop.y);
        }

        // Reset if it finished its trail
        if (drop.y > this.rowCount + drop.length) {
          const colIdx = drop.colIndex;
          Object.assign(drop, this.createDrop(colIdx));
        }
      }
    });

    if (rowUpdates.size > 0) {
      // Create shallow copies of modified rows for the grid
      const updates = Array.from(rowUpdates).map((idx) => ({ ...this.internalRowData[idx] }));
      this.gridApi.applyTransaction({ update: updates });
    }
  }

  private getRandomChar(): string {
    return this.MATRIX_CHARS[Math.floor(Math.random() * this.MATRIX_CHARS.length)];
  }

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
}
