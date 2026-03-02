/**
 * E2E / Visual Tests — Cell Renderer valueGetter Regression
 *
 * These tests guard against the bug where renderCell() read cell values via
 * `getValueByPath(rowNode.data, column.field)` directly, completely bypassing
 * `ColDef.valueGetter`.  The symptom was:
 *   - CheckboxRenderer: every row appeared checked (raw performance 60-99
 *     is always truthy, but the valueGetter should return `performance >= 80`)
 *   - RatingRenderer: every row showed 5 stars (raw performance 60-99 passed
 *     to Math.round() is always ≥ 5, but the valueGetter scales to 0-5)
 *
 * Data used by both stories (CellRenderers.stories.ts):
 *   performance(i) = 60 + ((i * 7) % 40)
 *
 *   Row  │ perf │ highPerf (≥80) │ stars ((perf-60)/8 rounded)
 *   ─────┼──────┼────────────────┼────────────────────────────
 *     0  │  60  │ false          │ 0
 *     1  │  67  │ false          │ 1
 *     2  │  74  │ false          │ 2
 *     3  │  81  │ true           │ 3
 *     4  │  88  │ true           │ 4
 *     5  │  95  │ true           │ 4  (rounds to 4)
 *     6  │  62  │ false          │ 0
 */

import { expect, test } from '@playwright/test';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Sample the RGBA colour of a single logical pixel from the grid's canvas
 * element.  Accounts for devicePixelRatio so coordinates are always in CSS
 * pixel space (matching the layout calculations below).
 */
async function sampleCanvasPixel(
  page: import('@playwright/test').Page,
  logicalX: number,
  logicalY: number
): Promise<{ r: number; g: number; b: number; a: number }> {
  const canvas = page.locator('canvas.argent-grid-canvas').first();

  return canvas.evaluate(
    (el: HTMLCanvasElement, [lx, ly]: number[]) => {
      const dpr = window.devicePixelRatio || 1;
      const ctx = el.getContext('2d');
      if (!ctx) throw new Error('No 2d context');
      const d = ctx.getImageData(Math.round(lx * dpr), Math.round(ly * dpr), 1, 1).data;
      return { r: d[0], g: d[1], b: d[2], a: d[3] };
    },
    [logicalX, logicalY]
  );
}

/** Wait for the grid canvas to finish its first render. */
async function waitForCanvas(page: import('@playwright/test').Page) {
  await page.waitForSelector('argent-grid', { state: 'visible', timeout: 15000 });
  await page.waitForSelector('canvas.argent-grid-canvas', { state: 'visible', timeout: 10000 });
  // Allow one rAF cycle + any Angular change detection
  await page.waitForTimeout(800);
}

/**
 * Canvas layout constants — must stay in sync with CellRenderers.stories.ts
 * column widths and the default rowHeight (32 px).
 */
const ROW_HEIGHT = 32;

/** Vertical centre of row `i` inside the canvas (canvas starts at data row 0). */
function rowCenterY(i: number) {
  return i * ROW_HEIGHT + ROW_HEIGHT / 2;
}

// ---------------------------------------------------------------------------
// CheckboxRenderer story
// ---------------------------------------------------------------------------

test.describe('CheckboxRenderer — valueGetter regression', () => {
  test('visual snapshot — mixed checked/unchecked checkboxes', async ({ page }) => {
    await page.goto('/iframe.html?id=features-cellrenderers--checkbox-renderer');
    await waitForCanvas(page);
    await page.waitForTimeout(500);

    await expect(page.locator('argent-grid')).toHaveScreenshot('checkbox-renderer-mixed.png');
  });
});

// ---------------------------------------------------------------------------
// RatingRenderer story
// ---------------------------------------------------------------------------

test.describe('RatingRenderer — valueGetter regression', () => {
  /**
   * Story column layout:
   *   id(80) | name(200) | Performance(150) | Stars(Small)(120)
   *
   * "Performance" column starts at x = 280, width = 150.
   * Stars: max=5, size=16, gap=2  ⟹  totalWidth = 5*16 + 4*2 = 88
   *   startX = 280 + (150 − 88) / 2 = 311
   *   star[i] centre x = 311 + i*(16+2) + 8
   *     star[0] ≈ 319,  star[3] ≈ 373
   */
  const starCenterX = (starIndex: number) => 311 + starIndex * 18 + 8;

  test('row 0 (performance=60) shows 0 stars — all star pixels are empty', async ({ page }) => {
    await page.goto('/iframe.html?id=features-cellrenderers--rating-renderer');
    await waitForCanvas(page);

    // Row 0 → (60-60)/8 = 0 stars → all stars should be the empty colour #e5e7eb (light gray)
    const y = rowCenterY(0);
    for (let s = 0; s < 5; s++) {
      const px = await sampleCanvasPixel(page, starCenterX(s), y);
      // Empty star: very light, high R+G around 220-235. Not yellow (R≫G, B low).
      // Just assert it's NOT the bright yellow fill colour (#ffb400 = r255 g180 b0)
      const isYellow = px.r > 200 && px.g > 130 && px.g < 200 && px.b < 50;
      expect(isYellow, `star ${s} of row 0 should not be yellow`).toBe(false);
    }
  });

  test('different rows show different numbers of filled stars', async ({ page }) => {
    await page.goto('/iframe.html?id=features-cellrenderers--rating-renderer');
    await waitForCanvas(page);

    /**
     * Sample the first star of each row and check that row 6 (0 stars) and
     * row 4 (~4 stars) look different.  This would catch the regression where
     * every row got the raw performance value (60-99) passed to drawRating,
     * causing Math.round(67) = 67 ≥ 5 → all 5 stars filled.
     */
    const firstStarX = starCenterX(0);

    const row0px = await sampleCanvasPixel(page, firstStarX, rowCenterY(0));  // 0 stars
    const row4px = await sampleCanvasPixel(page, firstStarX, rowCenterY(4));  // ~4 stars

    // Row 0 first star should be empty (not yellow)
    const row0IsYellow = row0px.r > 200 && row0px.g > 100 && row0px.b < 80;
    expect(row0IsYellow).toBe(false);

    // Row 4 first star should be filled (yellow)
    const row4IsYellow = row4px.r > 180 && row4px.g > 100 && row4px.b < 80;
    expect(row4IsYellow).toBe(true);
  });

  test('visual snapshot — varying star ratings across rows', async ({ page }) => {
    await page.goto('/iframe.html?id=features-cellrenderers--rating-renderer');
    await waitForCanvas(page);
    await page.waitForTimeout(500);

    await expect(page.locator('argent-grid')).toHaveScreenshot('rating-renderer-varied.png');
  });
});
