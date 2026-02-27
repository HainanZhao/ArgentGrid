import { Injectable, Inject, Optional } from '@angular/core';
import { Subject } from 'rxjs';
import { Workbook } from 'exceljs';
import {  GridApi,
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
  ExcelExportParams,
  GroupRowNode,
  CellRange
} from '../types/ag-grid-types';

@Injectable()
export class GridService<TData = any> {
  private columns: Map<string, Column> = new Map();
  private rowData: TData[] = [];
  private rowNodes: Map<string, IRowNode<TData>> = new Map();
  private displayedRowNodes: IRowNode<TData>[] = [];
  private columnDefs: (ColDef<TData> | ColGroupDef<TData>)[] | null = null;
  private sortModel: SortModelItem[] = [];
  private filterModel: FilterModel = {};
  private filteredRowData: TData[] = [];
  private selectedRows: Set<string> = new Set();
  private expandedGroups: Set<string> = new Set();
  private cellRanges: CellRange[] = [];
  private gridId: string = '';
  private gridOptions: GridOptions<TData> | null = null;
  public gridStateChanged$ = new Subject<{ type: string, key?: string, value?: any }>();

  // Row height cache
  private cumulativeRowHeights: number[] = [];
  private totalHeight = 0;

  // Grouping cache
  private cachedGroupedData: (TData | GroupRowNode<TData>)[] | null = null;
  private groupingDirty = true;

  // Pivoting state
  private pivotColumnDefs: (ColDef<TData> | ColGroupDef<TData>)[] | null = null;
  private isPivotMode = false;
  
  createApi(
    columnDefs: (ColDef<TData> | ColGroupDef<TData>)[] | null,
    rowData: TData[] | null,
    gridOptions?: GridOptions<TData> | null
  ): GridApi<TData> {
    this.columnDefs = columnDefs;
    this.rowData = rowData ? [...rowData] : [];
    this.filteredRowData = [...this.rowData];
    this.displayedRowNodes = [];
    this.gridId = this.generateGridId();
    this.gridOptions = gridOptions ? { ...gridOptions } : {};
    this.isPivotMode = !!this.gridOptions.pivotMode;

    this.initializeColumns();
    
    // Trigger initial pipeline run
    this.applySorting();
    this.applyFiltering(); // This will trigger grouping if needed and initialize nodes

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

    const groupColumns = this.getGroupColumns();
    const isGrouping = groupColumns.length > 0;
    const groupDisplayType = this.gridOptions?.groupDisplayType || 'singleColumn';

    // 1. Handle Auto Group Column (for singleColumn display)
    if (isGrouping && (groupDisplayType === 'singleColumn' || !this.gridOptions?.groupDisplayType)) {
      const autoGroupDef = this.gridOptions?.autoGroupColumnDef || {};
      const autoGroupCol: Column = {
        colId: 'ag-Grid-AutoColumn',
        field: 'ag-Grid-AutoColumn',
        headerName: autoGroupDef.headerName || 'Group',
        width: autoGroupDef.width || 200,
        minWidth: autoGroupDef.minWidth,
        maxWidth: autoGroupDef.maxWidth,
        pinned: this.normalizePinned(autoGroupDef.pinned || 'left'),
        visible: true,
        sort: null
      };
      this.columns.set(autoGroupCol.colId, autoGroupCol);
    }

    // 2. Process regular columns
    const columnsToProcess = (this.isPivotMode && this.pivotColumnDefs) ? 
      [...this.columnDefs, ...this.pivotColumnDefs] : 
      this.columnDefs;

    columnsToProcess.forEach((def, index) => {
      if ('children' in def) {
        // Column group
        def.children.forEach((child, childIndex) => {
          this.addColumn(child, index * 100 + childIndex, isGrouping);
        });
      } else {
        this.addColumn(def, index, isGrouping);
      }
    });
  }

  private normalizePinned(pinned: boolean | 'left' | 'right' | null | undefined): 'left' | 'right' | false {
    if (pinned === 'left' || pinned === true) return 'left';
    if (pinned === 'right') return 'right';
    return false;
  }
  
