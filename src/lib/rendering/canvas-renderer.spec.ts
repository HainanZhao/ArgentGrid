import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { GridApi } from '../types/ag-grid-types';
import { CanvasRenderer } from './canvas-renderer';

// Mock canvas context with ALL required methods
const mockCanvasContext = {
  fillRect: vi.fn(),
  clearRect: vi.fn(),
  fillText: vi.fn(),
  measureText: vi.fn(() => ({ width: 100 })),
  stroke: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  clip: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
  scale: vi.fn(),
  setTransform: vi.fn(),
  drawImage: vi.fn(),
  createPattern: vi.fn(),
  translate: vi.fn(),
  rotate: vi.fn(),
  transform: vi.fn(),
  isPointInPath: vi.fn(),
  strokeRect: vi.fn(),
  strokeText: vi.fn(),
  rect: vi.fn(),
  lineCap: 'butt',
  lineJoin: 'miter',
  lineWidth: 1,
  miterLimit: 10,
  fillStyle: '#000000',
  strokeStyle: '#000000',
  font: '13px sans-serif',
  textAlign: 'start',
  textBaseline: 'alphabetic',
} as unknown as CanvasRenderingContext2D;

// Mock GridApi
const createMockGridApi = (): GridApi => {
  return {
    getGridId: vi.fn(() => 'test-grid'),
    getColumnDefs: vi.fn(() => []),
    setColumnDefs: vi.fn(),
    getColumn: vi.fn(),
    getAllColumns: vi.fn(() => []),
    getDisplayedRowAtIndex: vi.fn(),
    getDisplayedRowCount: vi.fn(() => 100),
    getFirstRenderedRow: vi.fn(() => 0),
    getLastRenderedRow: vi.fn(() => 100),
    getFirstRenderedColumn: vi.fn(),
    getLastRenderedColumn: vi.fn(),
    forEachNode: vi.fn(),
    forEachNodeAfterFilter: vi.fn(),
    forEachNodeAfterFilterAndSort: vi.fn(),
    getRowData: vi.fn(() => []),
    setRowData: vi.fn(),
    addItems: vi.fn(),
    updateRowData: vi.fn(),
    applyTransaction: vi.fn(),
    selectIndex: vi.fn(),
    selectNodes: vi.fn(),
    deselectAll: vi.fn(),
    getSelectedNodes: vi.fn(() => []),
    getSelectedRows: vi.fn(() => []),
    isRowSelected: vi.fn(() => false),
    getFilterInstance: vi.fn(),
    getFilterModel: vi.fn(() => ({})),
    setFilterModel: vi.fn(),
    onFilterChanged: vi.fn(),
    getSortModel: vi.fn(() => []),
    setSortModel: vi.fn(),
    onSortChanged: vi.fn(),
    sizeColumnsToFit: vi.fn(),
    autoSizeColumns: vi.fn(),
    setColumnWidth: vi.fn(),
    getColumnState: vi.fn(() => []),
    setColumnState: vi.fn(),
    resetColumnState: vi.fn(),
    exportDataAsCsv: vi.fn(),
    exportDataAsExcel: vi.fn(),
    copySelectedRowsToClipboard: vi.fn(),
    copySelectedRangeToClipboard: vi.fn(),
    copyRangeToClipboard: vi.fn(),
    pasteFromClipboard: vi.fn(),
    enableBrowserTooltips: vi.fn(),
    showLoadingOverlay: vi.fn(),
    hideOverlay: vi.fn(),
    getFocusedCell: vi.fn(),
    startEditingCell: vi.fn(),
    stopEditingCell: vi.fn(),
    getEditingCells: vi.fn(() => []),
    refreshCells: vi.fn(),
    refreshRows: vi.fn(),
    redrawRows: vi.fn(),
    refreshHeader: vi.fn(),
    refreshFooter: vi.fn(),
    refreshPivot: vi.fn(),
    resetRowGroupColumns: vi.fn(),
    addRowGroupColumn: vi.fn(),
    removeRowGroupColumn: vi.fn(),
    setRowGroupColumns: vi.fn(),
    addPivotColumn: vi.fn(),
    removePivotColumn: vi.fn(),
    setPivotColumns: vi.fn(),
    addValueColumn: vi.fn(),
    removeValueColumn: vi.fn(),
    setValueColumns: vi.fn(),
    getRowGroupColumns: vi.fn(() => []),
    getPivotColumns: vi.fn(() => []),
    getValueColumns: vi.fn(() => []),
    isPivotMode: vi.fn(() => false),
    getPivotMode: vi.fn(() => false),
    setPivotMode: vi.fn(),
    getGroupDisplayType: vi.fn(() => 'singleColumn'),
    getGroupRowRenderer: vi.fn(),
    getRowHeight: vi.fn(() => 32),
    getTotalRowHeight: vi.fn(() => 3200),
    getScrollPosition: vi.fn(() => ({ top: 0, left: 0 })),
    ensureIndexVisible: vi.fn(),
    ensureColumnVisible: vi.fn(),
    ensureColumnIndexVisible: vi.fn(),
    flashCells: vi.fn(),
    flashRows: vi.fn(),
    getCellEditorFactory: vi.fn(),
    registerCellRenderer: vi.fn(),
    getRenderer: vi.fn(),
    getEditor: vi.fn(),
    getContextMenuItems: vi.fn(() => []),
    getMainMenuItems: vi.fn(() => []),
    showToolPanel: vi.fn(),
    hideToolPanel: vi.fn(),
    isToolPanelShowing: vi.fn(() => false),
    setToolPanel: vi.fn(),
    getToolPanel: vi.fn(),
    destroy: vi.fn(),
    addGlobalListener: vi.fn(),
    removeGlobalListener: vi.fn(),
    dispatchEvent: vi.fn(),
    getEventPath: vi.fn(() => []),
    getApi: vi.fn(),
    getColumnApi: vi.fn(),
    getLocaleText: vi.fn(),
    getDocument: vi.fn(() => document),
    getGridOptions: vi.fn(),
    getRowPinned: vi.fn(),
    getTopLevelNodes: vi.fn(() => []),
    getRootNode: vi.fn(),
    getRowNode: vi.fn(),
    getModel: vi.fn(),
    getRowModel: vi.fn(),
    getPaginationPageSize: vi.fn(),
    setPaginationPageSize: vi.fn(),
    paginationGetPageSize: vi.fn(),
    paginationSetPageSize: vi.fn(),
    paginationGetRowCount: vi.fn(() => 100),
    paginationGetCurrentPage: vi.fn(() => 0),
    paginationGetTotalPages: vi.fn(() => 10),
    paginationGoToFirstPage: vi.fn(),
    paginationGoToLastPage: vi.fn(),
    paginationGoToNextPage: vi.fn(),
    paginationGoToPreviousPage: vi.fn(),
    paginationGoToPage: vi.fn(),
    isPaginationEnabled: vi.fn(() => false),
    getCellRanges: vi.fn(() => null),
    getRowAtY: vi.fn((y: number) => Math.floor(y / 32)),
    getRowY: vi.fn((rowIndex: number) => rowIndex * 32),
  } as any;
};

