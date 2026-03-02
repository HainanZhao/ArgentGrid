import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ArgentGridComponent } from './argent-grid.component';

describe('ArgentGridComponent - Regression Protection', () => {
  let component: ArgentGridComponent<any>;
  let mockCdr: any;
  let mockElementRef: any;

  beforeEach(() => {
    // Mock canvas context
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
      measureText: vi.fn().mockReturnValue({ width: 50 }),
    } as any);

    mockCdr = {
      detectChanges: vi.fn(),
      markForCheck: vi.fn(),
    };

    mockElementRef = {
      nativeElement: {
        getBoundingClientRect: () => ({ left: 100, top: 100, right: 1100, bottom: 900 }),
        offsetWidth: 1000,
        offsetHeight: 800,
        style: {},
      },
    };

    component = new ArgentGridComponent(mockCdr, mockElementRef);

    // Mock canvasRenderer
    (component as any).canvasRenderer = {
      getHitTestResult: vi.fn().mockReturnValue({ rowIndex: 0, columnIndex: 0 }),
      render: vi.fn(),
      renderFrame: vi.fn(),
    };

    component.columnDefs = [{ field: 'id', headerName: 'ID' }];
    component.rowData = [{ id: 1 }];
    component.ngOnInit();
  });

  it('should hide row group panel by default', () => {
    expect(component.isRowGroupPanelVisible()).toBe(false);
  });

  it('should show row group panel when always is set', () => {
    component.gridOptions = { rowGroupPanelShow: 'always' };
    // Simulate option change
    (component as any).onGridOptionsChanged(component.gridOptions);
    expect(component.isRowGroupPanelVisible()).toBe(true);
  });

  it('should position header menu relative to container', () => {
    const mockEvent = {
      stopPropagation: vi.fn(),
      target: {
        getBoundingClientRect: () => ({ left: 200, top: 120, right: 220, bottom: 140 }),
      },
    } as any;

    const col = component.getApi().getAllColumns()[0];
    component.onHeaderMenuClick(mockEvent, col);

    expect(component.activeHeaderMenu).toBe(col);
    // Container is at 100, 100. Icon is at 200, 120.
    // Relative X = IconLeft - ContainerLeft = 200 - 100 = 100
    // Relative Y = IconBottom - ContainerTop + 4 = 140 - 100 + 4 = 44
    expect(component.headerMenuPosition.x).toBe(100);
    expect(component.headerMenuPosition.y).toBe(44);
  });

  it('should position context menu relative to container', () => {
    const mockEvent = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
      clientX: 250,
      clientY: 300,
    } as any;

    // Mock row node finding logic
    const rowNode = { id: '1', data: { id: 1 }, selected: false, setSelected: vi.fn() };
    vi.spyOn(component.getApi(), 'getDisplayedRowAtIndex').mockReturnValue(rowNode as any);

    component.onCanvasContextMenu(mockEvent);

    // Relative X = clientX - ContainerLeft = 250 - 100 = 150
    // Relative Y = clientY - ContainerTop = 300 - 100 = 200
    expect(component.contextMenuPosition.x).toBe(150);
    expect(component.contextMenuPosition.y).toBe(200);
  });

  it('should update rowGroupColumns when columns change', () => {
    expect(component.rowGroupColumns.length).toBe(0);

    // Add group column via API
    component.getApi().addRowGroupColumn('id');

    // The component listens to gridStateChanged$ which calls updateRowGroupColumns
    expect(component.rowGroupColumns.length).toBe(1);
    expect(component.rowGroupColumns[0].colId).toBe('id');
  });
});

// ─── Header Filter Button ──────────────────────────────────────────────────

