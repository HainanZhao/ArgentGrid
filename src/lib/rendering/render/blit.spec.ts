/**
 * Unit tests for Blitting Optimization
 *
 * Tests for blit calculations, execution, and state management.
 */

import {
  BlitState,
  blitLastFrame,
  calculateBlit,
  createBufferPair,
  displayBuffer,
  MAX_BLIT_DELTA_RATIO,
  MIN_BLIT_DELTA,
  resizeBufferPair,
  shouldBlit,
  swapBuffers,
} from './blit';

// Mock canvas and context
const mockContext = {
  canvas: { width: 800, height: 600, style: {} } as any,
  drawImage: vi.fn(),
  setTransform: vi.fn(),
  getImageData: vi.fn(() => ({ data: new Uint8ClampedArray([255, 0, 0, 255]) })),
  fillRect: vi.fn(),
  fillStyle: '',
} as unknown as CanvasRenderingContext2D;

// Mock HTMLCanvasElement
class MockCanvas {
  width = 800;
  height = 600;
  style = { width: '800px', height: '600px' };

  getContext() {
    return mockContext;
  }
}

// Mock document.createElement for canvas
const originalCreateElement = document.createElement.bind(document);
beforeAll(() => {
  vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
    if (tagName.toLowerCase() === 'canvas') {
      return new MockCanvas() as unknown as HTMLCanvasElement;
    }
    return originalCreateElement(tagName);
  });
});

afterAll(() => {
  vi.restoreAllMocks();
});