  private addColumn(def: ColDef<TData>, index: number, isGrouping: boolean): void {
    const colId = def.colId || def.field?.toString() || `col-${index}`;
    
    // Auto-hide columns that are being grouped (AG Grid default)
    let visible = !def.hide;
    if (isGrouping && def.rowGroup && visible && this.gridOptions?.groupHideOpenParents !== false) {
      visible = false;
    }

    // Auto-hide columns that are being pivoted
    if (this.isPivotMode && def.pivot && visible) {
      visible = false;
    }

    // Auto-hide value columns if in pivot mode (they appear under pivot keys)
    if (this.isPivotMode && def.aggFunc && visible && !colId.startsWith('pivot_')) {
      visible = false;
    }

    // In pivot mode, hide columns that are not part of grouping or pivot results
    if (this.isPivotMode && visible && !def.rowGroup && !colId.startsWith('pivot_') && colId !== 'ag-Grid-AutoColumn') {
      visible = false;
    }

    const column: Column = {
      colId,
      field: def.field?.toString(),
      headerName: def.headerName,
      width: def.width || 150,
      minWidth: def.minWidth,
      maxWidth: def.maxWidth,
      pinned: this.normalizePinned(def.pinned),
      visible: visible,
      sort: (typeof def.sort === 'object' && def.sort !== null) ? (def.sort as any).sort : def.sort || null,
      sortIndex: def.sortIndex ?? undefined,
      aggFunc: typeof def.aggFunc === 'string' ? def.aggFunc : null
    };
    this.columns.set(colId, column);
  }
  
  private getRowId(data: TData, index: number): string {
    // 1. Try custom callback from gridOptions
    if (this.gridOptions?.getRowId) {
      return this.gridOptions.getRowId({ data });
    }

    // 2. Try to get ID from data, fallback to index
    const anyData = data as any;
    return anyData?.id?.toString() || anyData?.Id?.toString() || `row-${index}`;
  }
  
