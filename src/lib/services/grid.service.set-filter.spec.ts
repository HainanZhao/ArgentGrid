import { TestBed } from '@angular/core/testing';
import { provideExperimentalZonelessChangeDetection } from '@angular/core';
import { GridService } from './grid.service';
import { ColDef } from '../types/ag-grid-types';

describe('GridService - Set Filter', () => {
  let service: GridService<any>;

  const testColumnDefs: ColDef[] = [
    { field: 'id', headerName: 'ID', width: 100, filter: 'text' },
    { field: 'name', headerName: 'Name', width: 150, filter: 'text' },
    { field: 'department', headerName: 'Department', width: 150, filter: 'set' },
    { field: 'status', headerName: 'Status', width: 100, filter: 'set' }
  ];

  const testRowData = [
    { id: 1, name: 'John', department: 'Engineering', status: 'active' },
    { id: 2, name: 'Jane', department: 'Engineering', status: 'active' },
    { id: 3, name: 'Bob', department: 'Sales', status: 'inactive' },
    { id: 4, name: 'Alice', department: 'Sales', status: 'active' },
    { id: 5, name: 'Charlie', department: 'Marketing', status: 'inactive' }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        GridService,
        provideExperimentalZonelessChangeDetection()
      ]
    });
    service = TestBed.inject(GridService);
  });

  describe('getUniqueValues', () => {
    it('should return unique values for a field', () => {
      service.createApi(testColumnDefs, [...testRowData]);
      const values = service.getUniqueValues('department');
      
      expect(values).toEqual(['Engineering', 'Marketing', 'Sales']);
    });

    it('should return sorted values', () => {
      service.createApi(testColumnDefs, [...testRowData]);
      const values = service.getUniqueValues('status');
      
      expect(values).toEqual(['active', 'inactive']);
    });

    it('should exclude null values', () => {
      const dataWithNulls = [
        { id: 1, department: 'Engineering' },
        { id: 2, department: null },
        { id: 3, department: 'Sales' },
        { id: 4, department: undefined }
      ];
      service.createApi(testColumnDefs, dataWithNulls);
      const values = service.getUniqueValues('department');
      
      expect(values).toEqual(['Engineering', 'Sales']);
    });

    it('should return empty array for non-existent field', () => {
      service.createApi(testColumnDefs, [...testRowData]);
      const values = service.getUniqueValues('nonExistent');
      
      expect(values).toEqual([]);
    });

    it('should handle numeric values', () => {
      const numericData = [
        { id: 1, count: 10 },
        { id: 2, count: 20 },
        { id: 3, count: 10 },
        { id: 4, count: 30 }
      ];
      service.createApi(testColumnDefs, numericData);
      const values = service.getUniqueValues('count');
      
      expect(values).toEqual([10, 20, 30]);
    });
  });

  describe('matchesSetFilter', () => {
    it('should match value in filter array', () => {
      const api = service.createApi(testColumnDefs, [...testRowData]);
      
      // Apply set filter
      api.setFilterModel({
        department: { filterType: 'set', values: ['Engineering', 'Sales'] }
      });

      expect(api.getDisplayedRowCount()).toBe(4); // John, Jane, Bob, Alice
    });

    it('should not match value not in filter array', () => {
      const api = service.createApi(testColumnDefs, [...testRowData]);
      
      // Apply set filter excluding Engineering
      api.setFilterModel({
        department: { filterType: 'set', values: ['Sales', 'Marketing'] }
      });

      expect(api.getDisplayedRowCount()).toBe(3); // Bob, Alice, Charlie
    });

    it('should return all rows when filter is empty array', () => {
      const api = service.createApi(testColumnDefs, [...testRowData]);
      
      // Empty filter = no filter applied
      api.setFilterModel({
        department: { filterType: 'set', values: [] }
      });

      expect(api.getDisplayedRowCount()).toBe(5); // All rows
    });

    it('should work with numeric values', () => {
      const numericData = [
        { id: 1, name: 'A', department: 'Eng', status: 10 },
        { id: 2, name: 'B', department: 'Eng', status: 20 },
        { id: 3, name: 'C', department: 'Eng', status: 30 }
      ];
      const api = service.createApi(testColumnDefs, numericData);
      
      api.setFilterModel({
        status: { filterType: 'set', values: [10, 30] }
      });

      expect(api.getDisplayedRowCount()).toBe(2); // id 1 and 3
    });

    it('should handle null/undefined values correctly', () => {
      const dataWithNulls = [
        { id: 1, status: 'active' },
        { id: 2, status: null },
        { id: 3, status: 'inactive' },
        { id: 4, status: undefined }
      ];
      const api = service.createApi(testColumnDefs, dataWithNulls);
      
      api.setFilterModel({
        status: { filterType: 'set', values: ['active'] }
      });

      expect(api.getDisplayedRowCount()).toBe(1); // Only active
    });

    it('should combine with other filters', () => {
      const api = service.createApi(testColumnDefs, [...testRowData]);
      
      // Combine set filter with text filter
      api.setFilterModel({
        department: { filterType: 'set', values: ['Engineering', 'Sales'] },
        name: { filterType: 'text', type: 'contains', filter: 'o' }
      });

      expect(api.getDisplayedRowCount()).toBe(2); // Bob (Sales) and John (Engineering)
    });

    it('should update when filter changes', () => {
      const api = service.createApi(testColumnDefs, [...testRowData]);
      
      // Initial filter
      api.setFilterModel({
        department: { filterType: 'set', values: ['Engineering'] }
      });

      expect(api.getDisplayedRowCount()).toBe(2); // John, Jane

      // Change filter
      api.setFilterModel({
        department: { filterType: 'set', values: ['Sales'] }
      });

      expect(api.getDisplayedRowCount()).toBe(2); // Bob, Alice
    });
  });

  describe('Set Filter API Integration', () => {
    it('should get filter model with set filter', () => {
      const api = service.createApi(testColumnDefs, [...testRowData]);
      
      api.setFilterModel({
        department: { filterType: 'set', values: ['Engineering'] }
      });

      const model = api.getFilterModel();
      expect(model.department).toEqual({
        filterType: 'set',
        values: ['Engineering']
      });
    });

    it('should clear set filter', () => {
      const api = service.createApi(testColumnDefs, [...testRowData]);
      
      api.setFilterModel({
        department: { filterType: 'set', values: ['Engineering'] }
      });

      // Clear filter
      api.setFilterModel({});

      const model = api.getFilterModel();
      expect(model.department).toBeUndefined();
    });

    it('should work with getDisplayedRowCount', () => {
      const api = service.createApi(testColumnDefs, [...testRowData]);
      
      // No filter
      expect(api.getDisplayedRowCount()).toBe(5);

      // Apply set filter
      api.setFilterModel({
        department: { filterType: 'set', values: ['Engineering'] }
      });

      expect(api.getDisplayedRowCount()).toBe(2);
    });
  });
});