describe('Blitting Optimization', () => {
  describe('shouldBlit', () => {
    it('should return false for no scroll', () => {
      expect(shouldBlit(0, 0, 800, 600)).toBe(false);
    });

    it('should return false for tiny scroll deltas', () => {
      expect(shouldBlit(1, 0, 800, 600)).toBe(false);
      expect(shouldBlit(0, 1, 800, 600)).toBe(false);
    });

    it('should return true for moderate vertical scroll', () => {
      expect(shouldBlit(0, 10, 800, 600)).toBe(true);
    });

    it('should return true for moderate horizontal scroll', () => {
      expect(shouldBlit(10, 0, 800, 600)).toBe(true);
    });

    it('should return false for diagonal scroll', () => {
      expect(shouldBlit(10, 10, 800, 600)).toBe(false);
    });

    it('should return false for large scroll delta', () => {
      // More than 80% of viewport
      expect(shouldBlit(0, 500, 800, 600)).toBe(false);
      expect(shouldBlit(650, 0, 800, 600)).toBe(false);
    });

    it('should use MIN_BLIT_DELTA threshold', () => {
      expect(shouldBlit(MIN_BLIT_DELTA - 1, 0, 800, 600)).toBe(false);
      expect(shouldBlit(MIN_BLIT_DELTA, 0, 800, 600)).toBe(true);
    });
  });

  describe('calculateBlit', () => {
    const viewportSize = { width: 800, height: 600 };
    const pinnedWidths = { left: 100, right: 50 };

    it('should return canBlit=false for no scroll change', () => {
      const result = calculateBlit(
        { x: 100, y: 100 },
        { x: 100, y: 100 },
        viewportSize,
        pinnedWidths
      );

      expect(result.canBlit).toBe(false);
      expect(result.dirtyRegions).toHaveLength(1);
      expect(result.dirtyRegions[0]).toEqual({
        x: 0,
        y: 0,
        width: 800,
        height: 600,
      });
    });

    it('should calculate vertical scroll blit (down)', () => {
      const result = calculateBlit(
        { x: 0, y: 100 }, // Current
        { x: 0, y: 0 }, // Last
        viewportSize,
        pinnedWidths
      );

      expect(result.canBlit).toBe(true);
      expect(result.deltaY).toBe(100);
      expect(result.deltaX).toBe(0);

      // Scrolling down: top strip needs redraw
      expect(result.dirtyRegions).toHaveLength(1);
      expect(result.dirtyRegions[0].y).toBe(0);
      expect(result.dirtyRegions[0].height).toBe(100);

      // Source should start at 0
      expect(result.sourceRect.y).toBe(0);
      // Dest should start at deltaY
      expect(result.destRect.y).toBe(100);
    });

    it('should calculate vertical scroll blit (up)', () => {
      const result = calculateBlit(
        { x: 0, y: 0 }, // Current
        { x: 0, y: 100 }, // Last
        viewportSize,
        pinnedWidths
      );

      expect(result.canBlit).toBe(true);
      expect(result.deltaY).toBe(-100);

      // Scrolling up: bottom strip needs redraw
      expect(result.dirtyRegions).toHaveLength(1);
      expect(result.dirtyRegions[0].y).toBe(500); // 600 - 100
      expect(result.dirtyRegions[0].height).toBe(100);
    });

    it('should calculate horizontal scroll blit (right)', () => {
      const result = calculateBlit(
        { x: 100, y: 0 }, // Current
        { x: 0, y: 0 }, // Last
        viewportSize,
        pinnedWidths
      );

      expect(result.canBlit).toBe(true);
      expect(result.deltaX).toBe(100);
      expect(result.deltaY).toBe(0);

      // Scrolling right: left strip needs redraw
      expect(result.dirtyRegions).toHaveLength(1);
      expect(result.dirtyRegions[0].x).toBe(100); // left pinned width
      expect(result.dirtyRegions[0].width).toBe(100);
    });

    it('should calculate horizontal scroll blit (left)', () => {
      const result = calculateBlit(
        { x: 0, y: 0 }, // Current
        { x: 100, y: 0 }, // Last
        viewportSize,
        pinnedWidths
      );

      expect(result.canBlit).toBe(true);
      expect(result.deltaX).toBe(-100);

      // Scrolling left: right strip needs redraw
      expect(result.dirtyRegions).toHaveLength(1);
    });

    it('should return full redraw for diagonal scroll', () => {
      const result = calculateBlit({ x: 50, y: 50 }, { x: 0, y: 0 }, viewportSize, pinnedWidths);

      expect(result.canBlit).toBe(false);
      expect(result.dirtyRegions[0].width).toBe(800);
      expect(result.dirtyRegions[0].height).toBe(600);
    });

    it('should account for pinned widths', () => {
      const result = calculateBlit({ x: 100, y: 0 }, { x: 0, y: 0 }, viewportSize, pinnedWidths);

      // Center region is between pinned columns
      expect(result.sourceRect.x).toBe(100); // left pinned width
      // Center width is 800 - 100 - 50 = 650
      expect(result.sourceRect.width).toBe(550); // 650 - 100 (delta)
    });
  });

  describe('blitLastFrame', () => {
    beforeEach(() => {
      (mockContext.drawImage as ReturnType<typeof vi.fn>).mockClear();
    });

    it('should return blitted=false when blitting not possible', () => {
      const lastCanvas = new MockCanvas() as unknown as HTMLCanvasElement;

      const result = blitLastFrame(
        mockContext,
        lastCanvas,
        { x: 0, y: 0 },
        { x: 0, y: 0 },
        { width: 800, height: 600 },
        { left: 0, right: 0 }
      );

      expect(result.blitted).toBe(false);
    });

    it('should perform blit when possible', () => {
      const lastCanvas = new MockCanvas() as unknown as HTMLCanvasElement;

      const result = blitLastFrame(
        mockContext,
        lastCanvas,
        { x: 0, y: 100 },
        { x: 0, y: 0 },
        { width: 800, height: 600 },
        { left: 0, right: 0 }
      );

      expect(result.blitted).toBe(true);
      expect(result.regionsToDraw.length).toBeGreaterThan(0);
      expect(mockContext.drawImage).toHaveBeenCalled();
    });
  });

  describe('createBufferPair', () => {
    it('should create front and back buffers', () => {
      const buffers = createBufferPair(800, 600);

      expect(buffers.front).toBeDefined();
      expect(buffers.back).toBeDefined();
      expect(buffers.frontCtx).toBeDefined();
      expect(buffers.backCtx).toBeDefined();
    });

    it('should set correct dimensions', () => {
      const buffers = createBufferPair(800, 600);

      expect(buffers.front.width).toBe(800);
      expect(buffers.front.height).toBe(600);
      expect(buffers.back.width).toBe(800);
      expect(buffers.back.height).toBe(600);
    });

    it('should apply DPR scaling', () => {
      const buffers = createBufferPair(800, 600, 2);

      expect(buffers.front.width).toBe(1600);
      expect(buffers.front.height).toBe(1200);
      expect(buffers.front.style.width).toBe('800px');
      expect(buffers.front.style.height).toBe('600px');
    });
  });

  describe('swapBuffers', () => {
    it('should swap front and back buffers', () => {
      const buffers = createBufferPair(800, 600);
      const originalFront = buffers.front;
      const originalBack = buffers.back;

      swapBuffers(buffers);

      expect(buffers.front).toBe(originalBack);
      expect(buffers.back).toBe(originalFront);
    });

    it('should swap contexts too', () => {
      const buffers = createBufferPair(800, 600);
      const _originalFrontCtx = buffers.frontCtx;

      swapBuffers(buffers);

      expect(buffers.frontCtx).toBe(buffers.backCtx);
    });
  });

  describe('displayBuffer', () => {
    beforeEach(() => {
      (mockContext.drawImage as ReturnType<typeof vi.fn>).mockClear();
    });

    it('should copy buffer to display context', () => {
      const buffer = new MockCanvas() as unknown as HTMLCanvasElement;

      displayBuffer(mockContext, buffer);

      expect(mockContext.drawImage).toHaveBeenCalled();
    });
  });

  describe('resizeBufferPair', () => {
    it('should resize both buffers', () => {
      const buffers = createBufferPair(800, 600);

      resizeBufferPair(buffers, 1024, 768);

      expect(buffers.front.width).toBe(1024);
      expect(buffers.front.height).toBe(768);
      expect(buffers.back.width).toBe(1024);
      expect(buffers.back.height).toBe(768);
    });

    it('should apply DPR on resize', () => {
      const buffers = createBufferPair(800, 600);

      resizeBufferPair(buffers, 1024, 768, 2);

      expect(buffers.front.width).toBe(2048);
      expect(buffers.front.height).toBe(1536);
    });
  });

  describe('BlitState', () => {
    let state: BlitState;

    beforeEach(() => {
      state = new BlitState();
    });

    describe('updateScroll', () => {
      it('should update and return last scroll position', () => {
        const last = state.updateScroll(100, 200);

        expect(last.x).toBe(0);
        expect(last.y).toBe(0);

        const next = state.updateScroll(150, 250);
        expect(next.x).toBe(100);
        expect(next.y).toBe(200);
      });
    });

    describe('getScroll', () => {
      it('should return current scroll position', () => {
        state.updateScroll(100, 200);

        const scroll = state.getScroll();
        expect(scroll.x).toBe(100);
        expect(scroll.y).toBe(200);
      });
    });

    describe('lastCanvas', () => {
      it('should store and retrieve last canvas', () => {
        const canvas = new MockCanvas() as unknown as HTMLCanvasElement;
        canvas.width = 800;
        canvas.height = 600;

        state.setLastCanvas(canvas);

        const lastCanvas = state.getLastCanvas();
        expect(lastCanvas).not.toBeNull();
        expect(lastCanvas?.width).toBe(800);
        expect(lastCanvas?.height).toBe(600);
      });

      it('should report hasLastFrame correctly', () => {
        expect(state.hasLastFrame()).toBe(false);

        state.setLastCanvas(new MockCanvas() as unknown as HTMLCanvasElement);
        expect(state.hasLastFrame()).toBe(true);
      });
    });

    describe('reset', () => {
      it('should reset all state', () => {
        state.updateScroll(100, 200);
        state.setLastCanvas(new MockCanvas() as unknown as HTMLCanvasElement);

        state.reset();

        expect(state.getScroll()).toEqual({ x: 0, y: 0 });
        expect(state.hasLastFrame()).toBe(false);
      });
    });
  });

  describe('Constants', () => {
    it('MIN_BLIT_DELTA should be reasonable', () => {
      expect(MIN_BLIT_DELTA).toBeGreaterThan(0);
      expect(MIN_BLIT_DELTA).toBeLessThan(10);
    });

    it('MAX_BLIT_DELTA_RATIO should be reasonable', () => {
      expect(MAX_BLIT_DELTA_RATIO).toBeGreaterThan(0.5);
      expect(MAX_BLIT_DELTA_RATIO).toBeLessThan(1);
    });
  });

  describe('Edge cases', () => {
    it('should handle zero viewport size', () => {
      const result = calculateBlit(
        { x: 0, y: 0 },
        { x: 0, y: 0 },
        { width: 0, height: 0 },
        { left: 0, right: 0 }
      );

      expect(result.canBlit).toBe(false);
    });

    it('should handle scroll delta equal to viewport', () => {
      const result = calculateBlit(
        { x: 0, y: 600 },
        { x: 0, y: 0 },
        { width: 800, height: 600 },
        { left: 0, right: 0 }
      );

      // Should not blit when delta equals viewport
      expect(result.canBlit).toBe(false);
    });

    it('should handle large pinned widths', () => {
      const result = calculateBlit(
        { x: 0, y: 100 },
        { x: 0, y: 0 },
        { width: 800, height: 600 },
        { left: 400, right: 300 }
      );

      // Very small center area (100px)
      expect(result.canBlit).toBe(true);
    });
  });
});
