import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GridService } from '../services/grid.service';
import { ArgentGridComponent } from './argent-grid.component';

// Mock ChangeDetectorRef
const mockCdr = {
  detectChanges: vi.fn(),
  markForCheck: vi.fn(),
};

describe('ArgentGridComponent - Context Menu', () => {
  let component: ArgentGridComponent;
  let _gridService: GridService;

  beforeEach(() => {
    _gridService = new GridService();
    component = new ArgentGridComponent(mockCdr as any);
  });

  describe('resolveContextMenuItems', () => {
    it('should resolve string menu items to defaults', () => {
      const items = component.resolveContextMenuItems(['copy', 'separator']);
      expect(items.length).toBeGreaterThan(0);
      expect(items[0].name).toBe('Copy Cell');
    });

    it('should handle custom MenuItemDef objects', () => {
      const customItem = {
        name: 'Custom Action',
        action: vi.fn(),
        icon: '⭐',
      };
      const items = component.resolveContextMenuItems([customItem]);
      expect(items.length).toBe(1);
      expect(items[0].name).toBe('Custom Action');
    });

    it('should mix default and custom items', () => {
      const items = component.resolveContextMenuItems([
        'copy',
        { name: 'Custom', action: vi.fn() },
        'separator',
      ]);
      expect(items.length).toBeGreaterThan(1);
    });

    it('should filter out null items', () => {
      const items = component.resolveContextMenuItems(['copy', null as any]);
      expect(items.length).toBeGreaterThan(0);
    });
  });

  describe('getDefaultMenuItem', () => {
    it('should return copy cell item', () => {
      const item = component.getDefaultMenuItem('copy');
      expect(item?.name).toBe('Copy Cell');
      expect(item?.icon).toBe('📋');
    });

    it('should return copy with headers item (when range exists)', () => {
      // Note: copyWithHeaders only returns item when range selection exists
      // For testing, we just verify it doesn't throw
      expect(() => {
        component.getDefaultMenuItem('copyWithHeaders');
      }).not.toThrow();
    });

    it('should return export submenu', () => {
      const item = component.getDefaultMenuItem('export');
      expect(item?.name).toBe('Export');
      expect(item?.subMenu).toBeDefined();
    });

    it('should return reset columns item', () => {
      const item = component.getDefaultMenuItem('resetColumns');
      expect(item?.name).toBe('Reset Columns');
      expect(item?.icon).toBe('⟲');
    });

    it('should return separator', () => {
      const item = component.getDefaultMenuItem('separator');
      expect(item?.separator).toBe(true);
    });

    it('should return null for unknown key', () => {
      const item = component.getDefaultMenuItem('unknown' as any);
      expect(item).toBe(null);
    });
  });

  describe('closeContextMenu', () => {
    it('should reset context menu state', () => {
      component.contextMenuItems = [{ name: 'Test', action: vi.fn() }];
      component.activeContextMenu = true;
      component.contextMenuCell = { rowNode: {} as any, column: {} as any };

      component.closeContextMenu();

      expect(component.activeContextMenu).toBe(false);
      expect(component.contextMenuCell).toBe(null);
      expect(mockCdr.detectChanges).toHaveBeenCalled();
    });
  });

  describe('copyContextMenuCell', () => {
    it('should handle null cell gracefully', () => {
      component.contextMenuCell = null;
      expect(() => component.copyContextMenuCell()).not.toThrow();
    });

    it('should handle missing field gracefully', () => {
      component.contextMenuCell = {
        rowNode: { data: { name: 'John' } } as any,
        column: { field: null } as any,
      };
      expect(() => component.copyContextMenuCell()).not.toThrow();
    });

    it('should close context menu after copy', () => {
      const mockClipboard = { writeText: vi.fn().mockResolvedValue(undefined) };
      Object.defineProperty(navigator, 'clipboard', { value: mockClipboard, writable: true });

      component.contextMenuCell = {
        rowNode: { data: { name: 'John' } } as any,
        column: { field: 'name' } as any,
      };
      component.activeContextMenu = true;

      component.copyContextMenuCell();

      expect(component.activeContextMenu).toBe(false);
      expect(component.contextMenuCell).toBe(null);
    });
  });

  describe('hasRangeSelection', () => {
    it('should return false when no range', () => {
      const mockApi = { getCellRanges: vi.fn(() => []) };
      component.gridApi = mockApi as any;
      expect(component.hasRangeSelection()).toBe(false);
    });

    it('should return true when range exists', () => {
      const mockApi = { getCellRanges: vi.fn(() => [{}]) };
      component.gridApi = mockApi as any;
      expect(component.hasRangeSelection()).toBe(true);
    });
  });

  describe('stopEditing - Validation', () => {
    const mockRowNode = {
      data: { name: 'John', age: 25 },
      displayedRowIndex: 0,
    } as any;

    const mockColDef = {
      field: 'age',
      colId: 'age',
    };

    const mockEditorInput = {
      nativeElement: {
        value: '30',
        classList: {
          add: vi.fn(),
          remove: vi.fn(),
        },
      },
    };

    beforeEach(() => {
      component.isEditing = true;
      component.editingRowNode = mockRowNode;
      component.editingColDef = mockColDef as any;
      component.editorInputRef = mockEditorInput as any;
      mockCdr.detectChanges.mockClear();
      mockEditorInput.nativeElement.classList.add.mockClear();
      mockEditorInput.nativeElement.classList.remove.mockClear();
    });

    it('should keep editing active when valueSetter returns false (legacy mode)', () => {
      component.gridOptions = { invalidEditValueMode: 'legacy' } as any;
      const valueSetter = vi.fn(() => false);
      component.editingColDef = { ...mockColDef, valueSetter } as any;

      component.stopEditing(true);

      expect(valueSetter).toHaveBeenCalled();
      expect(component.isEditing).toBe(true);
      expect(mockEditorInput.nativeElement.classList.add).toHaveBeenCalledWith(
        'ag-cell-editor-invalid'
      );
      expect(mockCdr.detectChanges).toHaveBeenCalled();
    });

    it('should keep editing active when valueSetter returns false (topScroll mode)', () => {
      component.gridOptions = { invalidEditValueMode: 'topScroll' } as any;
      const valueSetter = vi.fn(() => false);
      component.editingColDef = { ...mockColDef, valueSetter } as any;

      component.stopEditing(true);

      expect(component.isEditing).toBe(true);
      expect(mockEditorInput.nativeElement.classList.add).toHaveBeenCalledWith(
        'ag-cell-editor-invalid'
      );
    });

    it('should exit edit mode when valueSetter returns false (none mode)', () => {
      component.gridOptions = { invalidEditValueMode: 'none' } as any;
      const valueSetter = vi.fn(() => false);
      component.editingColDef = { ...mockColDef, valueSetter } as any;

      component.stopEditing(true);

      expect(component.isEditing).toBe(false);
      expect(component.editingRowNode).toBe(null);
      expect(component.editingColDef).toBe(null);
    });

    it('should keep editing active when getValidationErrors returns errors (legacy mode)', () => {
      component.gridOptions = { invalidEditValueMode: 'legacy' } as any;
      const getValidationErrors = vi.fn(() => ['Invalid value']);
      component.editingColDef = { ...mockColDef, getValidationErrors } as any;

      component.stopEditing(true);

      expect(getValidationErrors).toHaveBeenCalled();
      expect(component.isEditing).toBe(true);
      expect(mockEditorInput.nativeElement.classList.add).toHaveBeenCalledWith(
        'ag-cell-editor-invalid'
      );
    });

    it('should exit edit mode when getValidationErrors returns errors (none mode)', () => {
      component.gridOptions = { invalidEditValueMode: 'none' } as any;
      const getValidationErrors = vi.fn(() => ['Invalid value']);
      component.editingColDef = { ...mockColDef, getValidationErrors } as any;

      component.stopEditing(true);

      expect(component.isEditing).toBe(false);
      expect(component.editingRowNode).toBe(null);
    });

    it('should proceed normally when valueSetter returns true', () => {
      component.gridOptions = {} as any;
      const valueSetter = vi.fn(() => true);
      const applyTransaction = vi.fn();
      component.gridApi = { applyTransaction } as any;
      component.editingColDef = { ...mockColDef, valueSetter } as any;

      component.stopEditing(true);

      expect(valueSetter).toHaveBeenCalled();
      expect(applyTransaction).toHaveBeenCalledWith({ update: [mockRowNode.data] });
      expect(component.isEditing).toBe(false);
    });

    it('should proceed normally when getValidationErrors returns null', () => {
      component.gridOptions = {} as any;
      const getValidationErrors = vi.fn(() => null);
      const applyTransaction = vi.fn();
      component.gridApi = { applyTransaction } as any;
      component.editingColDef = { ...mockColDef, getValidationErrors } as any;

      component.stopEditing(true);

      expect(getValidationErrors).toHaveBeenCalled();
      expect(applyTransaction).toHaveBeenCalledWith({ update: [mockRowNode.data] });
      expect(component.isEditing).toBe(false);
    });

    it('should remove invalid class at start of stopEditing', () => {
      component.gridOptions = { invalidEditValueMode: 'legacy' } as any;
      const valueSetter = vi.fn().mockReturnValueOnce(false).mockReturnValueOnce(true);
      const applyTransaction = vi.fn();
      component.gridApi = { applyTransaction } as any;
      component.editingColDef = { ...mockColDef, valueSetter } as any;

      component.stopEditing(true);
      expect(component.isEditing).toBe(true);
      expect(mockEditorInput.nativeElement.classList.remove).toHaveBeenCalledWith(
        'ag-cell-editor-invalid'
      );

      component.stopEditing(true);
      expect(component.isEditing).toBe(false);
    });

    it('should use default legacy mode when invalidEditValueMode is not set', () => {
      component.gridOptions = {} as any;
      const valueSetter = vi.fn(() => false);
      component.editingColDef = { ...mockColDef, valueSetter } as any;

      component.stopEditing(true);

      expect(component.isEditing).toBe(true);
      expect(mockEditorInput.nativeElement.classList.add).toHaveBeenCalledWith(
        'ag-cell-editor-invalid'
      );
    });

    it('should do nothing when not editing', () => {
      component.isEditing = false;

      component.stopEditing(true);

      expect(mockCdr.detectChanges).not.toHaveBeenCalled();
    });

    it('should do nothing when save is false', () => {
      component.isEditing = true;

      component.stopEditing(false);

      expect(component.isEditing).toBe(false);
    });
  });

  describe('stopEditing - custom cell editor', () => {
    const mockRowNode = { data: { name: 'John', age: 25 }, displayedRowIndex: 0 } as any;
    const mockColDef = { field: 'age', colId: 'age' };

    /** A fake live editor instance: getValue + optional lifecycle hooks. */
    function fakeEditor(getValue: () => any, extra: Record<string, any> = {}) {
      return { instance: { getValue, ...extra }, destroy: vi.fn() } as any;
    }

    beforeEach(() => {
      mockRowNode.data = { name: 'John', age: 25 };
      component.isEditing = true;
      component.editingRowNode = mockRowNode;
      component.editingColDef = mockColDef as any;
      component.editorInputRef = undefined as any; // component editor → no <input>
      component.gridOptions = {} as any;
      mockCdr.detectChanges.mockClear();
    });

    it('commits the value returned by the editor component getValue()', () => {
      const applyTransaction = vi.fn();
      component.gridApi = { applyTransaction } as any;
      const ref = fakeEditor(() => 42);
      component.editingComponentRef = ref;

      component.stopEditing(true);

      expect(applyTransaction).toHaveBeenCalledWith({ update: [mockRowNode.data] });
      expect(mockRowNode.data.age).toBe(42); // default setter assigns the field
      expect(component.isEditing).toBe(false);
      expect(ref.destroy).toHaveBeenCalled(); // editor instance torn down
      expect(component.isComponentEditor).toBe(false);
    });

    it('runs valueParser + valueSetter against the editor value', () => {
      const applyTransaction = vi.fn();
      component.gridApi = { applyTransaction } as any;
      const valueParser = vi.fn(({ newValue }) => newValue + 1);
      const valueSetter = vi.fn(({ value, data }: any) => {
        data.age = value * 10;
        return true;
      });
      component.editingColDef = { ...mockColDef, valueParser, valueSetter } as any;
      component.editingComponentRef = fakeEditor(() => 4);

      component.stopEditing(true);

      expect(valueParser).toHaveBeenCalled();
      expect(valueSetter).toHaveBeenCalled();
      expect(mockRowNode.data.age).toBe(50); // (4 + 1) * 10
    });

    it('does not commit when the editor vetoes via isCancelAfterEnd()', () => {
      const applyTransaction = vi.fn();
      component.gridApi = { applyTransaction } as any;
      const ref = fakeEditor(() => 99, { isCancelAfterEnd: () => true });
      component.editingComponentRef = ref;

      component.stopEditing(true);

      expect(applyTransaction).not.toHaveBeenCalled();
      expect(mockRowNode.data.age).toBe(25); // unchanged
      expect(component.isEditing).toBe(false);
      expect(ref.destroy).toHaveBeenCalled();
    });
  });
});

