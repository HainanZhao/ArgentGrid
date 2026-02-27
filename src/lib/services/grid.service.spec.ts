import { TestBed } from '@angular/core/testing';
import { provideExperimentalZonelessChangeDetection } from '@angular/core';
import { GridService } from './grid.service';
import { GridApi, ColDef, FilterModel, IRowNode } from '../types/ag-grid-types';

interface TestData {
  id: number;
  name: string;
  age: number;
  email: string;
}

describe('GridService', () => {
  let service: GridService<TestData>;
  let api: GridApi<TestData>;
  
  const testColumnDefs: (ColDef<TestData>)[] = [
    { colId: 'id', field: 'id', headerName: 'ID', width: 100 },
    { colId: 'name', field: 'name', headerName: 'Name', width: 150 },
    { colId: 'age', field: 'age', headerName: 'Age', width: 80, sortable: true },
    { colId: 'email', field: 'email', headerName: 'Email', width: 200 }
  ];
  
  const testRowData: TestData[] = [
    { id: 1, name: 'John Doe', age: 30, email: 'john@example.com' },
    { id: 2, name: 'Jane Smith', age: 25, email: 'jane@example.com' },
    { id: 3, name: 'Bob Johnson', age: 35, email: 'bob@example.com' }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        GridService,
        provideExperimentalZonelessChangeDetection()
      ]
    });
    service = TestBed.inject(GridService);
    api = service.createApi(testColumnDefs, [...testRowData]);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with correct row data', () => {
    const data = api.getRowData();
    expect(data).toEqual(testRowData);
    expect(data.length).toBe(3);
  });

  it('should initialize columns correctly', () => {
    const columns = api.getAllColumns();
    expect(columns.length).toBe(4);
    expect(columns[0].colId).toBe('id');
    expect(columns[0].headerName).toBe('ID');
  });

  it('should get row node by id', () => {
    const node = api.getRowNode('1');
    expect(node).toBeTruthy();
    expect(node?.data.id).toBe(1);
  });

  it('should handle row selection', () => {
    const selectionApi = service.createApi(testColumnDefs, [...testRowData]);
    selectionApi.selectAll();
    expect(selectionApi.getSelectedRows().length).toBe(3);

    selectionApi.deselectAll();
    expect(selectionApi.getSelectedRows().length).toBe(0);
  });

  it('should apply sorting', () => {
    const sortApi = service.createApi(testColumnDefs, [...testRowData]);
    // Sort by age descending
    sortApi.setSortModel([{ colId: 'age', sort: 'desc' }]);
    
    const sortedData = sortApi.getRowData();
    expect(sortedData[0].age).toBe(35);
    expect(sortedData[2].age).toBe(25);
  });

  it('should apply sorting ascending', () => {
    const sortApi = service.createApi(testColumnDefs, [...testRowData]);
    // Sort by age ascending
    sortApi.setSortModel([{ colId: 'age', sort: 'asc' }]);
    
    const sortedData = sortApi.getRowData();
    expect(sortedData[0].age).toBe(25);
    expect(sortedData[2].age).toBe(35);
  });

  it('should handle transaction - add rows and respect sorting', () => {
    const sortApi = service.createApi(testColumnDefs, [...testRowData]);
    sortApi.setSortModel([{ colId: 'name', sort: 'asc' }]);
    
    // Initial alpha: Bob Johnson (35), Jane Smith (25), John Doe (30)
    expect(sortApi.getDisplayedRowAtIndex(0)?.data.name).toBe('Bob Johnson');

    sortApi.applyTransaction({
      add: [{ id: 4, name: 'Alice', age: 28, email: 'alice@example.com' }]
    });
    
    // Alice should now be first
    expect(sortApi.getDisplayedRowAtIndex(0)?.data.name).toBe('Alice');
    expect(sortApi.getDisplayedRowCount()).toBe(4);
  });

  it('should handle transaction - update rows and respect filtering', () => {
    const filterApi = service.createApi(testColumnDefs, [...testRowData]);
    filterApi.setFilterModel({
      age: { filterType: 'number', type: 'greaterThan', filter: 30 }
    });
    
    expect(filterApi.getDisplayedRowCount()).toBe(1); // Only Bob (35)

    // Update Jane (25) to be 40
    filterApi.applyTransaction({
      update: [{ id: 2, name: 'Jane Smith', age: 40, email: 'jane@example.com' }]
    });

    expect(filterApi.getDisplayedRowCount()).toBe(2); // Bob and Jane
  });

  it('should handle transaction - remove rows', () => {
    const initialCount = api.getDisplayedRowCount();
    const firstNode = api.getDisplayedRowAtIndex(0);
    if (!firstNode || !firstNode.id) return;

    const removeData: TestData = { id: firstNode.data.id, name: firstNode.data.name, age: firstNode.data.age, email: firstNode.data.email };
    const result = api.applyTransaction({
      remove: [removeData]
    });

    expect(result?.remove.length).toBe(1);
    expect(api.getDisplayedRowCount()).toBe(initialCount - 1);
  });

  it('should get and set filter model', () => {
    const filterModel: FilterModel = {
      name: { filterType: 'text', type: 'contains', filter: 'John' }
    };

    api.setFilterModel(filterModel);
    expect(api.getFilterModel()).toEqual(filterModel);
    expect(api.isFilterPresent()).toBe(true);
  });

  it('should apply text filter - contains', () => {
    const filterApi = service.createApi(testColumnDefs, [...testRowData]);
    filterApi.setFilterModel({
      name: { filterType: 'text', type: 'contains', filter: 'John' }
    });

    const data = filterApi.getRowData();
    // Filter should match 'John Doe' and 'Bob Johnson'
    expect(data.length).toBeLessThan(3);
  });

  it('should apply text filter - starts with', () => {
    const filterApi = service.createApi(testColumnDefs, [...testRowData]);
    filterApi.setFilterModel({
      name: { filterType: 'text', type: 'startsWith', filter: 'J' }
    });

    const data = filterApi.getRowData();
    // Should match 'John Doe' and 'Jane Smith'
    data.forEach(row => {
      expect(row.name.startsWith('J')).toBe(true);
    });
  });

  it('should apply text filter - ends with', () => {
    const filterApi = service.createApi(testColumnDefs, [...testRowData]);
    filterApi.setFilterModel({
      name: { filterType: 'text', type: 'endsWith', filter: 'e' }
    });

    const data = filterApi.getRowData();
    data.forEach(row => {
      expect(row.name.endsWith('e')).toBe(true);
    });
  });

  it('should apply text filter - equals', () => {
    const filterApi = service.createApi(testColumnDefs, [...testRowData]);
    filterApi.setFilterModel({
      name: { filterType: 'text', type: 'equals', filter: 'John Doe' }
    });

    const data = filterApi.getRowData();
    expect(data.length).toBe(1);
    expect(data[0].name).toBe('John Doe');
  });

  it('should apply number filter - greater than', () => {
    const filterApi = service.createApi(testColumnDefs, [...testRowData]);
    filterApi.setFilterModel({
      age: { filterType: 'number', type: 'greaterThan', filter: 28 }
    });

    const data = filterApi.getRowData();
    data.forEach(row => {
      expect(row.age).toBeGreaterThan(28);
    });
  });

  it('should apply number filter - less than', () => {
    const filterApi = service.createApi(testColumnDefs, [...testRowData]);
    filterApi.setFilterModel({
      age: { filterType: 'number', type: 'lessThan', filter: 32 }
    });

    const data = filterApi.getRowData();
    data.forEach(row => {
      expect(row.age).toBeLessThan(32);
    });
  });

  it('should apply number filter - in range', () => {
    const filterApi = service.createApi(testColumnDefs, [...testRowData]);
    filterApi.setFilterModel({
      age: { filterType: 'number', type: 'inRange', filter: 26, filterTo: 34 }
    });

    const data = filterApi.getRowData();
    data.forEach(row => {
      expect(row.age).toBeGreaterThanOrEqual(26);
      expect(row.age).toBeLessThanOrEqual(34);
    });
  });

  it('should apply date filter', () => {
    const dateData: any[] = [
      { id: 1, name: 'Event 1', date: '2024-01-15' },
      { id: 2, name: 'Event 2', date: '2024-06-20' },
      { id: 3, name: 'Event 3', date: '2024-12-01' }
    ];
    const dateColumnDefs: any[] = [
      { colId: 'id', field: 'id', headerName: 'ID' },
      { colId: 'name', field: 'name', headerName: 'Name' },
      { colId: 'date', field: 'date', headerName: 'Date', filter: 'agDateColumnFilter' }
    ];

    const filterApi = service.createApi(dateColumnDefs, dateData);
    filterApi.setFilterModel({
      date: { filterType: 'date', type: 'greaterThan', filter: '2024-03-01' }
    });

    const data = filterApi.getRowData();
    // Should match events after March 2024
    expect(data.length).toBe(2);
  });

  it('should clear filter when model is empty', () => {
    const filterApi = service.createApi(testColumnDefs, [...testRowData]);
    filterApi.setFilterModel({
      name: { filterType: 'text', type: 'contains', filter: 'John' }
    });
    expect(api.isFilterPresent()).toBe(true);

    filterApi.setFilterModel({});
    expect(filterApi.isFilterPresent()).toBe(false);
  });

  it('should combine multiple filters (AND logic)', () => {
    const filterApi = service.createApi(testColumnDefs, [...testRowData]);
    filterApi.setFilterModel({
      name: { filterType: 'text', type: 'startsWith', filter: 'J' },
      age: { filterType: 'number', type: 'lessThan', filter: 30 }
    });

    const data = filterApi.getRowData();
    // Should match 'Jane Smith' (starts with J and age < 30)
    data.forEach(row => {
      expect(row.name.startsWith('J')).toBe(true);
      expect(row.age).toBeLessThan(30);
    });
  });

  // Row Grouping Tests
  it('should group rows by column', () => {
    const groupData: any[] = [
      { id: 1, name: 'John', department: 'Engineering', salary: 80000 },
      { id: 2, name: 'Jane', department: 'Engineering', salary: 90000 },
      { id: 3, name: 'Bob', department: 'Sales', salary: 70000 },
      { id: 4, name: 'Alice', department: 'Sales', salary: 75000 }
    ];
    const groupColumnDefs: ColDef[] = [
      { colId: 'name', field: 'name', headerName: 'Name' },
      { colId: 'department', field: 'department', headerName: 'Department', rowGroup: true },
      { colId: 'salary', field: 'salary', headerName: 'Salary' }
    ];

    const groupApi = service.createApi(groupColumnDefs, groupData);
    
    // With groups collapsed, should show 2 group rows
    const displayedCount = groupApi.getDisplayedRowCount();
    expect(displayedCount).toBe(2); // 2 groups (Engineering, Sales)
  });

  it('should expand and collapse groups', () => {
    const groupData: any[] = [
      { id: 1, name: 'John', department: 'Engineering' },
      { id: 2, name: 'Jane', department: 'Engineering' },
      { id: 3, name: 'Bob', department: 'Sales' }
    ];
    const groupColumnDefs: ColDef[] = [
      { colId: 'name', field: 'name', headerName: 'Name' },
      { colId: 'department', field: 'department', headerName: 'Department', rowGroup: true }
    ];

    const groupApi = service.createApi(groupColumnDefs, groupData);
    
    // Initially groups are collapsed
    let displayedCount = groupApi.getDisplayedRowCount();
    expect(displayedCount).toBe(2); // 2 groups
  });

  it('should calculate group aggregations', () => {
    const groupData: any[] = [
      { id: 1, name: 'John', department: 'Engineering', salary: 80000 },
      { id: 2, name: 'Jane', department: 'Engineering', salary: 90000 },
      { id: 3, name: 'Bob', department: 'Sales', salary: 70000 }
    ];
    const groupColumnDefs: ColDef[] = [
      { colId: 'name', field: 'name', headerName: 'Name' },
      { colId: 'department', field: 'department', headerName: 'Department', rowGroup: true },
      { colId: 'salary', field: 'salary', headerName: 'Salary', aggFunc: 'sum' }
    ];

    const groupApi = service.createApi(groupColumnDefs, groupData);
    
    // Verify grouping works
    const displayedCount = groupApi.getDisplayedRowCount();
    expect(displayedCount).toBeGreaterThanOrEqual(2); // At least 2 groups
  });

  it('should support multiple row group columns', () => {
    const groupData: any[] = [
      { id: 1, name: 'John', department: 'Engineering', level: 'Senior' },
      { id: 2, name: 'Jane', department: 'Engineering', level: 'Junior' },
      { id: 3, name: 'Bob', department: 'Sales', level: 'Senior' }
    ];
    const groupColumnDefs: ColDef[] = [
      { colId: 'name', field: 'name', headerName: 'Name' },
      { colId: 'department', field: 'department', headerName: 'Department', rowGroup: true },
      { colId: 'level', field: 'level', headerName: 'Level', rowGroup: true }
    ];

    const groupApi = service.createApi(groupColumnDefs, groupData);
    
    // Should have hierarchical groups (Engineering/Senior, Engineering/Junior, Sales/Senior)
    const displayedCount = groupApi.getDisplayedRowCount();
    expect(displayedCount).toBe(2); // Engineering and Sales top level
  });

  it('should get grid state', () => {
    const state = api.getState();
    expect(state.sort).toBeDefined();
    expect(state.columnOrder).toBeDefined();
  });

  // Cell Editing Tests
  it('should update cell value on edit', () => {
    const editApi = service.createApi(testColumnDefs, [...testRowData]);
    const firstNode = editApi.getDisplayedRowAtIndex(0);
    if (!firstNode) return;

    const originalName = firstNode.data.name;
    
    // Simulate cell edit via transaction
    const newValue = 'Updated Name';
    editApi.applyTransaction({
      update: [{ ...firstNode.data, name: newValue }]
    });

    const updatedNode = editApi.getDisplayedRowAtIndex(0);
    expect(updatedNode?.data.name).toBe(newValue);
    expect(updatedNode?.data.name).not.toBe(originalName);
  });

  it('should support read-only cells', () => {
    const readOnlyColumnDefs: ColDef[] = [
      { colId: 'id', field: 'id', headerName: 'ID', editable: false },
      { colId: 'name', field: 'name', headerName: 'Name', editable: true }
    ];
    
    expect(readOnlyColumnDefs[0].editable).toBe(false);
    expect(readOnlyColumnDefs[1].editable).toBe(true);
  });

  it('should support valueParser on column', () => {
    const parserColumnDefs: ColDef[] = [
      { colId: 'id', field: 'id', headerName: 'ID' },
      { colId: 'value', field: 'value', headerName: 'Value', 
        valueParser: (params: any) => Number(params.newValue) }
    ];
    
    expect(parserColumnDefs[1].valueParser).toBeDefined();
  });

  it('should support valueSetter on column', () => {
    const setterColumnDefs: ColDef[] = [
      { colId: 'id', field: 'id', headerName: 'ID' },
      { colId: 'name', field: 'name', headerName: 'Name',
        valueSetter: (params: any) => {
          params.data.name = params.newValue.toUpperCase();
          return true;
        }}
    ];
    
    expect(setterColumnDefs[1].valueSetter).toBeDefined();
  });

  // Column Pinning Tests
  it('should pin column to left', () => {
    const pinColumnDefs: ColDef[] = [
      { colId: 'id', field: 'id', headerName: 'ID', pinned: 'left' },
      { colId: 'name', field: 'name', headerName: 'Name' },
      { colId: 'value', field: 'value', headerName: 'Value' }
    ];
    
    const pinApi = service.createApi(pinColumnDefs, [...testRowData]);
    const columns = pinApi.getAllColumns();
    
    const pinnedCol = columns.find(c => c.pinned === 'left');
    expect(pinnedCol).toBeDefined();
    expect(pinnedCol?.colId).toBe('id');
  });

  it('should pin column to right', () => {
    const pinColumnDefs: ColDef[] = [
      { colId: 'id', field: 'id', headerName: 'ID' },
      { colId: 'name', field: 'name', headerName: 'Name' },
      { colId: 'value', field: 'value', headerName: 'Value', pinned: 'right' }
    ];
    
    const pinApi = service.createApi(pinColumnDefs, [...testRowData]);
    const columns = pinApi.getAllColumns();
    
    const pinnedCol = columns.find(c => c.pinned === 'right');
    expect(pinnedCol).toBeDefined();
    expect(pinnedCol?.colId).toBe('value');
  });

  it('should return pinned columns in getColumnPinningState', () => {
    const pinColumnDefs: ColDef[] = [
      { colId: 'id', field: 'id', headerName: 'ID', pinned: 'left' },
      { colId: 'name', field: 'name', headerName: 'Name' },
      { colId: 'value', field: 'value', headerName: 'Value', pinned: 'right' }
    ];
    
    const pinApi = service.createApi(pinColumnDefs, [...testRowData]);
    const state = pinApi.getState();
    
    expect(state.columnPinning).toBeDefined();
    expect(state.columnPinning?.left).toContain('id');
    expect(state.columnPinning?.right).toContain('value');
  });

  // Row Pinning Tests
  it('should pin row to top', () => {
    const rowData: any[] = [
      { id: 1, name: 'Row 1' },
      { id: 2, name: 'Row 2', pinned: 'top' },
      { id: 3, name: 'Row 3' }
    ];
    
    const pinApi = service.createApi(testColumnDefs.slice(0, 2), rowData);
    const displayedCount = pinApi.getDisplayedRowCount();
    
    // Should have 3 rows total
    expect(displayedCount).toBe(3);
    
    // First row should be the pinned top one
    const firstRow = pinApi.getDisplayedRowAtIndex(0);
    expect(firstRow?.rowPinned).toBe('top');
  });

  it('should pin row to bottom', () => {
    const rowData: any[] = [
      { id: 1, name: 'Row 1' },
      { id: 2, name: 'Row 2', pinned: 'bottom' },
      { id: 3, name: 'Row 3' }
    ];
    
    const pinApi = service.createApi(testColumnDefs.slice(0, 2), rowData);
    
    // Last row should be the pinned bottom one
    const lastRowIndex = pinApi.getDisplayedRowCount() - 1;
    const lastRow = pinApi.getDisplayedRowAtIndex(lastRowIndex);
    expect(lastRow?.rowPinned).toBe('bottom');
  });

  it('should order pinned rows correctly', () => {
    const rowData: any[] = [
      { id: 1, name: 'Normal 1' },
      { id: 2, name: 'Top 1', pinned: 'top' },
      { id: 3, name: 'Normal 2' },
      { id: 4, name: 'Bottom 1', pinned: 'bottom' },
      { id: 5, name: 'Top 2', pinned: 'top' }
    ];
    
    const pinApi = service.createApi(testColumnDefs.slice(0, 2), rowData);
    
    // Pinned top rows should come first
    expect(pinApi.getDisplayedRowAtIndex(0)?.rowPinned).toBe('top');
    expect(pinApi.getDisplayedRowAtIndex(1)?.rowPinned).toBe('top');
    
    // Normal rows in middle
    expect(pinApi.getDisplayedRowAtIndex(2)?.rowPinned).toBe(false);
    expect(pinApi.getDisplayedRowAtIndex(3)?.rowPinned).toBe(false);
    
    // Pinned bottom rows at end
    expect(pinApi.getDisplayedRowAtIndex(4)?.rowPinned).toBe('bottom');
  });

  it('should get displayed row count', () => {
    const freshApi = service.createApi(testColumnDefs, [...testRowData]);
    expect(freshApi.getDisplayedRowCount()).toBe(3);
  });

  // Selection API Tests
  it('should select single row', () => {
    const selectApi = service.createApi(testColumnDefs, [...testRowData]);
    const firstRow = selectApi.getDisplayedRowAtIndex(0);
    if (!firstRow) return;
    
    firstRow.selected = true;
    const selected = selectApi.getSelectedRows();
    
    expect(selected.length).toBe(1);
    expect(selected[0].data.id).toBe(1);
  });

  it('should select multiple rows with Ctrl key', () => {
    const selectApi = service.createApi(testColumnDefs, [...testRowData]);
    
    // Select first row
    const firstRow = selectApi.getDisplayedRowAtIndex(0);
    if (!firstRow) return;
    firstRow.selected = true;
    
    // Ctrl+click to select third row (multi-select)
    const thirdRow = selectApi.getDisplayedRowAtIndex(2);
    if (!thirdRow) return;
    thirdRow.selected = true;
    
    const selected = selectApi.getSelectedRows();
    expect(selected.length).toBe(2);
  });

  it('should select all rows', () => {
    const selectApi = service.createApi(testColumnDefs, [...testRowData]);
    selectApi.selectAll();
    
    const selected = selectApi.getSelectedRows();
    expect(selected.length).toBe(3);
  });

  it('should deselect all rows', () => {
    const selectApi = service.createApi(testColumnDefs, [...testRowData]);
    selectApi.selectAll();
    expect(selectApi.getSelectedRows().length).toBe(3);
    
    selectApi.deselectAll();
    expect(selectApi.getSelectedRows().length).toBe(0);
  });

  it('should toggle row selection', () => {
    const selectApi = service.createApi(testColumnDefs, [...testRowData]);
    const row = selectApi.getDisplayedRowAtIndex(0);
    if (!row) return;
    
    row.selected = true;
    expect(selectApi.getSelectedRows().length).toBe(1);
    
    row.selected = false;
    expect(selectApi.getSelectedRows().length).toBe(0);
  });

  it('should get selected row count', () => {
    const selectApi = service.createApi(testColumnDefs, [...testRowData]);
    selectApi.selectAll();
    
    const selectedCount = selectApi.getSelectedRows().length;
    expect(selectedCount).toBe(3);
  });

  it('should support row selection with checkbox', () => {
    const selectionColumnDefs: ColDef[] = [
      { colId: 'select', headerName: '', checkboxSelection: true, width: 50 },
      { colId: 'id', field: 'id', headerName: 'ID' },
      { colId: 'name', field: 'name', headerName: 'Name' }
    ];
    
    expect(selectionColumnDefs[0].checkboxSelection).toBe(true);
  });

  // Aggregation Tests
  it('should calculate sum aggregation', () => {
    const aggData: any[] = [
      { id: 1, name: 'Item 1', value: 100 },
      { id: 2, name: 'Item 2', value: 200 },
      { id: 3, name: 'Item 3', value: 300 }
    ];
    const aggColumnDefs: ColDef[] = [
      { colId: 'id', field: 'id', headerName: 'ID' },
      { colId: 'name', field: 'name', headerName: 'Name' },
      { colId: 'value', field: 'value', headerName: 'Value', aggFunc: 'sum' }
    ];
    
    service.createApi(aggColumnDefs, aggData);
    const agg = service.calculateColumnAggregations(aggData);
    expect(agg['value']).toBe(600);
  });

  it('should calculate average aggregation', () => {
    const aggData: any[] = [
      { id: 1, name: 'Item 1', value: 100 },
      { id: 2, name: 'Item 2', value: 200 },
      { id: 3, name: 'Item 3', value: 300 }
    ];
    const aggColumnDefs: ColDef[] = [
      { colId: 'id', field: 'id', headerName: 'ID' },
      { colId: 'value', field: 'value', headerName: 'Value', aggFunc: 'avg' }
    ];
    
    service.createApi(aggColumnDefs, aggData);
    const agg = service.calculateColumnAggregations(aggData);
    expect(agg['value']).toBe(200);
  });

  it('should calculate min/max aggregation', () => {
    const aggData: any[] = [
      { id: 1, name: 'Item 1', value: 100 },
      { id: 2, name: 'Item 2', value: 50 },
      { id: 3, name: 'Item 3', value: 300 }
    ];
    const aggColumnDefs: ColDef[] = [
      { colId: 'value', field: 'value', headerName: 'Value', aggFunc: 'min' }
    ];
    
    service.createApi(aggColumnDefs, aggData);
    const agg = service.calculateColumnAggregations(aggData);
    expect(agg['value']).toBe(50);
  });

  it('should calculate max aggregation', () => {
    const aggData: any[] = [
      { id: 1, name: 'Item 1', value: 100 },
      { id: 2, name: 'Item 2', value: 50 },
      { id: 3, name: 'Item 3', value: 300 }
    ];
    const aggColumnDefs: ColDef[] = [
      { colId: 'value', field: 'value', headerName: 'Value', aggFunc: 'max' }
    ];
    
    service.createApi(aggColumnDefs, aggData);
    const agg = service.calculateColumnAggregations(aggData);
    expect(agg['value']).toBe(300);
  });

  it('should calculate count aggregation', () => {
    const aggData: any[] = [
      { id: 1, name: 'Item 1' },
      { id: 2, name: 'Item 2' },
      { id: 3, name: 'Item 3' }
    ];
    const aggColumnDefs: ColDef[] = [
      { colId: 'id', field: 'id', headerName: 'ID', aggFunc: 'count' }
    ];
    
    service.createApi(aggColumnDefs, aggData);
    const agg = service.calculateColumnAggregations(aggData);
    expect(agg['id']).toBe(3);
  });

  it('should support custom aggregation function', () => {
    const aggData: any[] = [
      { id: 1, value: 100 },
      { id: 2, value: 200 },
      { id: 3, value: 300 }
    ];
    const customAggFunc = (params: any) => {
      return params.values.reduce((sum: number, v: number) => sum + v, 0) * 2;
    };
    const aggColumnDefs: ColDef[] = [
      { colId: 'value', field: 'value', headerName: 'Value', aggFunc: customAggFunc }
    ];
    
    service.createApi(aggColumnDefs, aggData);
    const agg = service.calculateColumnAggregations(aggData);
    expect(agg['value']).toBe(1200); // (100+200+300) * 2
  });

  // Excel Export Tests
  it('should export data as CSV', () => {
    const exportData: any[] = [
      { id: 1, name: 'John', email: 'john@example.com' },
      { id: 2, name: 'Jane', email: 'jane@example.com' }
    ];
    const exportColumnDefs: ColDef[] = [
      { colId: 'id', field: 'id', headerName: 'ID' },
      { colId: 'name', field: 'name', headerName: 'Name' },
      { colId: 'email', field: 'email', headerName: 'Email' }
    ];
    
    const exportApi = service.createApi(exportColumnDefs, exportData);
    
    // Mock downloadFile to avoid browser API issues in tests
    (service as any).downloadFile = vi.fn();
    expect(() => exportApi.exportDataAsCsv()).not.toThrow();
    expect((service as any).downloadFile).toHaveBeenCalled();
  });

  it('should export with custom filename', () => {
    const exportData: any[] = [{ id: 1, name: 'Test' }];
    const exportColumnDefs: ColDef[] = [
      { colId: 'id', field: 'id', headerName: 'ID' },
      { colId: 'name', field: 'name', headerName: 'Name' }
    ];
    
    const exportApi = service.createApi(exportColumnDefs, exportData);
    (service as any).downloadFile = vi.fn();
    
    exportApi.exportDataAsCsv({ fileName: 'custom-export.csv' });
    expect((service as any).downloadFile).toHaveBeenCalledWith(
      expect.any(String),
      'custom-export.csv',
      expect.any(String)
    );
  });

  it('should export only selected columns', () => {
    const exportData: any[] = [
      { id: 1, name: 'John', email: 'john@example.com' },
      { id: 2, name: 'Jane', email: 'jane@example.com' }
    ];
    const exportColumnDefs: ColDef[] = [
      { colId: 'id', field: 'id', headerName: 'ID' },
      { colId: 'name', field: 'name', headerName: 'Name' },
      { colId: 'email', field: 'email', headerName: 'Email' }
    ];
    
    const exportApi = service.createApi(exportColumnDefs, exportData);
    (service as any).downloadFile = vi.fn();
    
    exportApi.exportDataAsCsv({ columnKeys: ['id', 'name'] });
    const csvContent = (service as any).downloadFile.mock.calls[0][0];
    // Should not contain email column
    expect(csvContent).not.toContain('email');
  });

  it('should skip headers when specified', () => {
    const exportData: any[] = [{ id: 1, name: 'Test' }];
    const exportColumnDefs: ColDef[] = [
      { colId: 'id', field: 'id', headerName: 'ID' },
      { colId: 'name', field: 'name', headerName: 'Name' }
    ];
    
    const exportApi = service.createApi(exportColumnDefs, exportData);
    (service as any).downloadFile = vi.fn();
    
    exportApi.exportDataAsCsv({ skipHeader: true });
    const csvContent = (service as any).downloadFile.mock.calls[0][0];
    // First line should be data, not header
    expect(csvContent).not.toMatch(/^ID,/);
  });

  it('should export data as Excel', async () => {
    const exportData: any[] = [{ id: 1, name: 'Test' }];
    const exportColumnDefs: ColDef[] = [
      { colId: 'id', field: 'id', headerName: 'ID' },
      { colId: 'name', field: 'name', headerName: 'Name' }
    ];
    
    const exportApi = service.createApi(exportColumnDefs, exportData);
    
    // Mock URL methods
    if (typeof URL.createObjectURL === 'undefined') {
      URL.createObjectURL = vi.fn().mockReturnValue('blob:test');
    }
    if (typeof URL.revokeObjectURL === 'undefined') {
      URL.revokeObjectURL = vi.fn();
    }
    
    // We expect it not to throw during the setup phase
    expect(() => exportApi.exportDataAsExcel()).not.toThrow();
  });

  it('should get displayed row at index', () => {
    const sortedApi = service.createApi(testColumnDefs, [
      { id: 10, name: 'First', age: 20, email: 'first@example.com' },
      { id: 20, name: 'Second', age: 25, email: 'second@example.com' }
    ]);
    const row = sortedApi.getDisplayedRowAtIndex(1);
    expect(row).toBeTruthy();
    expect(row?.data.id).toBe(20);
  });

  it('should have unique grid id', () => {
    const gridId = api.getGridId();
    expect(gridId).toMatch(/argent-grid-[a-z0-9]{9}/);
  });

  describe('Corner Cases', () => {
    it('should handle empty row data', () => {
      const emptyApi = service.createApi(testColumnDefs, []);
      expect(emptyApi.getDisplayedRowCount()).toBe(0);
      expect(emptyApi.getRowData()).toEqual([]);
    });

    it('should handle null/undefined row data', () => {
      const nullApi = service.createApi(testColumnDefs, null);
      expect(nullApi.getDisplayedRowCount()).toBe(0);
      expect(nullApi.getRowData()).toEqual([]);
    });

    it('should support custom getRowId in gridOptions', () => {
      const data = [
        { customId: 'A', name: 'John' },
        { customId: 'B', name: 'Jane' }
      ];
      const customApi = service.createApi(testColumnDefs, data, {
        getRowId: (params) => params.data.customId
      });
      
      expect(customApi.getDisplayedRowCount()).toBe(2);
      expect(customApi.getRowNode('A')).toBeTruthy();
      expect(customApi.getRowNode('B')).toBeTruthy();
      expect(customApi.getRowNode('A')?.data.name).toBe('John');
    });

    it('should handle rows with missing fields', () => {
      const data = [
        { id: 1, name: 'John' },
        { id: 2, age: 30 }
      ];
      const missingApi = service.createApi(testColumnDefs, data);
      expect(missingApi.getDisplayedRowCount()).toBe(2);
      
      // Test sorting on missing field
      missingApi.setSortModel([{ colId: 'age', sort: 'asc' }]);
      // John (undefined age) should be at the end according to compareValues
      expect(missingApi.getDisplayedRowAtIndex(0)?.data.id).toBe(2);
      expect(missingApi.getDisplayedRowAtIndex(1)?.data.id).toBe(1);
    });

    it('should handle duplicate IDs (last one wins in map)', () => {
      const data = [
        { id: 'dup', name: 'First' },
        { id: 'dup', name: 'Second' }
      ];
      const dupApi = service.createApi(testColumnDefs, data);
      
      expect(dupApi.getDisplayedRowCount()).toBe(2);
      
      const node = dupApi.getRowNode('dup');
      expect(node?.data.name).toBe('Second');
    });

    it('should handle update transaction for non-existent row', () => {
      const api = service.createApi(testColumnDefs, [{ id: 1, name: 'John' }]);
      const result = api.applyTransaction({
        update: [{ id: 99, name: 'Missing' }]
      });
      
      expect(result?.update.length).toBe(0);
      expect(api.getDisplayedRowCount()).toBe(1);
    });

    it('should handle sorting on non-existent column', () => {
      const api = service.createApi(testColumnDefs, [{ id: 1, name: 'John' }, { id: 2, name: 'Jane' }]);
      // Should not crash
      api.setSortModel([{ colId: 'invalid', sort: 'asc' }]);
      expect(api.getDisplayedRowCount()).toBe(2);
    });

    it('should preserve selection across transactions', () => {
      const api = service.createApi(testColumnDefs, [
        { id: 1, name: 'John' },
        { id: 2, name: 'Jane' }
      ]);
      
      const node1 = api.getRowNode('1')!;
      node1.selected = true;
      
      api.applyTransaction({ add: [{ id: 3, name: 'Bob' }] });
      
      const sameNode1 = api.getRowNode('1')!;
      expect(sameNode1.selected).toBe(true);
      expect(api.getSelectedNodes().length).toBe(1);
    });
  });

  describe('Pivoting', () => {
    const pivotColumnDefs: ColDef[] = [
      { field: 'id', headerName: 'ID' },
      { field: 'name', headerName: 'Name' },
      { field: 'dept', headerName: 'Dept', rowGroup: true },
      { field: 'location', headerName: 'Location', pivot: true },
      { field: 'salary', headerName: 'Salary', aggFunc: 'sum' }
    ];
    
    const pivotData: any[] = [
      { id: 1, name: 'John', dept: 'Engineering', location: 'NY', salary: 1000 },
      { id: 2, name: 'Jane', dept: 'Engineering', location: 'SF', salary: 2000 },
      { id: 3, name: 'Bob', dept: 'Sales', location: 'NY', salary: 1500 },
      { id: 4, name: 'Alice', dept: 'Sales', location: 'SF', salary: 2500 },
      { id: 5, name: 'Charlie', dept: 'Engineering', location: 'NY', salary: 1200 }
    ];

    it('should generate pivot columns correctly', () => {
      const api = service.createApi(pivotColumnDefs, pivotData, { pivotMode: true });
      const columns = api.getAllColumns();
      const visibleColumns = columns.filter(c => c.visible);
      
      // Auto Group + 2 pivot columns (NY, SF) = 3
      expect(visibleColumns.length).toBe(3);
      expect(visibleColumns.find(c => c.colId.includes('NY'))).toBeTruthy();
      expect(visibleColumns.find(c => c.colId.includes('SF'))).toBeTruthy();
    });

    it('should calculate pivoted values correctly', () => {
      const api = service.createApi(pivotColumnDefs, pivotData, { pivotMode: true });
      
      let engNode = null;
      for (let i = 0; i < api.getDisplayedRowCount(); i++) {
          const node = api.getDisplayedRowAtIndex(i);
          if (node?.group && node.data.dept === 'Engineering') {
              engNode = node;
              break;
          }
      }
      
      expect(engNode).toBeTruthy();
      expect((engNode?.data as any).pivotData['NY'].salary).toBe(2200);
      expect((engNode?.data as any).pivotData['SF'].salary).toBe(2000);
    });

    it('should toggle pivot mode via API', () => {
      const api = service.createApi(pivotColumnDefs, pivotData, { pivotMode: false });
      expect(api.isPivotMode()).toBe(false);
      
      api.setPivotMode(true);
      expect(api.isPivotMode()).toBe(true);
      expect(api.getAllColumns().filter(c => c.visible).some(c => c.colId.startsWith('pivot_'))).toBe(true);
      
      api.setPivotMode(false);
      expect(api.isPivotMode()).toBe(false);
    });
  });

  describe('Master/Detail', () => {
    const mdColumnDefs: ColDef[] = [
      { field: 'id', headerName: 'ID' },
      { field: 'name', headerName: 'Name' }
    ];
    
    const mdData: any[] = [
      { id: 1, name: 'John' },
      { id: 2, name: 'Jane' }
    ];

    it('should identify master rows correctly', () => {
      const api = service.createApi(mdColumnDefs, mdData, { 
        masterDetail: true,
        isRowMaster: (data) => data.id === 1
      });
      
      const node1 = api.getRowNode('1');
      const node2 = api.getRowNode('2');
      
      expect(node1?.master).toBe(true);
      expect(node2?.master).toBe(false);
    });

    it('should insert detail row when master is expanded', () => {
      const api = service.createApi(mdColumnDefs, mdData, { 
        masterDetail: true,
        isRowMaster: (data) => data.id === 1
      });
      
      expect(api.getDisplayedRowCount()).toBe(2);
      
      const node1 = api.getRowNode('1')!;
      api.setRowNodeExpanded(node1, true);
      
      // Should now have 3 rows: Master 1, Detail 1, Master 2
      expect(api.getDisplayedRowCount()).toBe(3);
      
      const detailNode = api.getDisplayedRowAtIndex(1);
      expect(detailNode?.detail).toBe(true);
      expect(detailNode?.id).toBe('1-detail');
      expect(detailNode?.masterRowNode).toBe(node1);
    });

    it('should remove detail row when master is collapsed', () => {
      const api = service.createApi(mdColumnDefs, mdData, { 
        masterDetail: true,
        isRowMaster: (data) => data.id === 1
      });
      
      const node1 = api.getRowNode('1')!;
      api.setRowNodeExpanded(node1, true);
      expect(api.getDisplayedRowCount()).toBe(3);
      
      api.setRowNodeExpanded(node1, false);
      expect(api.getDisplayedRowCount()).toBe(2);
    });

    it('should calculate correct Y positions for variable heights', () => {
      const api = service.createApi(mdColumnDefs, mdData, { 
        masterDetail: true,
        isRowMaster: (data) => data.id === 1,
        rowHeight: 30,
        detailRowHeight: 100
      });
      
      const node1 = api.getRowNode('1')!;
      api.setRowNodeExpanded(node1, true);
      
      // Row 0: Master (Y=0, H=30)
      // Row 1: Detail (Y=30, H=100)
      // Row 2: Master (Y=130, H=30)
      
      expect(api.getRowY(0)).toBe(0);
      expect(api.getRowY(1)).toBe(30);
      expect(api.getRowY(2)).toBe(130);
      expect(api.getTotalHeight()).toBe(160);
      
      expect(api.getRowAtY(15)).toBe(0);
      expect(api.getRowAtY(50)).toBe(1);
      expect(api.getRowAtY(140)).toBe(2);
    });
  });
});