  private createGridApi(): GridApi<TData> {
    return {
      // Column API
      getColumnDefs: () => this.columnDefs,
      setColumnDefs: (colDefs) => {
        this.columnDefs = colDefs;
        this.groupingDirty = true;
        this.initializeColumns();
      },
      getColumn: (key) => {
        const colId = typeof key === 'string' ? key : key.colId;
        return this.columns.get(colId) || null;
      },
      getAllColumns: () => Array.from(this.columns.values()),
      getDisplayedRowAtIndex: (index) => {
        return this.displayedRowNodes[index] || null;
      },
      
      // Row Data API
      getRowData: () => [...this.filteredRowData],
      setRowData: (rowData) => {
        this.rowData = rowData;
        this.filteredRowData = [...rowData];
        this.groupingDirty = true;
        this.applySorting();
        this.applyFiltering();
      },
      applyTransaction: (transaction) => this.applyTransaction(transaction),
      getDisplayedRowCount: () => this.displayedRowNodes.length,
      getAggregations: () => this.calculateColumnAggregations(this.filteredRowData),
      getRowNode: (id) => this.rowNodes.get(id) || null,
      
      // Selection API
      getSelectedRows: () => Array.from(this.rowNodes.values()).filter(n => n.selected),
      getSelectedNodes: () => Array.from(this.rowNodes.values()).filter(n => n.selected),
      selectAll: () => {
        this.rowNodes.forEach(node => {
          node.selected = true;
          this.selectedRows.add(node.id!);
        });
        this.gridStateChanged$.next({ type: 'selectionChanged' });
      },
      deselectAll: () => {
        this.rowNodes.forEach(node => {
          node.selected = false;
        });
        this.selectedRows.clear();
        this.gridStateChanged$.next({ type: 'selectionChanged' });
      },
      
      // Filter API
      setFilterModel: (model) => {
        this.filterModel = model;
        this.applyFiltering();
        this.gridStateChanged$.next({ type: 'filterChanged' });
      },
      getFilterModel: () => ({ ...this.filterModel }),
      onFilterChanged: () => {
        this.applyFiltering();
        this.gridStateChanged$.next({ type: 'filterChanged' });
      },
      isFilterPresent: () => Object.keys(this.filterModel).length > 0,
      
      // Sort API
      setSortModel: (model) => {
        this.sortModel = model;
        this.applySorting();
        this.applyFiltering(); // Re-filter and re-group after sort
        this.gridStateChanged$.next({ type: 'sortChanged' });
      },
      getSortModel: () => [...this.sortModel],
      onSortChanged: () => {
        this.applySorting();
        this.applyFiltering(); // Re-filter and re-group after sort
        this.gridStateChanged$.next({ type: 'sortChanged' });
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
      getGridOption: (key) => this.gridOptions ? this.gridOptions[key] : undefined as any,
      setGridOption: (key, value) => {
        if (!this.gridOptions) {
          this.gridOptions = {} as GridOptions<TData>;
        }
        this.gridOptions[key] = value;
        this.gridStateChanged$.next({ type: 'optionChanged', key: key as string, value });
      },
      
      // Group Expansion
      setRowNodeExpanded: (node, expanded) => {
        if (node.id && (node.group || node.master)) {
          if (expanded) {
            this.expandedGroups.add(node.id);
          } else {
            this.expandedGroups.delete(node.id);
          }
          
          if (node.group) {
            this.applyGrouping();
          } else {
            this.initializeRowNodesFromFilteredData();
          }
          
          this.gridStateChanged$.next({ type: 'groupExpanded', value: expanded });
        }
      },

      // Row Height API
      getRowY: (index) => this.getRowY(index),
      getRowAtY: (y) => this.getRowAtY(y),
      getTotalHeight: () => this.getTotalHeight(),

      // Pivot API
      setPivotMode: (pivotMode) => {
        if (this.isPivotMode !== pivotMode) {
          this.isPivotMode = pivotMode;
          this.groupingDirty = true;
          this.cachedGroupedData = null;
          this.applyGrouping();
          this.initializeColumns();
          this.gridStateChanged$.next({ type: 'pivotModeChanged', value: pivotMode });
        }
      },
      isPivotMode: () => this.isPivotMode,
      
      // Range Selection API
      getCellRanges: () => this.cellRanges.length > 0 ? [...this.cellRanges] : null,
      addCellRange: (range) => {
        this.cellRanges = [range]; // For now only support single range
        this.gridStateChanged$.next({ type: 'rangeSelectionChanged' });
      },
      clearRangeSelection: () => {
        if (this.cellRanges.length > 0) {
          this.cellRanges = [];
          this.gridStateChanged$.next({ type: 'rangeSelectionChanged' });
        }
      }
    };
  }
  
  private applyTransaction(transaction: RowDataTransaction<TData>): RowDataTransactionResult | null {
    const result: RowDataTransactionResult = {
      add: [],
      update: [],
      remove: []
    };
    
    let dataChanged = false;

    if (transaction.add) {
      transaction.add.forEach((data, index) => {
        const id = this.getRowId(data, this.rowData.length + index);
        this.rowData.push(data);
        dataChanged = true;
        
        // We'll create the actual node during the pipeline re-run
        // but we can return a placeholder result for now as AG Grid does
      });
    }
    
    if (transaction.update) {
      transaction.update.forEach(data => {
        const id = this.getRowId(data, 0);
        const index = this.rowData.findIndex(r => this.getRowId(r, 0) === id);
        if (index !== -1) {
          this.rowData[index] = data;
          dataChanged = true;
          
          const existingNode = this.rowNodes.get(id);
          if (existingNode) {
            existingNode.data = data;
            result.update.push(existingNode);
          }
        }
      });
    }

    if (transaction.remove) {
      transaction.remove.forEach(data => {
        const anyData = data as any;
        const dataId = anyData?.id;
        const id = this.getRowId(data, 0);
        
        const index = this.rowData.findIndex(r => this.getRowId(r, 0) === id);
        if (index !== -1) {
          const removedData = this.rowData.splice(index, 1)[0];
          dataChanged = true;
          
          const node = this.rowNodes.get(id);
          if (node) {
            this.rowNodes.delete(id);
            result.remove.push(node);
          }
        }
      });
    }

    if (dataChanged) {
      this.groupingDirty = true;
      this.applySorting();
      this.applyFiltering();
      
      // Populate result.add after pipeline has run so we have the nodes
      if (transaction.add) {
        transaction.add.forEach(data => {
          const id = this.getRowId(data, 0);
          const node = this.rowNodes.get(id);
          if (node) result.add.push(node);
        });
      }

      this.gridStateChanged$.next({ type: 'transactionApplied' });
    }

    return result;
  }
  
  private applySorting(): void {
    this.groupingDirty = true;
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

    // Also update filtered data if no filter present
    if (Object.keys(this.filterModel).length === 0) {
      this.filteredRowData = [...this.rowData];
    }
  }

  private applyFiltering(): void {
    this.groupingDirty = true;
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

    // Apply grouping after filtering
    this.applyGrouping();
  }

  private updateRowHeightCache(): void {
    const defaultHeight = this.gridOptions?.rowHeight || 32;
    this.cumulativeRowHeights = [];
    let currentTotal = 0;

    this.displayedRowNodes.forEach(node => {
      this.cumulativeRowHeights.push(currentTotal);
      const height = node.rowHeight || defaultHeight;
      currentTotal += height;
    });

    this.totalHeight = currentTotal;
  }

  private getRowY(index: number): number {
    if (index < 0 || index >= this.cumulativeRowHeights.length) return 0;
    return this.cumulativeRowHeights[index];
  }

  private getRowAtY(y: number): number {
    if (this.cumulativeRowHeights.length === 0) return 0;
    
    // Binary search for the row at position y
    let low = 0;
    let high = this.cumulativeRowHeights.length - 1;
    
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const rowY = this.cumulativeRowHeights[mid];
      const nextRowY = mid < this.cumulativeRowHeights.length - 1 ? 
                       this.cumulativeRowHeights[mid + 1] : this.totalHeight;
      
      if (y >= rowY && y < nextRowY) {
        return mid;
      } else if (y < rowY) {
        high = mid - 1;
      } else {
        low = mid + 1;
      }
    }
    
    return low >= this.cumulativeRowHeights.length ? this.cumulativeRowHeights.length - 1 : low;
  }

