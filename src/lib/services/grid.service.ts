import { Injectable } from '@angular/core';
import {
  GridApi,
  GridOptions,
  ColDef,
  ColGroupDef,
  Column,
  IRowNode,
  FilterModel,
  FilterModelItem,
  SortModelItem,
  GridState,
  RowDataTransaction,
  RowDataTransactionResult,
  CsvExportParams,
  ExcelExportParams
} from '../types/ag-grid-types';

@Injectable({
  providedIn: 'root'
})
export class GridService<TData = any> {
  private columns: Map<string, Column> = new Map();
  private rowData: TData[] = [];
  private rowNodes: Map<string, IRowNode<TData>> = new Map();
  private columnDefs: (ColDef<TData> | ColGroupDef<TData>)[] | null = null;
  private sortModel: SortModelItem[] = [];
  private filterModel: FilterModel = {};
  private filteredRowData: TData[] = [];
  private selectedRows: Set<string> = new Set();
  private gridId: string = '';
  
  createApi(
    columnDefs: (ColDef<TData> | ColGroupDef<TData>)[] | null,
    rowData: TData[] | null
  ): GridApi<TData> {
    this.columnDefs = columnDefs;
    this.rowData = rowData ? [...rowData] : [];
    this.gridId = this.generateGridId();

    this.initializeColumns();
    this.initializeRowNodes();

    return this.createGridApi();
  }
  
