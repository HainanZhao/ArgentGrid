/**
 * Blitting Optimization for Canvas Renderer
 *
 * Reuses pixels from previous frame to minimize redraws.
 * Based on Glide Data Grid's blitting architecture.
 */

import { Rectangle, BlitResult, BufferPair } from './types';

// ============================================================================
// BLIT THRESHOLDS
// ============================================================================

/**
 * Minimum scroll delta to trigger blitting
 * Small scrolls are faster to just redraw
 */
const MIN_BLIT_DELTA = 2;

/**
 * Maximum scroll delta before full redraw
 * Large scrolls would copy too much garbage
 */
const MAX_BLIT_DELTA_RATIO = 0.8; // 80% of viewport

// ============================================================================
// BLIT CALCULATIONS
// ============================================================================

/**
 * Determine if blitting is worthwhile for the given scroll delta
 */
export function shouldBlit(
  deltaX: number,
  deltaY: number,
  viewportWidth: number,
  viewportHeight: number
): boolean {
  const absDeltaX = Math.abs(deltaX);
  const absDeltaY = Math.abs(deltaY);

  // No blitting if no scroll
  if (absDeltaX === 0 && absDeltaY === 0) {
    return false;
  }

  // Don't blit tiny movements
  if (absDeltaX < MIN_BLIT_DELTA && absDeltaY < MIN_BLIT_DELTA) {
    return false;
  }

  // Don't blit if scrolling in both directions
  if (absDeltaX > MIN_BLIT_DELTA && absDeltaY > MIN_BLIT_DELTA) {
    return false;
  }

  // Don't blit if scroll is too large (would copy mostly garbage)
  if (absDeltaX > viewportWidth * MAX_BLIT_DELTA_RATIO) {
    return false;
  }
  if (absDeltaY > viewportHeight * MAX_BLIT_DELTA_RATIO) {
    return false;
  }

  return true;
}

/**
 * Calculate blit parameters
 */
export function calculateBlit(
  currentScroll: { x: number; y: number },
  lastScroll: { x: number; y: number },
  viewportSize: { width: number; height: number },
  pinnedWidths: { left: number; right: number }
): {
  canBlit: boolean;
  sourceRect: Rectangle;
  destRect: Rectangle;
  dirtyRegions: Rectangle[];
  deltaX: number;
  deltaY: number;
} {
  const deltaX = currentScroll.x - lastScroll.x;
  const deltaY = currentScroll.y - lastScroll.y;

  const { left: leftPinnedWidth, right: rightPinnedWidth } = pinnedWidths;
  const centerWidth = viewportSize.width - leftPinnedWidth - rightPinnedWidth;

  // Check if blitting is worthwhile
  if (!shouldBlit(deltaX, deltaY, viewportSize.width, viewportSize.height)) {
    return {
      canBlit: false,
      sourceRect: { x: 0, y: 0, width: 0, height: 0 },
      destRect: { x: 0, y: 0, width: 0, height: 0 },
      dirtyRegions: [{ x: 0, y: 0, width: viewportSize.width, height: viewportSize.height }],
      deltaX,
      deltaY,
    };
  }

  const dirtyRegions: Rectangle[] = [];

  // Vertical scroll (most common)
  if (Math.abs(deltaY) >= MIN_BLIT_DELTA && Math.abs(deltaX) < MIN_BLIT_DELTA) {
    const absDelta = Math.abs(deltaY);
    const copyHeight = viewportSize.height - absDelta;

    // Source and destination depend on scroll direction
    const sourceY = deltaY > 0 ? 0 : absDelta;
    const destY = deltaY > 0 ? absDelta : 0;

    // Blit the entire width (center region)
    return {
      canBlit: true,
      sourceRect: {
        x: leftPinnedWidth,
        y: sourceY,
        width: centerWidth,
        height: copyHeight,
      },
      destRect: {
        x: leftPinnedWidth,
        y: destY,
        width: centerWidth,
        height: copyHeight,
      },
      dirtyRegions: [
        // Top strip that needs redraw
        ...(deltaY > 0 ? [{
          x: leftPinnedWidth,
          y: 0,
          width: centerWidth,
          height: absDelta,
        }] : []),
        // Bottom strip that needs redraw
        ...(deltaY < 0 ? [{
          x: leftPinnedWidth,
          y: viewportSize.height - absDelta,
          width: centerWidth,
          height: absDelta,
        }] : []),
      ],
      deltaX,
      deltaY,
    };
  }

  // Horizontal scroll
  if (Math.abs(deltaX) >= MIN_BLIT_DELTA && Math.abs(deltaY) < MIN_BLIT_DELTA) {
    const absDelta = Math.abs(deltaX);
    const copyWidth = centerWidth - absDelta;

    // Source and destination depend on scroll direction
    const sourceX = deltaX > 0 ? leftPinnedWidth : leftPinnedWidth + absDelta;
    const destX = deltaX > 0 ? leftPinnedWidth + absDelta : leftPinnedWidth;

    return {
      canBlit: true,
      sourceRect: {
        x: sourceX,
        y: 0,
        width: copyWidth,
        height: viewportSize.height,
      },
      destRect: {
        x: destX,
        y: 0,
        width: copyWidth,
        height: viewportSize.height,
      },
      dirtyRegions: [
        // Left strip that needs redraw
        ...(deltaX > 0 ? [{
          x: leftPinnedWidth,
          y: 0,
          width: absDelta,
          height: viewportSize.height,
        }] : []),
        // Right strip that needs redraw
        ...(deltaX < 0 ? [{
          x: viewportSize.width - rightPinnedWidth - absDelta,
          y: 0,
          width: absDelta,
          height: viewportSize.height,
        }] : []),
      ],
      deltaX,
      deltaY,
    };
  }

  // Diagonal scroll - just do full redraw
  return {
    canBlit: false,
    sourceRect: { x: 0, y: 0, width: 0, height: 0 },
    destRect: { x: 0, y: 0, width: 0, height: 0 },
    dirtyRegions: [{ x: 0, y: 0, width: viewportSize.width, height: viewportSize.height }],
    deltaX,
    deltaY,
  };
}