describe('ArgentGridComponent - Header Filter Button', () => {
  let component: ArgentGridComponent<any>;

  beforeEach(() => {
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
      measureText: vi.fn().mockReturnValue({ width: 50 }),
    } as any);

    const mockCdr = { detectChanges: vi.fn(), markForCheck: vi.fn() };
    const mockElementRef = {
      nativeElement: {
        getBoundingClientRect: () => ({ left: 0, top: 0 }),
        offsetWidth: 1000,
        offsetHeight: 800,
        style: {},
      },
    };

    component = new ArgentGridComponent(mockCdr as any, mockElementRef as any);
    component.columnDefs = [
      { field: 'name', filter: 'text' },
      { field: 'dept', filter: 'set' },
      { field: 'salary', filter: 'number', floatingFilter: true },
      { field: 'id' }, // no filter
      { field: 'status', filter: 'text', suppressHeaderFilterButton: true },
    ];
    component.rowData = [{ name: 'Alice', dept: 'Eng', salary: 100, id: 1, status: 'active' }];
    component.ngOnInit();
  });

  describe('hasHeaderFilterButton', () => {
    it('should return true for column with filter and no floatingFilter', () => {
      const col = component
        .getApi()
        .getAllColumns()
        .find((c) => c.field === 'name')!;
      expect(component.hasHeaderFilterButton(col)).toBe(true);
    });

    it('should return true for set-filter column', () => {
      const col = component
        .getApi()
        .getAllColumns()
        .find((c) => c.field === 'dept')!;
      expect(component.hasHeaderFilterButton(col)).toBe(true);
    });

    it('should return false when floatingFilter is enabled', () => {
      const col = component
        .getApi()
        .getAllColumns()
        .find((c) => c.field === 'salary')!;
      expect(component.hasHeaderFilterButton(col)).toBe(false);
    });

    it('should return false when no filter configured', () => {
      const col = component
        .getApi()
        .getAllColumns()
        .find((c) => c.field === 'id')!;
      expect(component.hasHeaderFilterButton(col)).toBe(false);
    });

    it('should return false when suppressHeaderFilterButton is true', () => {
      const col = component
        .getApi()
        .getAllColumns()
        .find((c) => c.field === 'status')!;
      expect(component.hasHeaderFilterButton(col)).toBe(false);
    });

    it('should return false for the selection column', () => {
      const fakeSelCol = { colId: 'ag-Grid-SelectionColumn' } as any;
      expect(component.hasHeaderFilterButton(fakeSelCol)).toBe(false);
    });
  });

  describe('isColumnFiltered', () => {
    it('should return false when no filter is applied', () => {
      const col = component
        .getApi()
        .getAllColumns()
        .find((c) => c.field === 'name')!;
      expect(component.isColumnFiltered(col)).toBe(false);
    });

    it('should return true when a filter is active on the column', () => {
      component
        .getApi()
        .setFilterModel({ name: { filterType: 'text', type: 'contains', filter: 'Alice' } });
      const col = component
        .getApi()
        .getAllColumns()
        .find((c) => c.field === 'name')!;
      expect(component.isColumnFiltered(col)).toBe(true);
    });

    it('should return false for a different column when only one filtered', () => {
      component
        .getApi()
        .setFilterModel({ name: { filterType: 'text', type: 'contains', filter: 'Alice' } });
      const col = component
        .getApi()
        .getAllColumns()
        .find((c) => c.field === 'dept')!;
      expect(component.isColumnFiltered(col)).toBe(false);
    });
  });

  describe('openColumnsPanel', () => {
    it('should make sideBarVisible true', () => {
      component.sideBarVisible = false;
      component.openColumnsPanel();
      expect(component.sideBarVisible).toBe(true);
    });

    it('should set activeToolPanel to columns', () => {
      component.activeToolPanel = null;
      component.openColumnsPanel();
      expect(component.activeToolPanel).toBe('columns');
    });

    it('should close any open header menu', () => {
      const col = component.getApi().getAllColumns()[0];
      component.activeHeaderMenu = col;
      component.openColumnsPanel();
      expect(component.activeHeaderMenu).toBeNull();
    });
  });
});

// ─── openSetFilter restores selected values ─────────────────────────────────

describe('ArgentGridComponent - openSetFilter restores filter state', () => {
  let component: ArgentGridComponent<any>;

  beforeEach(() => {
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
      measureText: vi.fn().mockReturnValue({ width: 50 }),
    } as any);

    const mockCdr = { detectChanges: vi.fn(), markForCheck: vi.fn() };
    const mockElementRef = {
      nativeElement: {
        getBoundingClientRect: () => ({ left: 0, top: 0 }),
        offsetWidth: 1000,
        offsetHeight: 800,
        style: {},
      },
    };

    component = new ArgentGridComponent(mockCdr as any, mockElementRef as any);
    component.columnDefs = [{ field: 'dept', filter: 'set' }];
    component.rowData = [{ dept: 'Engineering' }, { dept: 'Sales' }, { dept: 'Marketing' }];
    component.ngOnInit();
  });

  it('should set setFilterSelectedValues to null when no existing filter', () => {
    const col = component.getApi().getAllColumns()[0];
    component.openSetFilter(null, col, { x: 0, y: 0 });
    expect(component.setFilterSelectedValues).toBeNull();
  });

  it('should restore previously selected values from the filter model', () => {
    component.getApi().setFilterModel({
      dept: { filterType: 'set', values: ['Engineering', 'Sales'] },
    });

    const col = component.getApi().getAllColumns()[0];
    component.openSetFilter(null, col, { x: 0, y: 0 });

    expect(component.setFilterSelectedValues).toEqual(['Engineering', 'Sales']);
  });

  it('should set setFilterSelectedValues to null for non-set filter models', () => {
    // Manually set a text filter (wrong type) under the dept colId
    component.getApi().setFilterModel({
      dept: { filterType: 'text', type: 'contains', filter: 'Eng' },
    });

    const col = component.getApi().getAllColumns()[0];
    component.openSetFilter(null, col, { x: 0, y: 0 });

    expect(component.setFilterSelectedValues).toBeNull();
  });

  it('should populate setFilterValues with all unique values for the column', () => {
    const col = component.getApi().getAllColumns()[0];
    component.openSetFilter(null, col, { x: 0, y: 0 });

    expect(component.setFilterValues).toContain('Engineering');
    expect(component.setFilterValues).toContain('Sales');
    expect(component.setFilterValues).toContain('Marketing');
  });
});