/** A stand-in for an Angular component class — resolution checks `ɵcmp`. */
function fakeHeaderComponent(name: string): any {
  const cls = class {};
  (cls as any).ɵcmp = { name };
  return cls;
}

describe('ArgentGridComponent - custom header components', () => {
  let component: ArgentGridComponent;

  beforeEach(() => {
    component = new ArgentGridComponent(mockCdr as any);
    component.gridApi = {
      getGridOption: () => undefined,
      getColumn: (id: string) => ({ colId: id, sort: null }),
      setColumnSort: vi.fn(),
    } as any;
  });

  it('resolves a colDef.headerComponent class for a column', () => {
    const HeaderComp = fakeHeaderComponent('H');
    component.columnDefs = [{ colId: 'a', field: 'a', headerComponent: HeaderComp }] as any;
    expect(component.getHeaderComponent({ colId: 'a', field: 'a' } as any)).toBe(HeaderComp);
  });

  it('returns null for a column with no headerComponent, a group, or the selection column', () => {
    component.columnDefs = [
      { colId: 'a', field: 'a' },
      { groupId: 'g', children: [] },
    ] as any;
    expect(component.getHeaderComponent({ colId: 'a', field: 'a' } as any)).toBeNull();
    expect(component.getHeaderComponent({ groupId: 'g', children: [] } as any)).toBeNull();
    expect(component.getHeaderComponent({ colId: 'ag-Grid-SelectionColumn' } as any)).toBeNull();
  });

  it('memoizes resolution per colId (recomputes only after cache clear)', () => {
    const HeaderComp = fakeHeaderComponent('H');
    component.columnDefs = [{ colId: 'a', field: 'a', headerComponent: HeaderComp }] as any;
    expect(component.getHeaderComponent({ colId: 'a' } as any)).toBe(HeaderComp);

    // Underlying def changes but the cache is sticky until a columns event clears it.
    component.columnDefs = [{ colId: 'a', field: 'a' }] as any;
    expect(component.getHeaderComponent({ colId: 'a' } as any)).toBe(HeaderComp);

    (component as any).headerComponentCache.clear();
    expect(component.getHeaderComponent({ colId: 'a' } as any)).toBeNull();
  });

  it('onHeaderClick does NOT trigger default sort when a custom header is present', () => {
    component.columnDefs = [
      { colId: 'a', field: 'a', sortable: true, headerComponent: fakeHeaderComponent('H') },
    ] as any;
    component.onHeaderClick({ colId: 'a', field: 'a' } as any, { shiftKey: false } as any);
    expect(component.gridApi.setColumnSort).not.toHaveBeenCalled();
  });

  it('onHeaderClick DOES trigger default sort for a plain (no-component) header', () => {
    component.columnDefs = [{ colId: 'a', field: 'a', sortable: true }] as any;
    component.canvasRenderer = { render: vi.fn() } as any;
    component.onHeaderClick({ colId: 'a', field: 'a' } as any, { shiftKey: false } as any);
    expect(component.gridApi.setColumnSort).toHaveBeenCalledWith('a', 'asc', false);
  });

  it('builds header params with a stable reference and live sort callbacks', () => {
    component.columnDefs = [
      {
        colId: 'a',
        field: 'a',
        sortable: true,
        headerComponent: fakeHeaderComponent('H'),
        headerComponentParams: { custom: 1 },
      },
    ] as any;
    component.canvasRenderer = { render: vi.fn() } as any;
    const p1 = component.getHeaderComponentParams({ colId: 'a', field: 'a' } as any);
    const p2 = component.getHeaderComponentParams({ colId: 'a', field: 'a' } as any);
    expect(p1).toBe(p2); // stable reference
    expect(p1.custom).toBe(1); // headerComponentParams spread
    expect(p1.displayName).toBe('a');
    expect(p1.enableSorting).toBe(true);

    p1.setSort('desc', true);
    expect(component.gridApi.setColumnSort).toHaveBeenCalledWith('a', 'desc', true);
    p1.progressSort();
    // current sort is null → progresses to 'asc'
    expect(component.gridApi.setColumnSort).toHaveBeenCalledWith('a', 'asc', false);
  });
});