// ============================================================================
// BLIT EXECUTION
// ============================================================================

/**
 * Perform blit operation on canvas
 */
export function blitLastFrame(
  ctx: CanvasRenderingContext2D,
  lastCanvas: HTMLCanvasElement,
  currentScroll: { x: number; y: number },
  lastScroll: { x: number; y: number },
  viewportSize: { width: number; height: number },
  pinnedWidths: { left: number; right: number }
): BlitResult {
  const blit = calculateBlit(currentScroll, lastScroll, viewportSize, pinnedWidths);

  if (blit.canBlit) {
    // Use drawImage to copy pixels from last frame
    ctx.drawImage(
      lastCanvas,
      blit.sourceRect.x,
      blit.sourceRect.y,
      blit.sourceRect.width,
      blit.sourceRect.height,
      blit.destRect.x,
      blit.destRect.y,
      blit.destRect.width,
      blit.destRect.height
    );
  }

  return {
    blitted: blit.canBlit,
    regionsToDraw: blit.dirtyRegions,
    deltaX: blit.deltaX,
    deltaY: blit.deltaY,
  };
}

// ============================================================================
// DOUBLE BUFFERING
// ============================================================================

/**
 * Create a buffer pair for double buffering
 */
export function createBufferPair(
  width: number,
  height: number,
  dpr: number = 1
): BufferPair {
  const front = document.createElement('canvas');
  const back = document.createElement('canvas');

  [front, back].forEach(canvas => {
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
  });

  const frontCtx = front.getContext('2d')!;
  const backCtx = back.getContext('2d')!;

  // Set up DPR scaling
  if (dpr !== 1) {
    frontCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    backCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  return { front, back, frontCtx, backCtx };
}

/**
 * Swap front and back buffers
 */
export function swapBuffers(buffers: BufferPair): void {
  const temp = buffers.front;
  buffers.front = buffers.back;
  buffers.back = temp;

  const tempCtx = buffers.frontCtx;
  buffers.frontCtx = buffers.backCtx;
  buffers.backCtx = tempCtx;
}

/**
 * Copy back buffer to front buffer (for display)
 */
export function displayBuffer(
  displayCtx: CanvasRenderingContext2D,
  buffer: HTMLCanvasElement
): void {
  displayCtx.drawImage(buffer, 0, 0);
}

/**
 * Resize buffer pair
 */
export function resizeBufferPair(
  buffers: BufferPair,
  width: number,
  height: number,
  dpr: number = 1
): void {
  [buffers.front, buffers.back].forEach(canvas => {
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
  });

  if (dpr !== 1) {
    buffers.frontCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    buffers.backCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
}

// ============================================================================
// BLIT STATE TRACKING
// ============================================================================

/**
 * Track scroll state for blitting
 */
export class BlitState {
  private lastScrollX: number = 0;
  private lastScrollY: number = 0;
  private lastCanvas: HTMLCanvasElement | null = null;

  /**
   * Update scroll position and return previous position
   */
  updateScroll(x: number, y: number): { x: number; y: number } {
    const last = { x: this.lastScrollX, y: this.lastScrollY };
    this.lastScrollX = x;
    this.lastScrollY = y;
    return last;
  }

  /**
   * Get current scroll position
   */
  getScroll(): { x: number; y: number } {
    return { x: this.lastScrollX, y: this.lastScrollY };
  }

  /**
   * Store the last rendered canvas for blitting
   */
  setLastCanvas(canvas: HTMLCanvasElement): void {
    if (!this.lastCanvas) {
      this.lastCanvas = document.createElement('canvas');
    }
    
    const ctx = this.lastCanvas.getContext('2d')!;
    this.lastCanvas.width = canvas.width;
    this.lastCanvas.height = canvas.height;
    ctx.drawImage(canvas, 0, 0);
  }

  /**
   * Get the last rendered canvas
   */
  getLastCanvas(): HTMLCanvasElement | null {
    return this.lastCanvas;
  }

  /**
   * Check if we have a previous frame to blit from
   */
  hasLastFrame(): boolean {
    return this.lastCanvas !== null;
  }

  /**
   * Reset blit state
   */
  reset(): void {
    this.lastScrollX = 0;
    this.lastScrollY = 0;
    this.lastCanvas = null;
  }
}