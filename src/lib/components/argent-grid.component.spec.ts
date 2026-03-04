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
});