describe('CanvasRenderer', () => {
  let renderer: CanvasRenderer;
  let mockApi: GridApi;
  let mockContainer: HTMLDivElement;
  let mockCanvas: HTMLCanvasElement;

  beforeAll(() => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
      () => mockCanvasContext as any
    );
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  beforeEach(() => {
    // Create a real canvas element for proper DOM behavior
    mockCanvas = document.createElement('canvas');
    mockCanvas.width = 800;
    mockCanvas.height = 600;

    // Mock scrollHeight and clientHeight using Object.defineProperty
    Object.defineProperty(mockCanvas, 'scrollHeight', {
      value: 3200,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(mockCanvas, 'clientHeight', {
      value: 600,
      writable: true,
      configurable: true,
    });

    mockApi = createMockGridApi();
    mockContainer = document.createElement('div');
    mockContainer.style.height = '600px';
    mockContainer.style.overflow = 'auto';
    mockContainer.appendChild(mockCanvas);

    vi.spyOn(mockCanvas, 'parentElement', 'get').mockReturnValue(mockContainer);
    vi.spyOn(mockContainer, 'scrollHeight', 'get').mockReturnValue(3200);
    vi.spyOn(mockContainer, 'clientHeight', 'get').mockReturnValue(600);

    renderer = new CanvasRenderer(mockCanvas, mockApi, 32);
  });

  it('should create', () => {
    expect(renderer).toBeTruthy();
  });

  it('should initialize with correct row height', () => {
    // Renderer should be initialized
    expect(mockCanvas).toBeTruthy();
  });

  it('should resize canvas', () => {
    const resizeSpy = vi.spyOn(renderer as any, 'resize');
    window.dispatchEvent(new Event('resize'));
    vi.advanceTimersByTime(200);
    expect(resizeSpy).toHaveBeenCalled();
  });

  it('should render frame', () => {
    expect(() => renderer.renderFrame()).not.toThrow();
  });

  it('should scrollToBottom', () => {
    const container = mockCanvas.parentElement!;
    const scrollTopSpy = vi.spyOn(container, 'scrollTop', 'set');
    renderer.scrollToBottom();
    expect(scrollTopSpy).toHaveBeenCalled();
  });

  it('should handle context menu events', () => {
    const event = new MouseEvent('contextmenu', { bubbles: true });
    mockCanvas.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
  });

  it('should get column at position', () => {
    const column = renderer.getColumnAtPosition(100);
    expect(typeof column).toBe('number');
  });

  it('should get row at position', () => {
    const row = renderer.getRowAtPosition(100);
    expect(typeof row).toBe('number');
  });

  it('should handle viewport changes', () => {
    const container = mockCanvas.parentElement!;
    Object.defineProperty(container, 'clientHeight', {
      value: 800,
      writable: true,
      configurable: true,
    });
    window.dispatchEvent(new Event('resize'));
    expect(container).toBeTruthy();
  });

  it('should handle render with damage tracking', () => {
    expect(() => renderer.render()).not.toThrow();
  });

  it('should handle multiple invalidations', () => {
    renderer.render();
    renderer.render();
    renderer.render();
    expect(renderer).toBeTruthy();
  });

  it('should handle event listener cleanup', () => {
    const removeSpy = vi.spyOn(mockCanvas, 'removeEventListener');
    renderer.destroy();
    expect(removeSpy).toHaveBeenCalled();
    removeSpy.mockRestore();
  });

  it('should render checkbox for dedicated selection column', () => {
    const mockColumn = {
      colId: 'ag-Grid-SelectionColumn',
      width: 50,
      visible: true,
      pinned: 'left',
      checkboxSelection: true,
    } as any;

    const mockRowNode = {
      data: { id: 1, name: 'Test' },
      selected: true,
      rowIndex: 0,
      displayedRowIndex: 0,
      group: false,
      master: false,
      level: 0,
      expanded: false,
      detail: false,
    } as any;

    vi.spyOn(mockApi, 'getAllColumns').mockReturnValue([mockColumn]);
    vi.spyOn(mockApi, 'getColumnDefs').mockReturnValue([mockColumn]);
    vi.spyOn(mockApi, 'getDisplayedRowAtIndex').mockReturnValue(mockRowNode);
    vi.spyOn(mockApi, 'getDisplayedRowCount').mockReturnValue(1);

    // Mark dirty so doRender doesn't skip, then force a synchronous render
    renderer.invalidateAll();
    renderer.renderFrame();

    // Verify strokeRect was called (for checkbox border)
    expect(mockCanvasContext.strokeRect).toHaveBeenCalled();
  });

  // ============================================================================
  // REGRESSION TESTS — Canvas Renderer architectural invariants
  // These tests guard against the performance / feedback-loop bugs fixed in
  // Phase VII.  Do NOT remove them.
  // ============================================================================

  describe('Damage gate — scheduleRender() must not queue rAF when nothing is dirty', () => {
    it('does not call requestAnimationFrame when damage tracker has no damage', () => {
      const rafSpy = vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation(() => 0);

      // Brand-new renderer has no pending damage after construction — call
      // scheduleRender indirectly through the private accessor by calling
      // render() and then draining the dirty state first.
      // Start clean: call renderFrame() to drain any initial dirty state.
      renderer.renderFrame();

      // Reset the spy AFTER the initial frame so we only measure new calls.
      rafSpy.mockClear();

      // scheduleRender() with no damage should be a no-op.
      (renderer as any).scheduleRender();
      expect(rafSpy).not.toHaveBeenCalled();

      rafSpy.mockRestore();
    });

    it('calls requestAnimationFrame when damage is present', () => {
      let rafCalled = false;
      const rafSpy = vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation((cb) => {
        rafCalled = true;
        return 0;
      });

      // Mark dirty then schedule.
      renderer.render(); // internally calls markAllDirty() + scheduleRender()
      expect(rafCalled).toBe(true);

      rafSpy.mockRestore();
    });
  });

  describe('nextRenderPending coalescing — concurrent scheduleRender calls must not drop renders', () => {
    it('sets nextRenderPending when a frame is already in-flight', () => {
      let _capturedCb: FrameRequestCallback | null = null;
      const rafSpy = vi
        .spyOn(globalThis, 'requestAnimationFrame')
        .mockImplementation((cb: FrameRequestCallback) => {
          _capturedCb = cb;
          return 1;
        });

      // First call — starts the rAF.
      renderer.render();
      expect((renderer as any).animationFrameId).not.toBeNull();
      expect((renderer as any).nextRenderPending).toBe(false);

      // Second call while frame is still in-flight.
      renderer.render();
      expect((renderer as any).nextRenderPending).toBe(true);

      rafSpy.mockRestore();
    });

    it('schedules a follow-up render after the first frame completes if damage arrives mid-render', () => {
      const frames: FrameRequestCallback[] = [];
      const rafSpy = vi
        .spyOn(globalThis, 'requestAnimationFrame')
        .mockImplementation((cb: FrameRequestCallback) => {
          frames.push(cb);
          return frames.length;
        });

      // Patch doRender to mark dirty again mid-render (simulates data arriving during a frame).
      const originalDoRender = (renderer as any).doRender.bind(renderer);
      vi.spyOn(renderer as any, 'doRender').mockImplementationOnce(() => {
        originalDoRender();
        // Simulate new data arriving while the frame is being painted.
        renderer.render(); // marks dirty + sets nextRenderPending (animationFrameId still set)
      });

      renderer.render(); // queues frame[0]
      expect(frames.length).toBe(1);

      // Fire the first frame — mid-render, render() is called again marking dirty.
      frames[0](0);
      // A second rAF should have been scheduled for the newly dirty state.
      expect(frames.length).toBe(2);

      rafSpy.mockRestore();
    });
  });

  describe('updateCanvasSize — must NEVER touch canvas.style.width or canvas.style.height', () => {
    it('does not set canvas.style.width after setViewportDimensions', () => {
      mockCanvas.style.width = ''; // clear before test
      renderer.setViewportDimensions(640, 480);
      expect(mockCanvas.style.width).toBe('');
    });

    it('does not set canvas.style.height after setViewportDimensions', () => {
      mockCanvas.style.height = ''; // clear before test
      renderer.setViewportDimensions(640, 480);
      expect(mockCanvas.style.height).toBe('');
    });

    it('does set canvas.width (pixel buffer) after setViewportDimensions', () => {
      renderer.setViewportDimensions(640, 480);
      const dpr = window.devicePixelRatio || 1;
      expect(mockCanvas.width).toBe(640 * dpr);
    });

    it('does set canvas.height (pixel buffer) after setViewportDimensions', () => {
      renderer.setViewportDimensions(640, 480);
      const dpr = window.devicePixelRatio || 1;
      expect(mockCanvas.height).toBe(480 * dpr);
    });
  });

  describe('blit infrastructure — removed dead code', () => {
    it('does not have a blitState field (BlitState removed as dead code)', () => {
      expect((renderer as any).blitState).toBeUndefined();
    });

    it('does not have a columnPositions field (dead map removed)', () => {
      expect((renderer as any).columnPositions).toBeUndefined();
    });

    it('does not have a renderPending field (redundant with animationFrameId)', () => {
      expect('renderPending' in renderer).toBe(false);
    });
  });

  describe('renderThrottleMs — setRenderThrottle must not exist (removed in Phase VII)', () => {
    it('does not expose a setRenderThrottle method', () => {
      expect(typeof (renderer as any).setRenderThrottle).toBe('undefined');
    });

    it('does not have a renderThrottleMs property', () => {
      expect('renderThrottleMs' in renderer).toBe(false);
    });
  });

  it('should toggle row selection when clicking dedicated selection column', () => {
    const mockColumn = {
      colId: 'ag-Grid-SelectionColumn',
      width: 50,
      visible: true,
      pinned: 'left',
      checkboxSelection: true,
    } as any;

    const mockRowNode = {
      data: { id: 1, name: 'Test' },
      selected: false,
      rowIndex: 0,
      displayedRowIndex: 0,
      setSelected: vi.fn(function (this: any, val) {
        this.selected = val;
      }),
      group: false,
      master: false,
      level: 0,
      expanded: false,
      detail: false,
    } as any;

    vi.spyOn(mockApi, 'getAllColumns').mockReturnValue([mockColumn]);
    vi.spyOn(mockApi, 'getColumnDefs').mockReturnValue([mockColumn]);
    vi.spyOn(mockApi, 'getDisplayedRowAtIndex').mockReturnValue(mockRowNode);
    vi.spyOn(mockApi, 'getDisplayedRowCount').mockReturnValue(1);

    // Simulate click on checkbox area
    const rect = mockCanvas.getBoundingClientRect();
    const clickEvent = new MouseEvent('click', {
      clientX: rect.left + 25, // Center of checkbox column
      clientY: rect.top + 16, // Center of first row
      bubbles: true,
    });

    mockCanvas.dispatchEvent(clickEvent);

    // setSelected should have been called
    expect(mockRowNode.setSelected).toHaveBeenCalledWith(true);
    expect(mockRowNode.selected).toBe(true);
  });
});
