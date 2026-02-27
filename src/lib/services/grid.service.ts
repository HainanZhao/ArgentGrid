import { Injectable, Inject, Optional } from '@angular/core';
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
  ExcelExportParams,
  GroupRowNode
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
  private groupedRowData: (TData | GroupRowNode<TData>)[] = [];
  private selectedRows: Set<string> = new Set();
  private expandedGroups: Set<string> = new Set();
  private gridId: string = '';
  private gridOptions: GridOptions<TData> | null = null;
  
  createApi(
    columnDefs: (ColDef<TData> | ColGroupDef<TData>)[] | null,
    rowData: TData[] | null,
    gridOptions?: GridOptions<TData> | null
  ): GridApi<TData> {
    this.columnDefs = columnDefs;
    this.rowData = rowData ? [...rowData] : [];
    this.filteredRowData = [...this.rowData];
    this.groupedRowData = [];
    this.displayedRowNodes = [];
    this.gridId = this.generateGridId();
    this.gridOptions = gridOptions || null;

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
    this.columnDefs.forEach((def, index) => {
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
  
  private initializeRowNodes(): void {
    this.rowNodes.clear();
    this.displayedRowNodes = [];
    
    // Separate rows by pinned state
    const pinnedTopRows: TData[] = [];
    const pinnedBottomRows: TData[] = [];
    const normalRows: TData[] = [];
    
    this.rowData.forEach(data => {
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
    
    // Combine in order: pinned top, normal, pinned bottom
    const orderedRows = [...pinnedTopRows, ...normalRows, ...pinnedBottomRows];
    
    orderedRows.forEach((data, index) => {
      const id = this.getRowId(data, index);
      const anyData = data as any;
      const rowPinned = anyData?.pinned || false;
      
      const node: IRowNode<TData> = {
        id,
        data,
        rowPinned,
        rowHeight: null,
        displayed: true,
        selected: this.selectedRows.has(id),
        expanded: false,
        group: false,
        level: 0,
        firstChild: index === 0,
        lastChild: index === orderedRows.length - 1,
        rowIndex: index,
        displayedRowIndex: index
      };
      this.rowNodes.set(id, node);
      this.displayedRowNodes.push(node);
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
        return this.displayedRowNodes[index] || null;
      },
      
      // Row Data API
      getRowData: () => [...this.filteredRowData],
      setRowData: (rowData) => {
        this.rowData = rowData;
        this.filteredRowData = [...rowData];
        this.groupedRowData = [];
        this.initializeRowNodes();
      },
      applyTransaction: (transaction) => this.applyTransaction(transaction),
      getDisplayedRowCount: () => Array.from(this.rowNodes.values()).filter(n => n.displayed).length,
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
      getGridOption: (key) => this.gridOptions ? this.gridOptions[key] : undefined as any,
      setGridOption: (key, value) => {
        if (this.gridOptions) {
          this.gridOptions[key] = value;
        } else {
          this.gridOptions = { [key]: value } as GridOptions<TData>;
        }
      },
      
      // Group Expansion
      setRowNodeExpanded: (node, expanded) => {
        if (node.id && node.group) {
          if (expanded) {
            this.expandedGroups.add(node.id);
          } else {
            this.expandedGroups.delete(node.id);
          }
          this.applyGrouping();
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
    
    if (transaction.add) {
      transaction.add.forEach((data, index) => {
        const id = this.getRowId(data, this.rowData.length + index);
        this.rowData.push(data);
        this.filteredRowData.push(data);
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
        const id = this.getRowId(data, 0); // Note: index doesn't matter for id lookup if data has id
        
        const existingNode = this.rowNodes.get(id);
        if (existingNode) {
          existingNode.data = data;
          
          // Also update in the original rowData array to persist across sorts/filters
          const index = this.rowData.findIndex(r => this.getRowId(r, 0) === id);
          if (index !== -1) {
            this.rowData[index] = data;
          }
          
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

    // Also update filtered data
    this.filteredRowData = [...this.rowData];

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

    // Apply grouping after filtering
    this.applyGrouping();
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

  private applyGrouping(): void {
    const groupColumns = this.getGroupColumns();
    
    if (groupColumns.length === 0) {
      // No grouping, use filtered data
      this.groupedRowData = [];
      this.initializeRowNodesFromFilteredData();
      return;
    }

    // Group data hierarchically
    this.groupedRowData = this.groupByColumns(this.filteredRowData, groupColumns, 0);
    this.initializeRowNodesFromGroupedData();
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
        aggregation: this.calculateAggregations(items, groupField)
      };
      
      result.push(groupNode);
    });

    return result;
  }

  private calculateAggregations(data: TData[], groupField: string): { [field: string]: any } {
    return this.calculateColumnAggregations(data);
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
    this.rowNodes.clear();
    this.displayedRowNodes = [];
    const flatRows = this.flattenGroupedData(this.groupedRowData);
    
    flatRows.forEach((item, index) => {
      // ... (code omitted for brevity in thought, but I'll provide full function)
      let id: string;
      let data: TData;
      let isGroup = false;
      let level = 0;
      let expanded = false;

      if (this.isGroupRowNode(item)) {
        // Group node
        const groupNode = item;
        id = groupNode.id;
        // Create synthetic data for group row
        data = { 
          ...groupNode.aggregation,
          [groupNode.groupField]: groupNode.groupKey,
          'ag-Grid-AutoColumn': groupNode.groupKey 
        } as TData;
        isGroup = true;
        level = groupNode.level;
        expanded = groupNode.expanded;
      } else {
        // Regular data node
        id = this.getRowId(item, index);
        data = { ...item, 'ag-Grid-AutoColumn': '' } as any;
      }

      const node: IRowNode<TData> = {
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
        lastChild: index === flatRows.length - 1,
        rowIndex: index,
        displayedRowIndex: index
      };
      this.rowNodes.set(id, node);
      this.displayedRowNodes.push(node);
    });
  }

  private isGroupRowNode(item: any): item is GroupRowNode<TData> {
    return item && 'groupKey' in item;
  }

  private flattenGroupedData(
    groupedData: (TData | GroupRowNode<TData>)[],
    result: (TData | GroupRowNode<TData>)[] = []
  ): (TData | GroupRowNode<TData>)[] {
    for (const item of groupedData) {
      result.push(item);
      
      if (this.isGroupRowNode(item)) {
        const groupNode = item;
        if (groupNode.expanded) {
          this.flattenGroupedData(groupNode.children, result);
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
    this.rowNodes.clear();
    this.displayedRowNodes = [];
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
      this.displayedRowNodes.push(node);
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

    // Build HTML table (Excel can open this as .xlsx)
    let htmlContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" 
            xmlns:x="urn:schemas-microsoft-com:office:excel" 
            xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="UTF-8">
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>${sheetName}</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          table { border-collapse: collapse; }
          th, td { border: 1px solid #000; padding: 4px 8px; }
          th { background-color: #f0f0f0; font-weight: bold; }
        </style>
      </head>
      <body>
        <table>
    `;

    // Add headers
    if (!skipHeader) {
      htmlContent += '<thead><tr>';
      columnsToExport.forEach(col => {
        htmlContent += `<th>${col.headerName || col.colId}</th>`;
      });
      htmlContent += '</tr></thead>';
    }

    // Add rows
    htmlContent += '<tbody>';
    this.rowData.forEach(data => {
      htmlContent += '<tr>';
      columnsToExport.forEach(col => {
        const value = (data as any)[col.field!];
        const cellValue = value !== null && value !== undefined ? String(value) : '';
        htmlContent += `<td>${cellValue}</td>`;
      });
      htmlContent += '</tr>';
    });
    htmlContent += '</tbody></table></body></html>';

    // Download as .xlsx (Excel will open the HTML table)
    this.downloadFile(htmlContent, fileName, 'application/vnd.ms-excel;charset=utf-8;');
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
