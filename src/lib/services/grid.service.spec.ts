import { TestBed } from '@angular/core/testing';
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
      providers: [GridService]
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

  it('should handle transaction - add rows', () => {
    const newApi = service.createApi(testColumnDefs, testRowData);
    const result = newApi.applyTransaction({
      add: [{ id: 4, name: 'Alice Brown', age: 28, email: 'alice@example.com' }]
    });
    
    expect(result?.add.length).toBe(1);
    expect(newApi.getRowData().length).toBe(4);
  });

  // TODO: Fix transaction tests - row ID lookup issue
  xit('should handle transaction - update rows', () => {
    const firstNode = api.getDisplayedRowAtIndex(0);
    if (!firstNode) return;
    
    const newData: TestData = { id: firstNode.data.id, name: 'John Updated', age: 31, email: 'john.updated@example.com' };
    const result = api.applyTransaction({
      update: [newData]
    });
    
    expect(result?.update.length).toBe(1);
    const rowData = api.getRowData();
    const foundRow = rowData.find(r => r.id === firstNode.data.id);
    expect(foundRow?.name).toBe('John Updated');
  });

  xit('should handle transaction - remove rows', () => {
    const firstNode = api.getDisplayedRowAtIndex(0);
    if (!firstNode) return;
    
    const removeData: TestData = { id: firstNode.data.id, name: firstNode.data.name, age: firstNode.data.age, email: firstNode.data.email };
    const result = api.applyTransaction({
      remove: [removeData]
    });
    
    expect(result?.remove.length).toBe(1);
    expect(api.getRowData().length).toBe(2);
  });

  it('should get and set filter model', () => {
    const filterModel: FilterModel = {
      name: { filterType: 'text', type: 'contains', filter: 'John' }
    };
    
    api.setFilterModel(filterModel);
    expect(api.getFilterModel()).toEqual(filterModel);
    expect(api.isFilterPresent()).toBe(true);
  });

  it('should get grid state', () => {
    const state = api.getState();
    expect(state.sort).toBeDefined();
    expect(state.columnOrder).toBeDefined();
  });

  it('should get displayed row count', () => {
    const freshApi = service.createApi(testColumnDefs, [...testRowData]);
    expect(freshApi.getDisplayedRowCount()).toBe(3);
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
});