  private getTotalHeight(): number {
    return this.totalHeight;
  }

  private getGroupColumns(): string[] {
    if (!this.columnDefs) return [];
    
    const groupCols: string[] = [];
    this.columnDefs.forEach(def => {
      if ('rowGroup' in def && def.rowGroup === true && def.field) {
        groupCols.push(def.field as string);
      }
    });
    return groupCols;
  }

  private getPivotColumns(): string[] {
    if (!this.columnDefs) return [];
    
    const pivotCols: string[] = [];
    this.columnDefs.forEach(def => {
      if ('pivot' in def && def.pivot === true && def.field) {
        pivotCols.push(def.field as string);
      }
    });
    return pivotCols;
  }

  private getValueColumns(): ColDef<TData>[] {
    if (!this.columnDefs) return [];
    
    const valueCols: ColDef<TData>[] = [];
    this.columnDefs.forEach(def => {
      if (!('children' in def) && def.aggFunc && def.field) {
        valueCols.push(def);
      }
    });
    return valueCols;
  }

  private generatePivotColumnDefs(): void {
    const pivotColumns = this.getPivotColumns();
    const valueColumns = this.getValueColumns();
    
    if (pivotColumns.length === 0 || valueColumns.length === 0) {
      this.pivotColumnDefs = null;
      return;
    }

    // 1. Find all unique pivot keys
    const pivotKeys = new Set<string>();
    this.filteredRowData.forEach(row => {
      const key = pivotColumns.map(col => (row as any)[col]).join('_');
      pivotKeys.add(key);
    });

    const sortedPivotKeys = Array.from(pivotKeys).sort();

    // 2. Generate column groups for each pivot key
    const newPivotColDefs: (ColDef<TData> | ColGroupDef<TData>)[] = [];

    sortedPivotKeys.forEach(pivotKey => {
      const children: ColDef<TData>[] = valueColumns.map(valCol => ({
        ...valCol,
        colId: `pivot_${pivotKey}_${String(valCol.field)}`,
        headerName: valCol.headerName || String(valCol.field),
        // We use a custom field accessor for pivoted data
        field: `pivotData.${pivotKey}.${String(valCol.field)}` as any,
        pivot: false, // These are the results, not the pivot sources
        rowGroup: false
      }));

      newPivotColDefs.push({
        headerName: pivotKey,
        children: children
      });
    });

    this.pivotColumnDefs = newPivotColDefs;
  }

  private applyGrouping(): void {
    const groupColumns = this.getGroupColumns();
    
    if (groupColumns.length === 0) {
      // No grouping, use filtered data
      this.cachedGroupedData = null;
      this.groupingDirty = true;
      this.initializeRowNodesFromFilteredData();
      return;
    }

    // Only re-group if filters or data changed
    if (this.groupingDirty || !this.cachedGroupedData) {
      this.cachedGroupedData = this.groupByColumns(this.filteredRowData, groupColumns, 0);
      
      if (this.isPivotMode) {
        this.generatePivotColumnDefs();
        this.initializeColumns(); // Re-initialize with new pivot columns
        this.gridStateChanged$.next({ type: 'columnsChanged' });
      }
      
      this.groupingDirty = false;
    }

    // Re-initialize from cache (respects current expansion state)
    this.updateExpansionStateInCache(this.cachedGroupedData);
    this.initializeRowNodesFromGroupedData();
  }

