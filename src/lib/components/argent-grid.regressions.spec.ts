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
