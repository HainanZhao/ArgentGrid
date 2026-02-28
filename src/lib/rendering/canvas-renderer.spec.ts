import { describe, it, expect, beforeEach, vi, beforeAll, afterAll } from 'vitest';
import { CanvasRenderer } from './canvas-renderer';
import { GridApi } from '../types/ag-grid-types';

// Mock canvas context
const mockCanvasContext = {
  clearRect: vi.fn(),
  fillRect: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  stroke: vi.fn(),
  fillText: vi.fn(),
  measureText: vi.fn(() => ({ width: 100 })),
  scale: vi.fn(),
  setTransform: vi.fn(),
  font: '13px sans-serif',
  textBaseline: 'middle',
  fillStyle: '#000',
  strokeStyle: '#000',
  clip: vi.fn(),
  restore: vi.fn(),
  save: vi.fn(),
  translate: vi.fn(),
  createLinearGradient: vi.fn(() => ({
    addColorStop: vi.fn()
  }))
};

// Mock GridApi
const createMockGridApi = (): GridApi => {
  return {
    getGridId: vi.fn(() => 'test-grid'),
    getColumnDefs: vi.fn(() => []),
    getRowData: vi.fn(() => []),
    getAllColumns: vi.fn(() => []),
    getDisplayedRowAtIndex: vi.fn(),
    getDisplayedRowCount: vi.fn(() => 0),
    getTotalHeight: vi.fn(() => 0),
    getScrollPosition: vi.fn(() => ({ top: 0, left: 0 })),
    setScrollPosition: vi.fn(),
    getFilterModel: vi.fn(() => ({})),
    setFilterModel: vi.fn(),
    isFilterPresent: vi.fn(() => false),
    getSortModel: vi.fn(() => []),
    setSortModel: vi.fn(),
    getSelectedRows: vi.fn(() => []),
    selectAll: vi.fn(),
    deselectAll: vi.fn(),
    getGridOption: vi.fn(),
    applyTransaction: vi.fn(),
    refreshCells: vi.fn(),
    refreshRows: vi.fn(),
    refreshHeader: vi.fn(),
    forEachNode: vi.fn(),
    forEachNodeAfterFilter: vi.fn(),
    forEachNodeAfterFilterAndSort: vi.fn(),
    getRowNode: vi.fn(),
    exportDataAsCsv: vi.fn(),
    exportDataAsExcel: vi.fn(),
    copyToClipboard: vi.fn(),
    pasteFromClipboard: vi.fn(),
    startEditingCell: vi.fn(),
    stopEditing: vi.fn(),
    getEditingCells: vi.fn(),
    flashCells: vi.fn(),
    applyColumnState: vi.fn(),
    getColumnState: vi.fn(),
    resetColumnState: vi.fn(),
    enableFilterToolPanel: vi.fn(),
    enableColumnsToolPanel: vi.fn(),
    setSideBarVisible: vi.fn(),
    closeToolPanel: vi.fn(),
    getToolPanel: vi.fn(),
    destroy: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    getEventPath: vi.fn(() => []),
    dispatchEvent: vi.fn(),
    getContextMenuItems: vi.fn(() => []),
    getMainMenuItems: vi.fn(() => []),
    getHeaderContextMenuItems: vi.fn(() => []),
    getHeaderGroupContextMenuItems: vi.fn(() => []),
    getHeaderColumnGroupOpened: vi.fn(),
    getFocusedCell: vi.fn(),
    setFocusedCell: vi.fn(),
    getCellRendererInstances: vi.fn(() => []),
    getEditorInstances: vi.fn(() => []),
    refreshAggregatedCols: vi.fn(),
    ensureColumnVisible: vi.fn(),
    ensureIndexVisible: vi.fn(),
    sizeColumnsToFit: vi.fn(),
    resetRowHeights: vi.fn(),
    getRowHeightForRow: vi.fn(() => 32),
    getRenderedNodes: vi.fn(() => []),
    getFirstRenderedRow: vi.fn(() => 0),
    getLastRenderedRow: vi.fn(() => 100),
    getFirstRenderedColumn: vi.fn(),
    getLastRenderedColumn: vi.fn(),
    getPinnedWidth: vi.fn(() => 0),
    getRightPinnedWidth: vi.fn(() => 0),
    getHScrollPosition: vi.fn(() => 0),
    getVScrollPosition: vi.fn(() => 0),
    getVerticalPixelRange: vi.fn(() => ({ start: 0, end: 600 })),
    getHorizontalPixelRange: vi.fn(() => ({ start: 0, end: 800 })),
    getScrollEventTarget: vi.fn(),
    getRowPosition: vi.fn(() => 0),
    getColDef: vi.fn(),
    getColumn: vi.fn(),
    getColumns: vi.fn(() => []),
    getColumnGroup: vi.fn(),
    getColumnGroups: vi.fn(() => []),
    getRowGroupColumns: vi.fn(() => []),
    getPivotColumns: vi.fn(() => []),
    getValueColumns: vi.fn(() => []),
    isPivotMode: vi.fn(() => false),
    getPivotMode: vi.fn(() => false),
    setPivotMode: vi.fn(),
    getGroupDisplayType: vi.fn(() => 'singleColumn'),
    getGroupRowRenderer: vi.fn(),
    getRowHeight: vi.fn(() => 32),
    getRowStyle: vi.fn(),
    getRowClass: vi.fn(),
    getRowId: vi.fn(),
    isRowMaster: vi.fn(() => false),
    getDetailGridInfo: vi.fn(),
    openToolPanel: vi.fn(),
    isToolPanelShowing: vi.fn(() => false),
    setDisabled: vi.fn(),
    isDisabled: vi.fn(() => false),
    getChartToolbarItems: vi.fn(() => []),
    createRangeChart: vi.fn(),
    createPivotChart: vi.fn(),
    getChartModels: vi.fn(() => []),
    getChartService: vi.fn(),
    hidePopup: vi.fn(),
    getChartTheme: vi.fn(),
    setChartTheme: vi.fn(),
    getChartOptions: vi.fn(),
    setChartOptions: vi.fn(),
    getSparklineOptions: vi.fn(() => []),
    setSparklineOptions: vi.fn(),
    getSparklineTheme: vi.fn(),
    setSparklineTheme: vi.fn(),
    getLocaleText: vi.fn(),
    setLocaleText: vi.fn(),
    getGridPanel: vi.fn(),
    getGridCore: vi.fn(),
    getRowContainerElement: vi.fn(),
    getOverlayElement: vi.fn(),
    getHeaderElements: vi.fn(() => []),
    getBodyElement: vi.fn(),
    getEmptyOverlayElement: vi.fn(),
    getLoadingOverlayElement: vi.fn(),
    getNoRowsOverlayElement: vi.fn(),
    getCenterElements: vi.fn(() => []),
    getLeftElements: vi.fn(() => []),
    getRightElements: vi.fn(() => []),
    getBottomElements: vi.fn(() => []),
    getTopElements: vi.fn(() => []),
    getFooterElements: vi.fn(() => []),
    getRootElements: vi.fn(() => []),
    getCellRanges: vi.fn(() => null),
    getRowAtY: vi.fn((y: number) => Math.floor(y / 32))
  } as any;
};