  private updateExpansionStateInCache(groupedData: (TData | GroupRowNode<TData>)[]): void {
    for (const item of groupedData) {
      if (this.isGroupRowNode(item)) {
        item.expanded = this.expandedGroups.has(item.id);
        this.updateExpansionStateInCache(item.children);
      }
    }
  }

  private groupByColumns(
    data: TData[],
    groupColumns: string[],
    level: number
  ): (TData | GroupRowNode<TData>)[] {
    if (level >= groupColumns.length || data.length === 0) {
      return data;
    }

    const groupField = groupColumns[level];
    const groups = new Map<any, TData[]>();

    // Group data by the current field
    data.forEach(item => {
      const key = (item as any)[groupField];
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(item);
    });

    // Create group nodes
    const result: (TData | GroupRowNode<TData>)[] = [];
    groups.forEach((items, key) => {
      const children = this.groupByColumns(items, groupColumns, level + 1);
      
      const groupNode: GroupRowNode<TData> = {
        id: `group-${groupField}-${key}-${level}`,
        groupKey: key,
        groupField,
        level,
        children,
        expanded: this.expandedGroups.has(`group-${groupField}-${key}-${level}`),
        aggregation: this.calculateAggregations(items, groupField),
        pivotData: this.isPivotMode ? this.calculatePivotData(items) : undefined
      };
      
      result.push(groupNode);
    });

    return result;
  }

  private calculateAggregations(data: TData[], groupField: string): { [field: string]: any } {
    return this.calculateColumnAggregations(data);
  }

  private calculatePivotData(data: TData[]): { [pivotKey: string]: { [field: string]: any } } {
    const pivotColumns = this.getPivotColumns();
    const pivotGroups = new Map<string, TData[]>();

    // Sub-group by pivot columns within this row group
    data.forEach(item => {
      const key = pivotColumns.map(col => (item as any)[col]).join('_');
      if (!pivotGroups.has(key)) {
        pivotGroups.set(key, []);
      }
      pivotGroups.get(key)!.push(item);
    });

    const pivotData: { [pivotKey: string]: { [field: string]: any } } = {};
    pivotGroups.forEach((items, key) => {
      pivotData[key] = this.calculateColumnAggregations(items);
    });

    return pivotData;
  }

  public calculateColumnAggregations(data: TData[]): { [field: string]: any } {
    const aggregations: { [field: string]: any } = {};
    
    if (!this.columnDefs) return aggregations;

    this.columnDefs.forEach(def => {
      // Skip column groups
      if ('children' in def) return;
      
      if (!def.field || !def.aggFunc) return;
      
      const field = def.field as string;
      const values = data.map(item => (item as any)[field]).filter(v => v !== null && v !== undefined);
      
      if (values.length === 0) return;

      if (typeof def.aggFunc === 'function') {
        // Custom aggregation function
        aggregations[field] = def.aggFunc({ values, data });
      } else {
        // Built-in aggregation functions
        switch (def.aggFunc) {
          case 'sum':
            aggregations[field] = values.reduce((sum, v) => sum + (Number(v) || 0), 0);
            break;
          case 'avg':
            aggregations[field] = values.reduce((sum, v) => sum + (Number(v) || 0), 0) / values.length;
            break;
          case 'min':
            aggregations[field] = Math.min(...values.map(v => Number(v) || 0));
            break;
          case 'max':
            aggregations[field] = Math.max(...values.map(v => Number(v) || 0));
            break;
          case 'count':
            aggregations[field] = values.length;
            break;
          default:
            aggregations[field] = values[0];
        }
      }
    });

    return aggregations;
  }

