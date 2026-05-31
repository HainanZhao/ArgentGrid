import { expect, type Page, test } from '@playwright/test';

/**
 * E2E coverage for T1.2 — full keyboard navigation.
 *
 * The KeyboardNavigation story stashes the GridApi on `window.__gridApi`, so we
 * read focus state (which lives on the canvas, not the DOM) through the API.
 */

type FocusState = { rowIndex: number; colId: string | undefined } | null;

async function getFocus(page: Page): Promise<FocusState> {
  return page.evaluate(() => {
    const api = (window as unknown as { __gridApi?: any }).__gridApi;
    const fc = api?.getFocusedCell?.();
    return fc ? { rowIndex: fc.rowIndex, colId: fc.column?.colId } : null;
  });
}

async function setFocus(page: Page, rowIndex: number, colId: string): Promise<void> {
  await page.evaluate(
    ([r, c]) => {
      (window as unknown as { __gridApi?: any }).__gridApi?.setFocusedCell(r, c);
    },
    [rowIndex, colId] as const
  );
}

test.describe('Keyboard navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/iframe.html?id=components-argentgrid--keyboard-navigation');
    await page.waitForSelector('argent-grid', { timeout: 15000 });
    await page.waitForFunction(
      () => !!(window as unknown as { __gridApi?: unknown }).__gridApi,
      undefined,
      { timeout: 15000 }
    );
    // Ensure the grid container owns keyboard focus.
    await page.locator('.argent-grid-container').focus();
  });

  test('clicking a cell sets the focused cell', async ({ page }) => {
    await page.locator('canvas.argent-grid-canvas').click({ position: { x: 100, y: 60 } });
    const focus = await getFocus(page);
    expect(focus).not.toBeNull();
  });

  test('arrow keys move the focused cell', async ({ page }) => {
    await setFocus(page, 5, 'name');

    await page.keyboard.press('ArrowDown');
    expect(await getFocus(page)).toEqual({ rowIndex: 6, colId: 'name' });

    await page.keyboard.press('ArrowRight');
    expect(await getFocus(page)).toEqual({ rowIndex: 6, colId: 'department' });

    await page.keyboard.press('ArrowUp');
    expect(await getFocus(page)).toEqual({ rowIndex: 5, colId: 'department' });

    await page.keyboard.press('ArrowLeft');
    expect(await getFocus(page)).toEqual({ rowIndex: 5, colId: 'name' });
  });

  test('arrows clamp at the grid edges (no wrap)', async ({ page }) => {
    await setFocus(page, 0, 'id');
    await page.keyboard.press('ArrowUp');
    expect(await getFocus(page)).toEqual({ rowIndex: 0, colId: 'id' });
    await page.keyboard.press('ArrowLeft');
    expect(await getFocus(page)).toEqual({ rowIndex: 0, colId: 'id' });
  });

  test('Tab and Shift-Tab move and wrap across rows', async ({ page }) => {
    await setFocus(page, 0, 'salary'); // last column
    await page.keyboard.press('Tab');
    expect(await getFocus(page)).toEqual({ rowIndex: 1, colId: 'id' }); // wrapped to next row

    await page.keyboard.press('Shift+Tab');
    expect(await getFocus(page)).toEqual({ rowIndex: 0, colId: 'salary' }); // wrapped back
  });

  test('Home/End jump to row edges; Ctrl+Home/End to grid edges', async ({ page }) => {
    await setFocus(page, 5, 'department');

    await page.keyboard.press('Home');
    expect(await getFocus(page)).toEqual({ rowIndex: 5, colId: 'id' });

    await page.keyboard.press('End');
    expect(await getFocus(page)).toEqual({ rowIndex: 5, colId: 'salary' });

    await page.keyboard.press('Control+Home');
    expect(await getFocus(page)).toEqual({ rowIndex: 0, colId: 'id' });

    await page.keyboard.press('Control+End');
    expect(await getFocus(page)).toEqual({ rowIndex: 199, colId: 'salary' });
  });

  test('PageDown scrolls the viewport down', async ({ page }) => {
    await setFocus(page, 0, 'name');
    const before = await page
      .locator('.argent-grid-viewport')
      .evaluate((el) => el.scrollTop);

    await page.keyboard.press('PageDown');

    await expect
      .poll(() => page.locator('.argent-grid-viewport').evaluate((el) => el.scrollTop))
      .toBeGreaterThan(before);
    const focus = await getFocus(page);
    expect(focus?.rowIndex).toBeGreaterThan(0);
  });

  test('Enter opens the editor on the focused cell', async ({ page }) => {
    await setFocus(page, 2, 'name');
    await page.keyboard.press('Enter');
    await expect(page.locator('.argent-grid-cell-editor input')).toBeVisible();
  });

  test('type-to-edit opens the editor seeded with the typed character', async ({ page }) => {
    await setFocus(page, 3, 'name');
    await page.keyboard.press('Z');
    const input = page.locator('.argent-grid-cell-editor input');
    await expect(input).toBeVisible();
    await expect(input).toHaveValue('Z');
  });
});
