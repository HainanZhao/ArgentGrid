/**
 * Live Data Handler for Canvas Renderer
 *
 * Manages high-frequency data updates and buffering.
 */

import { GridApi } from '../types/ag-grid-types';

export class LiveDataHandler<TData = any> {
  private updateBuffer: TData[] = [];
  private updateBufferTimer: number | null = null;
  private batchInterval = 100;
  private rowIndexById: Map<string, number> = new Map();
  private dirtyRows: Set<number> = new Set();

  constructor(private gridApi: GridApi<TData>) {}

  setBatchInterval(intervalMs: number): void {
    this.batchInterval = Math.max(16, intervalMs);
  }

  addRowData(data: TData, immediate = false, onFlush: () => void): void {
    this.updateBuffer.push(data);

    // Index row by ID if available
    const dataWithId = data as any;
    if (dataWithId.id) {
      const index = this.gridApi.getRowData().length + this.updateBuffer.length - 1;
      this.rowIndexById.set(dataWithId.id, index);
    }

    if (immediate) {
      this.flushUpdateBuffer(onFlush);
    } else if (!this.updateBufferTimer) {
      this.updateBufferTimer = window.setTimeout(() => {
        this.flushUpdateBuffer(onFlush);
      }, this.batchInterval);
    }
  }

  flushUpdateBuffer(onFlush: () => void): void {
    if (this.updateBuffer.length === 0) return;

    if (this.updateBufferTimer) {
      clearTimeout(this.updateBufferTimer);
      this.updateBufferTimer = null;
    }

    const currentCount = this.gridApi.getDisplayedRowCount();
    
    // Apply transaction
    this.gridApi.applyTransaction({ add: this.updateBuffer });
    
    // Mark new rows as dirty
    for (let i = 0; i < this.updateBuffer.length; i++) {
      this.dirtyRows.add(currentCount + i);
    }
    
    this.updateBuffer = [];
    onFlush();
  }

  markRowDirty(rowIndex: number): void {
    this.dirtyRows.add(rowIndex);
  }

  getDirtyRows(): Set<number> {
    return this.dirtyRows;
  }

  clearDirtyRows(): void {
    this.dirtyRows.clear();
  }

  updateRowById(id: string, updates: Partial<TData>): boolean {
    const index = this.rowIndexById.get(id);
    const rowData = this.gridApi.getRowData();
    if (index === undefined || index >= rowData.length) {
      return false;
    }

    this.gridApi.applyTransaction({ update: [{ ...rowData[index], ...updates }] });
    this.markRowDirty(index);
    return true;
  }

  removeRowById(id: string): boolean {
    const index = this.rowIndexById.get(id);
    if (index === undefined) {
      return false;
    }

    const rowData = this.gridApi.getRowData();
    this.gridApi.applyTransaction({ remove: [rowData[index]] });
    this.rowIndexById.delete(id);
    this.rebuildRowIndex();
    return true;
  }

  rebuildRowIndex(): void {
    this.rowIndexById.clear();
    const rowData = this.gridApi.getRowData();
    rowData.forEach((row, index) => {
      const rowWithId = row as any;
      if (rowWithId.id) {
        this.rowIndexById.set(rowWithId.id, index);
      }
    });
  }
}