  private initializeRowNodesFromGroupedData(): void {
    // DO NOT CLEAR this.rowNodes - reuse existing nodes to preserve state
    this.displayedRowNodes = [];
    const flattened = this.flattenGroupedDataWithLevel(this.cachedGroupedData || []);
    
    flattened.forEach((entry, index) => {
      const { item, level } = entry;
      let id: string;
      let data: TData;
      let isGroup = false;
      let expanded = false;

      if (this.isGroupRowNode(item)) {
        // Group node
        id = item.id;
        // Re-use aggregation data from the group node
        data = { 
          ...item.aggregation,
          pivotData: item.pivotData,
          [item.groupField]: item.groupKey,
          'ag-Grid-AutoColumn': item.groupKey 
        } as TData;
        isGroup = true;
        expanded = item.expanded;
      } else {
        // Regular data node - IMPORTANT: DO NOT CLONE DATA
        id = this.getRowId(item, index);
        data = item;
      }

      // Check if we already have this node
      let node = this.rowNodes.get(id);
      if (node) {
        // Update existing node properties
        node.data = data;
        node.expanded = expanded;
        node.group = isGroup;
        node.level = level;
        node.rowIndex = index;
        node.displayedRowIndex = index;
        node.firstChild = index === 0;
        node.lastChild = index === flattened.length - 1;
      } else {
        // Create new node only if it doesn't exist
        node = {
          id,
          data,
          rowPinned: false,
          rowHeight: null,
          displayed: true,
          selected: this.selectedRows.has(id),
          expanded,
          group: isGroup,
          level,
          firstChild: index === 0,
          lastChild: index === flattened.length - 1,
          rowIndex: index,
          displayedRowIndex: index
        };
        this.rowNodes.set(id, node);
      }
      
      this.displayedRowNodes.push(node);
    });

    this.updateRowHeightCache();
  }

  private isGroupRowNode(item: any): item is GroupRowNode<TData> {
    return item && 'groupKey' in item;
  }