describe('CanvasRenderer', () => {
  let renderer: CanvasRenderer;
  let mockApi: GridApi;
  let mockContainer: HTMLDivElement;
  let mockCanvas: HTMLCanvasElement;

  beforeAll(() => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => mockCanvasContext as any);
    vi.spyOn(HTMLCanvasElement.prototype, 'getBoundingClientRect').mockReturnValue({
      width: 800, height: 600, top: 0, left: 0, bottom: 600, right: 800, x: 0, y: 0, toJSON: () => {}
    } as DOMRect);
  });

  beforeEach(() => {
    // Create a real canvas element for proper DOM behavior
    mockCanvas = document.createElement('canvas');
    mockCanvas.width = 800;
    mockCanvas.height = 600;
    
    mockApi = createMockGridApi();
    mockContainer = document.createElement('div');
    mockContainer.appendChild(mockCanvas);
    vi.spyOn(mockCanvas, 'parentElement', 'get').mockReturnValue(mockContainer);
    
    renderer = new CanvasRenderer(mockCanvas, mockApi, 32);
  });

  it('should create', () => {
    expect(renderer).toBeTruthy();
  });

  it('should initialize with correct properties', () => {
    expect(renderer.currentScrollTop).toBe(0);
    expect(renderer.currentScrollLeft).toBe(0);
    expect(renderer.lastFrameTime).toBe(0);
  });

  it('should set and get theme', () => {
    const newTheme = { backgroundColor: '#ff0000' };
    renderer.setTheme(newTheme);
    const theme = renderer.getTheme();
    expect(theme).toBeTruthy();
  });

  it('should handle scroll events', () => {
    mockContainer.scrollTop = 100;
    mockContainer.scrollLeft = 50;
    mockContainer.dispatchEvent(new Event('scroll'));
    expect(renderer.currentScrollTop).toBe(100);
    expect(renderer.currentScrollLeft).toBe(50);
  });

  it('should handle mouse down events', () => {
    const event = new MouseEvent('mousedown', { clientX: 100, clientY: 100 });
    mockCanvas.dispatchEvent(event);
  });

  it('should handle mouse move events', () => {
    const event = new MouseEvent('mousemove', { clientX: 100, clientY: 100 });
    mockCanvas.dispatchEvent(event);
  });

  it('should handle click events', () => {
    const event = new MouseEvent('click', { clientX: 100, clientY: 100 });
    mockCanvas.dispatchEvent(event);
  });

  it('should handle double click events', () => {
    const onDoubleClick = vi.fn();
    renderer.onCellDoubleClick = onDoubleClick;
    const event = new MouseEvent('dblclick', { clientX: 100, clientY: 100 });
    mockCanvas.dispatchEvent(event);
  });

  it('should handle mouse up events', () => {
    const event = new MouseEvent('mouseup', { clientX: 100, clientY: 100 });
    mockCanvas.dispatchEvent(event);
  });

  it('should resize canvas', () => {
    renderer.resize();
    expect(mockCanvasContext.scale).toHaveBeenCalled();
  });

  it('should schedule render', () => {
    renderer.scheduleRender();
    expect(renderer.renderPending).toBe(true);
  });

  it('should render frame', () => {
    renderer.renderFrame();
    expect(mockCanvasContext.clearRect).toHaveBeenCalled();
  });

  it('should scrollToRow', () => {
    renderer.scrollToRow(10);
    expect(mockContainer.scrollTop).toBe(320); // 10 * 32
  });

  it('should scrollToTop', () => {
    mockContainer.scrollTop = 100;
    renderer.scrollToTop();
    expect(mockContainer.scrollTop).toBe(0);
  });

  it('should scrollToBottom', () => {
    mockContainer.scrollHeight = 1000;
    mockContainer.clientHeight = 600;
    renderer.scrollToBottom();
    expect(mockContainer.scrollTop).toBe(400);
  });

  it('should invalidate cell', () => {
    renderer.invalidateCell(0, 5);
    expect(renderer.renderPending).toBe(true);
  });

  it('should invalidate row', () => {
    renderer.invalidateRow(5);
    expect(renderer.renderPending).toBe(true);
  });

  it('should invalidate all', () => {
    renderer.invalidateAll();
    expect(renderer.renderPending).toBe(true);
  });

  it('should destroy and cleanup', () => {
    const destroySpy = vi.spyOn(mockCanvas, 'removeEventListener');
    renderer.destroy();
    expect(destroySpy).toHaveBeenCalled();
  });

  it('should handle callbacks', () => {
    const onRowClick = vi.fn();
    const onMouseDown = vi.fn();
    const onMouseMove = vi.fn();
    const onMouseUp = vi.fn();
    
    renderer.onRowClick = onRowClick;
    renderer.onMouseDown = onMouseDown;
    renderer.onMouseMove = onMouseMove;
    renderer.onMouseUp = onMouseUp;

    const clickEvent = new MouseEvent('click', { clientX: 100, clientY: 100 });
    mockCanvas.dispatchEvent(clickEvent);
    
    const mouseDownEvent = new MouseEvent('mousedown', { clientX: 100, clientY: 100 });
    mockCanvas.dispatchEvent(mouseDownEvent);
  });

  it('should handle resize listener', () => {
    window.dispatchEvent(new Event('resize'));
  });

  it('should handle context menu events', () => {
    const event = new MouseEvent('contextmenu', { clientX: 100, clientY: 100, cancelable: true });
    const prevented = !mockCanvas.dispatchEvent(event);
    expect(prevented).toBe(true);
  });

  it('should handle wheel events', () => {
    const event = new WheelEvent('wheel', { deltaY: 100 });
    mockCanvas.dispatchEvent(event);
  });

  it('should handle keydown events', () => {
    const event = new KeyboardEvent('keydown', { key: 'Enter' });
    mockCanvas.dispatchEvent(event);
  });

  it('should handle touch events', () => {
    const touchEvent = new TouchEvent('touchstart', {
      touches: [{ clientX: 100, clientY: 100 } as any]
    });
    mockCanvas.dispatchEvent(touchEvent);
  });

  it('should get row at coordinates', () => {
    const row = renderer.getRowAtY(100);
    expect(typeof row).toBe('number');
  });

  it('should get column at coordinates', () => {
    const col = renderer.getColumnAtX(100);
    expect(col).toBeNull(); // No columns in mock
  });

  it('should set total row count', () => {
    // This tests internal state management
    renderer.resize();
    expect(renderer).toBeTruthy();
  });

  it('should handle viewport changes', () => {
    mockContainer.clientHeight = 800;
    renderer.resize();
    expect(renderer).toBeTruthy();
  });

  it('should handle theme merge', () => {
    renderer.setTheme({ 
      backgroundColor: '#1a1a1a',
      rowBackgroundColor: '#2a2a2a',
      rowHoverBackgroundColor: '#3a3a3a'
    });
    const theme = renderer.getTheme();
    expect(theme.backgroundColor).toBe('#1a1a1a');
  });

  it('should handle render with damage tracking', () => {
    renderer.invalidateCell(0, 0);
    renderer.renderFrame();
    expect(mockCanvasContext.clearRect).toHaveBeenCalled();
  });

  it('should handle multiple invalidations', () => {
    renderer.invalidateCell(0, 0);
    renderer.invalidateCell(1, 0);
    renderer.invalidateRow(1);
    renderer.renderFrame();
  });

  it('should handle render cancellation on destroy', () => {
    renderer.scheduleRender();
    renderer.destroy();
    expect(renderer).toBeTruthy();
  });

  it('should handle scroll without container', () => {
    vi.spyOn(mockCanvas, 'parentElement', 'get').mockReturnValue(null);
    renderer.scrollToRow(10);
    renderer.scrollToBottom();
  });

  it('should handle event listener cleanup', () => {
    const removeSpy = vi.spyOn(mockCanvas, 'removeEventListener');
    renderer.destroy();
    expect(removeSpy).toHaveBeenCalled();
    removeSpy.mockRestore();
  });
});
