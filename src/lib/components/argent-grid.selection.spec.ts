import { provideExperimentalZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { ArgentGridComponent } from './argent-grid.component';
import { ArgentGridModule } from '../argent-grid.module';
import { GridService } from '../services/grid.service';

interface TestData {
  id: number;
  name: string;
}

describe('ArgentGridComponent - Selection Behavior', () => {
  let component: ArgentGridComponent<TestData>;
  let fixture: ComponentFixture<ArgentGridComponent<TestData>>;

  const testColumnDefs = [
    { field: 'id', headerName: 'ID', checkboxSelection: true },
    { field: 'name', headerName: 'Name' },
  ];

  const testRowData = [
    { id: 1, name: 'Item 1' },
    { id: 2, name: 'Item 2' },
    { id: 3, name: 'Item 3' },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ArgentGridModule],
      providers: [GridService, provideExperimentalZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(ArgentGridComponent);
    component = fixture.componentInstance;
    component.columnDefs = testColumnDefs;
    component.rowData = testRowData;
    component.rowSelection = 'multiple';
    fixture.detectChanges();
  });

  it('should initialize with no rows selected', () => {
    expect(component.isAllSelected).toBe(false);
    expect(component.isIndeterminateSelection).toBe(false);
    expect(component.getApi().getSelectedRows().length).toBe(0);
  });

  it('should toggle all rows when header checkbox is clicked', () => {
    // Select all
    const event = { target: { checked: true } } as any;
    component.onSelectionHeaderChange(event);

    expect(component.getApi().getSelectedRows().length).toBe(3);
    expect(component.isAllSelected).toBe(true);
    expect(component.isIndeterminateSelection).toBe(false);

    // Deselect all
    event.target.checked = false;
    component.onSelectionHeaderChange(event);

    expect(component.getApi().getSelectedRows().length).toBe(0);
    expect(component.isAllSelected).toBe(false);
    expect(component.isIndeterminateSelection).toBe(false);
  });

  it('should update indeterminate state when single row is selected', () => {
    const api = component.getApi();
    const node = api.getDisplayedRowAtIndex(0);

    node?.setSelected(true);
    // GridState listener in component should trigger updateSelectionState
    // We might need to manually trigger or wait for microtasks if not using zone.js
    component.updateSelectionState();

    expect(component.getApi().getSelectedRows().length).toBe(1);
    expect(component.isAllSelected).toBe(false);
    expect(component.isIndeterminateSelection).toBe(true);
  });

  it('should toggle selection when a row is clicked', () => {
    const api = component.getApi();
    const mouseEvent = new MouseEvent('click');

    // Select row
    component.onRowClick(0, mouseEvent);
    expect(api.getDisplayedRowAtIndex(0)?.selected).toBe(true);

    // Unselect row by clicking again (toggle behavior)
    component.onRowClick(0, mouseEvent);
    expect(api.getDisplayedRowAtIndex(0)?.selected).toBe(false);
  });

  it('should clear others when clicking a row without modifiers', () => {
    const api = component.getApi();
    const mouseEvent = new MouseEvent('click');

    // Select first row
    component.onRowClick(0, mouseEvent);
    expect(api.getDisplayedRowAtIndex(0)?.selected).toBe(true);

    // Click second row
    component.onRowClick(1, mouseEvent);
    expect(api.getDisplayedRowAtIndex(0)?.selected).toBe(false);
    expect(api.getDisplayedRowAtIndex(1)?.selected).toBe(true);
  });

  it('should keep multiple selection when using Ctrl key', () => {
    const api = component.getApi();
    const ctrlEvent = new MouseEvent('click', { ctrlKey: true });

    component.onRowClick(0, ctrlEvent);
    component.onRowClick(1, ctrlEvent);

    expect(api.getDisplayedRowAtIndex(0)?.selected).toBe(true);
    expect(api.getDisplayedRowAtIndex(1)?.selected).toBe(true);
    expect(api.getSelectedRows().length).toBe(2);
  });

  it('should disable sorting and menu for dedicated selection column', () => {
    const selectionCol = component.getApi().getAllColumns()[0];
    expect(selectionCol.colId).toBe('ag-Grid-SelectionColumn');

    expect(component.isSortable(selectionCol)).toBe(false);
    expect(component.hasHeaderMenu(selectionCol)).toBe(false);
    expect(component.getHeaderName(selectionCol)).toBe('');
  });

  it('should allow resizing for dedicated selection column', () => {
    const selectionCol = component.getApi().getAllColumns()[0];
    expect(component.isResizable(selectionCol)).toBe(true);
  });
});