  private flattenGroupedDataWithLevel(
    groupedData: (TData | GroupRowNode<TData>)[],
    level: number = 0,
    result: { item: TData | GroupRowNode<TData>, level: number }[] = []
  ): { item: TData | GroupRowNode<TData>, level: number }[] {
    for (const item of groupedData) {
      result.push({ item, level });
      
      if (this.isGroupRowNode(item)) {
        if (item.expanded) {
          this.flattenGroupedDataWithLevel(item.children, level + 1, result);
        }
      }
    }
    return result;
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
    this.groupingDirty = true;
    // DO NOT CLEAR this.rowNodes - reuse existing nodes
    this.displayedRowNodes = [];
    
    // Separate rows by pinned state
    const pinnedTopRows: TData[] = [];
    const pinnedBottomRows: TData[] = [];
    const normalRows: TData[] = [];
    
    this.filteredRowData.forEach(data => {
      const anyData = data as any;
      const pinned = anyData?.pinned;
      
      if (pinned === 'top') {
        pinnedTopRows.push(data);
      } else if (pinned === 'bottom') {
        pinnedBottomRows.push(data);
      } else {
        normalRows.push(data);
      }
    });
    
    const orderedRows = [...pinnedTopRows, ...normalRows, ...pinnedBottomRows];

    orderedRows.forEach((data, index) => {
      const id = this.getRowId(data, index);
      const anyData = data as any;
      const rowPinned = anyData?.pinned || false;
      const isMaster = this.gridOptions?.masterDetail && 
                      (this.gridOptions.isRowMaster ? this.gridOptions.isRowMaster(data) : true);

      let node = this.rowNodes.get(id);
      if (node) {
        node.data = data;
        node.rowPinned = rowPinned;
        node.master = isMaster;
        node.expanded = this.expandedGroups.has(id);
        node.rowIndex = index;
        node.displayedRowIndex = this.displayedRowNodes.length;
        node.firstChild = index === 0;
        node.lastChild = index === orderedRows.length - 1;
      } else {
        node = {
          id,
          data,
          rowPinned,
          rowHeight: null,
          displayed: true,
          selected: this.selectedRows.has(id),
          expanded: this.expandedGroups.has(id!),
          group: false,
          master: isMaster,
          level: 0,
          firstChild: index === 0,
          lastChild: index === orderedRows.length - 1,
          rowIndex: index,
          displayedRowIndex: this.displayedRowNodes.length
        };
        this.rowNodes.set(id!, node);
      }
      
      this.displayedRowNodes.push(node);

      // If master row is expanded, insert a detail node
      if (isMaster && node.expanded) {
        const detailId = `${id}-detail`;
        let detailNode = this.rowNodes.get(detailId);
        if (!detailNode) {
          detailNode = {
            id: detailId,
            data: data, // Detail node shares master data
            rowPinned: false,
            rowHeight: this.gridOptions?.detailRowHeight || 200,
            displayed: true,
            selected: false,
            expanded: false,
            group: false,
            detail: true,
            masterRowNode: node,
            level: 1,
            firstChild: false,
            lastChild: false,
            rowIndex: null,
            displayedRowIndex: this.displayedRowNodes.length
          };
          this.rowNodes.set(detailId, detailNode);
        } else {
          detailNode.displayedRowIndex = this.displayedRowNodes.length;
        }
        this.displayedRowNodes.push(detailNode);
      }
    });

    this.updateRowHeightCache();
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

    // Get pinned columns
    const allColumns = Array.from(this.columns.values());
    const leftPinned = allColumns.filter(c => c.pinned === 'left').map(c => c.colId);
    const rightPinned = allColumns.filter(c => c.pinned === 'right').map(c => c.colId);

    return {
      sort: { sortModel: [...this.sortModel] },
      filter: filterState,
      columnPinning: { left: leftPinned, right: rightPinned },
      columnOrder: allColumns.map(col => ({
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
    const delimiter = params?.delimiter || ',';
    const skipHeader = params?.skipHeader || false;
    const columnKeys = params?.columnKeys;

    // Get columns to export
    let columnsToExport = this.getAllColumns().filter(col => col.visible);
    if (columnKeys && columnKeys.length > 0) {
      columnsToExport = columnsToExport.filter(col => columnKeys.includes(col.colId));
    }

    // Build headers
    const headers = columnsToExport.map(col => {
      const headerName = col.headerName || col.colId;
      // Escape quotes and wrap in quotes if contains delimiter
      if (headerName.includes(delimiter) || headerName.includes('"') || headerName.includes('\n')) {
        return '"' + headerName.replace(/"/g, '""') + '"';
      }
      return headerName;
    });

    // Build rows
    const rows = this.rowData.map(data => {
      return columnsToExport.map(col => {
        const value = (data as any)[col.field!];
        let cellValue = '';
        
        if (value !== null && value !== undefined) {
          cellValue = String(value);
        }
        
        // Escape quotes and wrap in quotes if contains special chars
        if (cellValue.includes(delimiter) || cellValue.includes('"') || cellValue.includes('\n')) {
          return '"' + cellValue.replace(/"/g, '""') + '"';
        }
        return cellValue;
      });
    });

    // Build CSV content
    let csvContent = '';
    if (!skipHeader) {
      csvContent += headers.join(delimiter) + '\n';
    }
    csvContent += rows.map(row => row.join(delimiter)).join('\n');

    // Download CSV
    this.downloadFile(csvContent, fileName, 'text/csv;charset=utf-8;');
  }

  private exportAsExcel(params?: ExcelExportParams): void {
    const fileName = params?.fileName || 'export.xlsx';
    const sheetName = params?.sheetName || 'Sheet1';
    const skipHeader = params?.skipHeader || false;

    // Get columns to export
    let columnsToExport = this.getAllColumns().filter(col => col.visible);
    if (params?.columnKeys && params.columnKeys.length > 0) {
      columnsToExport = columnsToExport.filter(col => params.columnKeys!.includes(col.colId));
    }

    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet(sheetName);

    // Add headers
    if (!skipHeader) {
      const headerRow = worksheet.addRow(columnsToExport.map(col => col.headerName || col.colId));
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF0F0F0' }
      };
    }

    // Add data
    this.rowData.forEach(data => {
      const rowValues = columnsToExport.map(col => {
        const value = (data as any)[col.field!];
        return value !== null && value !== undefined ? value : '';
      });
      worksheet.addRow(rowValues);
    });

    // Auto-fit columns (basic implementation)
    worksheet.columns.forEach((column, i) => {
      let maxLength = 0;
      column.eachCell!({ includeEmpty: true }, (cell) => {
        const columnLength = cell.value ? cell.value.toString().length : 10;
        if (columnLength > maxLength) {
          maxLength = columnLength;
        }
      });
      column.width = Math.min(50, Math.max(10, maxLength + 2));
    });

    // Generate buffer and download
    workbook.xlsx.writeBuffer().then(buffer => {
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(url);
    });
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