  private generateGridId(): string {
    return `argent-grid-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private initializeColumns(): void {
    if (!this.columnDefs) {
      return;
    }
    
    this.columns.clear();
    this.columnDefs.forEach((def, index) => {
      if ('children' in def) {
        // Column group
        def.children.forEach((child, childIndex) => {
          this.addColumn(child, index * 100 + childIndex);
        });
      } else {
        this.addColumn(def, index);
      }
    });
  }
  
  private addColumn(def: ColDef<TData>, index: number): void {
    const colId = def.colId || def.field?.toString() || `col-${index}`;
    const column: Column = {
      colId,
      field: def.field?.toString(),
      headerName: def.headerName,
      width: def.width || 150,
      minWidth: def.minWidth,
      maxWidth: def.maxWidth,
      pinned: def.pinned === true ? 'left' : (def.pinned || false),
      visible: !def.hide,
      sort: (typeof def.sort === 'object' && def.sort !== null) ? (def.sort as any).sort : def.sort || null,
      sortIndex: def.sortIndex ?? undefined,
      aggFunc: typeof def.aggFunc === 'string' ? def.aggFunc : null
    };
    this.columns.set(colId, column);
  }
  
  private initializeRowNodes(): void {
    this.rowNodes.clear();
    this.rowData.forEach((data, index) => {
      const id = this.getRowId(data, index);
      const node: IRowNode<TData> = {
        id,
        data,
        rowPinned: false,
        rowHeight: null,
        displayed: true,
        selected: this.selectedRows.has(id),
        expanded: false,
        group: false,
        level: 0,
        firstChild: index === 0,
        lastChild: index === this.rowData.length - 1,
        rowIndex: index,
        displayedRowIndex: index
      };
      this.rowNodes.set(id, node);
    });
  }
  
  private getRowId(data: TData, index: number): string {
    // Try to get ID from data, fallback to index
    const anyData = data as any;
    return anyData?.id?.toString() || anyData?.Id?.toString() || `row-${index}`;
  }
  
  private createGridApi(): GridApi<TData> {
    return {
      // Column API
      getColumnDefs: () => this.columnDefs,
      setColumnDefs: (colDefs) => {
        this.columnDefs = colDefs;
        this.initializeColumns();
      },
      getColumn: (key) => {
        const colId = typeof key === 'string' ? key : key.colId;
        return this.columns.get(colId) || null;
      },
      getAllColumns: () => Array.from(this.columns.values()),
      getDisplayedRowAtIndex: (index) => {
        const node = Array.from(this.rowNodes.values()).find(n => n.displayedRowIndex === index);
        return node || null;
      },
      
      // Row Data API
      getRowData: () => [...this.filteredRowData.length > 0 ? this.filteredRowData : this.rowData],
      setRowData: (rowData) => {
        this.rowData = rowData;
        this.filteredRowData = [...rowData];
        this.initializeRowNodes();
      },
      applyTransaction: (transaction) => this.applyTransaction(transaction),
      getDisplayedRowCount: () => Array.from(this.rowNodes.values()).filter(n => n.displayed).length,
      getRowNode: (id) => this.rowNodes.get(id) || null,
      
      // Selection API
      getSelectedRows: () => Array.from(this.rowNodes.values()).filter(n => n.selected),
      getSelectedNodes: () => Array.from(this.rowNodes.values()).filter(n => n.selected),
      selectAll: () => {
        this.rowNodes.forEach(node => {
          node.selected = true;
          this.selectedRows.add(node.id!);
        });
      },
      deselectAll: () => {
        this.rowNodes.forEach(node => {
          node.selected = false;
        });
        this.selectedRows.clear();
      },
      
      // Filter API
      setFilterModel: (model) => {
        this.filterModel = model;
        this.applyFiltering();
      },
      getFilterModel: () => ({ ...this.filterModel }),
      onFilterChanged: () => {
        this.applyFiltering();
      },
      isFilterPresent: () => Object.keys(this.filterModel).length > 0,
      
      // Sort API
      setSortModel: (model) => {
        this.sortModel = model;
        this.applySorting();
      },
      getSortModel: () => [...this.sortModel],
      onSortChanged: () => {
        // TODO: Emit sort changed event
      },
      
      // Pagination API
      paginationGetPageSize: () => 100,
      paginationSetPageSize: () => {},
      paginationGetCurrentPage: () => 0,
      paginationGetTotalPages: () => 1,
      paginationGoToFirstPage: () => {},
      paginationGoToLastPage: () => {},
      paginationGoToNextPage: () => {},
      paginationGoToPreviousPage: () => {},
      
      // Export API
      exportDataAsCsv: (params) => this.exportAsCsv(params),
      exportDataAsExcel: (params) => this.exportAsExcel(params),
      
      // Clipboard API
      copyToClipboard: () => {},
      cutToClipboard: () => {},
      pasteFromClipboard: () => {},
      
      // Grid State API
      getState: () => this.getGridState(),
      applyState: (state) => this.applyGridState(state),
      
      // Focus API
      setFocusedCell: () => {},
      getFocusedCell: () => null,
      
      // Refresh API
      refreshCells: () => {},
      refreshRows: (params) => {
        if (params?.rowNodes) {
          params.rowNodes.forEach(node => {
            // Trigger cell refresh
          });
        }
      },
      refreshHeader: () => {},
      
      // Scroll API
      ensureIndexVisible: () => {},
      ensureColumnVisible: () => {},
      
      // Destroy API
      destroy: () => {
        this.columns.clear();
        this.rowNodes.clear();
        this.rowData = [];
      },
      
      // Grid Information
      getGridId: () => this.gridId,
      getGridOption: (key) => undefined as any
    };
  }
  
  private applyTransaction(transaction: RowDataTransaction<TData>): RowDataTransactionResult | null {
    const result: RowDataTransactionResult = {
      add: [],
      update: [],
      remove: []
    };
    
    if (transaction.add) {
      transaction.add.forEach((data, index) => {
        const id = this.getRowId(data, this.rowData.length + index);
        this.rowData.push(data);
        const node: IRowNode<TData> = {
          id,
          data,
          rowPinned: false,
          rowHeight: null,
          displayed: true,
          selected: false,
          expanded: false,
          group: false,
          level: 0,
          firstChild: false,
          lastChild: true,
          rowIndex: this.rowData.length - 1,
          displayedRowIndex: this.rowData.length - 1
        };
        this.rowNodes.set(id, node);
        result.add.push(node);
      });
    }
    
    if (transaction.update) {
      transaction.update.forEach(data => {
        const anyData = data as any;
        const dataId = anyData?.id;
        
        // First try direct lookup by data id
        let existingNode: IRowNode<TData> | undefined;
        for (const [nodeId, node] of this.rowNodes.entries()) {
          const nodeDataId = (node.data as any)?.id;
          if (nodeDataId === dataId) {
            existingNode = node;
            break;
          }
        }
        
        if (existingNode) {
          existingNode.data = data;
          result.update.push(existingNode);
        }
      });
    }

    if (transaction.remove) {
      transaction.remove.forEach(data => {
        const anyData = data as any;
        const dataId = anyData?.id;
        
        let nodeToRemove: IRowNode<TData> | undefined;
        let nodeIdToRemove: string | undefined;
        
        // Find node by data id
        for (const [nodeId, node] of this.rowNodes.entries()) {
          const nodeDataId = (node.data as any)?.id;
          if (nodeDataId === dataId) {
            nodeToRemove = node;
            nodeIdToRemove = nodeId;
            break;
          }
        }

        if (nodeToRemove && nodeIdToRemove) {
          this.rowNodes.delete(nodeIdToRemove);
          const index = this.rowData.findIndex(r => {
            const anyR = r as any;
            return anyR?.id === dataId;
          });
          if (index !== -1) {
            this.rowData.splice(index, 1);
          }
          result.remove.push(nodeToRemove);
        }
      });
      
      // Re-index remaining row nodes after remove
      this.initializeRowNodes();
    }

    return result;
  }
  
  private applySorting(): void {
    if (this.sortModel.length === 0) {
      return;
    }

    // Sort rowData based on sort model
    this.rowData.sort((a, b) => {
      for (const sortItem of this.sortModel) {
        const column = this.columns.get(sortItem.colId);
        if (!column?.field) continue;

        const field = column.field as keyof TData;
        const valueA = a[field] as any;
        const valueB = b[field] as any;

        const comparison = this.compareValues(valueA, valueB);
        if (comparison !== 0) {
          return sortItem.sort === 'desc' ? -comparison : comparison;
        }
      }
      return 0;
    });

    // Re-initialize row nodes with sorted data
    this.initializeRowNodes();
  }

  private applyFiltering(): void {
    if (Object.keys(this.filterModel).length === 0) {
      // No filters, use all data
      this.filteredRowData = [...this.rowData];
    } else {
      // Apply filters with AND logic
      this.filteredRowData = this.rowData.filter(row => {
        return Object.keys(this.filterModel).every(colId => {
          const filterItem = this.filterModel[colId];
          if (!filterItem) return true;

          const column = this.columns.get(colId);
          if (!column?.field) return true;

          const value = (row as any)[column.field];
          return this.matchesFilter(value, filterItem);
        });
      });
    }

    // Re-initialize row nodes with filtered data
    this.initializeRowNodesFromFilteredData();
  }

  private matchesFilter(value: any, filterItem: FilterModelItem): boolean {
    if (value === null || value === undefined) {
      return false;
    }

    const { filterType, type, filter, filterTo } = filterItem;

    switch (filterType) {
      case 'text':
        return this.matchesTextFilter(String(value), type, filter);
      case 'number':
        return this.matchesNumberFilter(Number(value), type, filter, filterTo);
      case 'date':
        return this.matchesDateFilter(String(value), type, filter, filterTo);
      case 'boolean':
        return this.matchesBooleanFilter(value, filter);
      default:
        return true;
    }
  }

  private matchesTextFilter(value: string, type: string | undefined, filter: any): boolean {
    if (!type || filter === null || filter === undefined) {
      return true;
    }

    const lowerValue = String(value).toLowerCase();
    const lowerFilter = String(filter).toLowerCase();

    switch (type) {
      case 'contains':
        return lowerValue.includes(lowerFilter);
      case 'notContains':
        return !lowerValue.includes(lowerFilter);
      case 'startsWith':
        return lowerValue.startsWith(lowerFilter);
      case 'endsWith':
        return lowerValue.endsWith(lowerFilter);
      case 'equals':
        return lowerValue === lowerFilter;
      case 'notEqual':
        return lowerValue !== lowerFilter;
      default:
        return true;
    }
  }

  private matchesNumberFilter(value: number, type: string | undefined, filter: any, filterTo?: any): boolean {
    if (type === undefined || filter === null || filter === undefined || isNaN(value)) {
      return true;
    }

    const filterNum = Number(filter);

    switch (type) {
      case 'equals':
        return value === filterNum;
      case 'notEqual':
        return value !== filterNum;
      case 'greaterThan':
        return value > filterNum;
      case 'greaterThanOrEqual':
        return value >= filterNum;
      case 'lessThan':
        return value < filterNum;
      case 'lessThanOrEqual':
        return value <= filterNum;
      case 'inRange':
        const filterToNum = Number(filterTo);
        return value >= filterNum && value <= filterToNum;
      default:
        return true;
    }
  }

  private matchesDateFilter(value: string, type: string | undefined, filter: any, filterTo?: any): boolean {
    if (!type || !filter) {
      return true;
    }

    const valueDate = new Date(value).getTime();
    const filterDate = new Date(filter).getTime();

    if (type === 'inRange' && filterTo) {
      const filterToDate = new Date(filterTo).getTime();
      return valueDate >= filterDate && valueDate <= filterToDate;
    }

    switch (type) {
      case 'equals':
        return valueDate === filterDate;
      case 'notEqual':
        return valueDate !== filterDate;
      case 'greaterThan':
        return valueDate > filterDate;
      case 'greaterThanOrEqual':
        return valueDate >= filterDate;
      case 'lessThan':
        return valueDate < filterDate;
      case 'lessThanOrEqual':
        return valueDate <= filterDate;
      default:
        return true;
    }
  }

  private matchesBooleanFilter(value: any, filter: any): boolean {
    if (filter === null || filter === undefined) {
      return true;
    }
    return Boolean(value) === Boolean(filter);
  }

  private initializeRowNodesFromFilteredData(): void {
    this.rowNodes.clear();
    this.filteredRowData.forEach((data, index) => {
      const id = this.getRowId(data, index);
      const node: IRowNode<TData> = {
        id,
        data,
        rowPinned: false,
        rowHeight: null,
        displayed: true,
        selected: this.selectedRows.has(id),
        expanded: false,
        group: false,
        level: 0,
        firstChild: index === 0,
        lastChild: index === this.filteredRowData.length - 1,
        rowIndex: index,
        displayedRowIndex: index
      };
      this.rowNodes.set(id, node);
    });
  }
  
  private compareValues(a: any, b: any): number {
    if (a === b) return 0;
    if (a === null || a === undefined) return 1;
    if (b === null || b === undefined) return -1;
    if (typeof a === 'number' && typeof b === 'number') {
      return a - b;
    }
    return String(a).localeCompare(String(b));
  }
  
  private getGridState(): GridState {
    const filterState: { [key: string]: FilterModelItem } = {};
    Object.keys(this.filterModel).forEach(key => {
      const item = this.filterModel[key];
      if (item) {
        filterState[key] = item;
      }
    });
    
    return {
      sort: { sortModel: [...this.sortModel] },
      filter: filterState,
      columnOrder: Array.from(this.columns.values()).map(col => ({
        colId: col.colId,
        width: col.width,
        hide: !col.visible,
        pinned: col.pinned,
        sort: col.sort,
        sortIndex: col.sortIndex
      }))
    };
  }
  
  private applyGridState(state: GridState): void {
    if (state.sort) {
      this.sortModel = state.sort.sortModel;
      this.applySorting();
    }
    if (state.filter) {
      this.filterModel = state.filter;
    }
    if (state.columnOrder) {
      state.columnOrder.forEach(colState => {
        const column = this.columns.get(colState.colId);
        if (column) {
          column.width = colState.width;
          column.visible = !colState.hide;
          column.pinned = colState.pinned;
          column.sort = colState.sort;
          column.sortIndex = colState.sortIndex;
        }
      });
    }
  }
  
  private exportAsCsv(params?: CsvExportParams): void {
    const fileName = params?.fileName || 'export.csv';
    const delimiter = ',';
    
    // Build CSV content
    const headers = this.getAllColumns()
      .filter(col => col.visible)
      .map(col => col.headerName || col.colId);
    
    const rows = this.rowData.map(data => {
      return this.getAllColumns()
        .filter(col => col.visible && col.field)
        .map(col => {
          const value = (data as any)[col.field!];
          return value !== null && value !== undefined ? String(value) : '';
        });
    });
    
    const csvContent = [
      headers.join(delimiter),
      ...rows.map(row => row.join(delimiter))
    ].join('\n');
    
    // Download CSV
    this.downloadFile(csvContent, fileName, 'text/csv');
  }
  
  private exportAsExcel(params?: ExcelExportParams): void {
    // TODO: Implement Excel export (requires additional library)
    console.warn('Excel export not yet implemented');
  }
  
  private getAllColumns(): Column[] {
    return Array.from(this.columns.values());
  }
  
  private downloadFile(content: string, fileName: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  }
}