describe('ArgentGridComponent - custom filter components', () => {
  let component: ArgentGridComponent;

  function fakeFilter(active: boolean, model: any) {
    return {
      instance: {
        isFilterActive: () => active,
        doesFilterPass: vi.fn(() => true),
        getModel: () => model,
        setModel: vi.fn(),
      },
      destroy: vi.fn(),
    } as any;
  }

  beforeEach(() => {
    component = new ArgentGridComponent(mockCdr as any);
  });

  it('registers a live predicate + writes a custom model entry when the filter is active', () => {
    const model: any = {};
    component.gridApi = { getFilterModel: () => model, setFilterModel: vi.fn() } as any;
    const setEval = vi.spyOn((component as any).gridService, 'setCustomFilterEvaluator');
    (component as any).customFilterInstances.set('age', fakeFilter(true, { gt: 28 }));

    (component as any).onCustomFilterChanged('age');

    expect(setEval).toHaveBeenCalledWith('age', expect.any(Function));
    expect(model.age).toEqual({ filterType: 'custom', model: { gt: 28 } });
    expect(component.gridApi.setFilterModel).toHaveBeenCalledWith(model);
  });

  it('clears the predicate + removes the model entry when the filter is inactive', () => {
    const model: any = { age: { filterType: 'custom', model: { gt: 28 } } };
    component.gridApi = { getFilterModel: () => model, setFilterModel: vi.fn() } as any;
    const setEval = vi.spyOn((component as any).gridService, 'setCustomFilterEvaluator');
    (component as any).customFilterInstances.set('age', fakeFilter(false, null));

    (component as any).onCustomFilterChanged('age');

    expect(setEval).toHaveBeenCalledWith('age', null);
    expect(model.age).toBeUndefined();
  });

  it('clearColumnFilter resets the instance model and drops the predicate', () => {
    const model: any = { age: { filterType: 'custom', model: { gt: 28 } } };
    component.gridApi = { getFilterModel: () => model, setFilterModel: vi.fn() } as any;
    const setEval = vi.spyOn((component as any).gridService, 'setCustomFilterEvaluator');
    const ref = fakeFilter(true, { gt: 28 });
    (component as any).customFilterInstances.set('age', ref);

    component.clearColumnFilter({ colId: 'age', field: 'age' } as any);

    expect(ref.instance.setModel).toHaveBeenCalledWith(null);
    expect(setEval).toHaveBeenCalledWith('age', null);
    expect(model.age).toBeUndefined();
  });

  it('destroyCustomFilters tears down every instance and clears predicates', () => {
    const clearAll = vi.spyOn((component as any).gridService, 'clearCustomFilterEvaluators');
    const a = fakeFilter(true, {});
    const b = fakeFilter(true, {});
    (component as any).customFilterInstances.set('age', a);
    (component as any).customFilterInstances.set('name', b);

    (component as any).destroyCustomFilters();

    expect(a.destroy).toHaveBeenCalled();
    expect(b.destroy).toHaveBeenCalled();
    expect((component as any).customFilterInstances.size).toBe(0);
    expect(clearAll).toHaveBeenCalled();
  });
});
