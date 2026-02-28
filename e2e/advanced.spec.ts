import { test, expect } from '@playwright/test';

test.describe('Grouping Stories', () => {
  test('should load Row Grouping story', async ({ page }) => {
    await page.goto('/iframe.html?id=features-grouping--row-grouping');
    await page.waitForSelector('argent-grid', { timeout: 15000 });

    const grid = page.locator('argent-grid').first();
    await expect(grid).toBeVisible({ timeout: 10000 });
  });

  test('should load Multi-Level Grouping story', async ({ page }) => {
    await page.goto('/iframe.html?id=features-grouping--multi-level-grouping');
    await page.waitForSelector('argent-grid', { timeout: 15000 });

    const grid = page.locator('argent-grid').first();
    await expect(grid).toBeVisible({ timeout: 10000 });
  });

  test('should load Grouping with Aggregation story', async ({ page }) => {
    await page.goto('/iframe.html?id=features-grouping--grouping-with-aggregation');
    await page.waitForSelector('argent-grid', { timeout: 15000 });

    const grid = page.locator('argent-grid').first();
    await expect(grid).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Filtering Stories', () => {
  test('should load Text Filter story', async ({ page }) => {
    await page.goto('/iframe.html?id=features-filtering--text-filter');
    await page.waitForSelector('argent-grid', { timeout: 15000 });

    const grid = page.locator('argent-grid').first();
    await expect(grid).toBeVisible({ timeout: 10000 });
  });

  test('should load Floating Filters story', async ({ page }) => {
    await page.goto('/iframe.html?id=features-filtering--floating-filters');
    await page.waitForSelector('argent-grid', { timeout: 15000 });

    const grid = page.locator('argent-grid').first();
    await expect(grid).toBeVisible({ timeout: 10000 });
  });

  test('should load Set Filter story', async ({ page }) => {
    await page.goto('/iframe.html?id=features-filtering--set-filter');
    await page.waitForSelector('argent-grid', { timeout: 15000 });

    const grid = page.locator('argent-grid').first();
    await expect(grid).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Advanced Stories', () => {
  test('should load Side Bar story', async ({ page }) => {
    await page.goto('/iframe.html?id=features-advanced--side-bar');
    await page.waitForSelector('argent-grid', { timeout: 15000 });

    const grid = page.locator('argent-grid').first();
    await expect(grid).toBeVisible({ timeout: 10000 });
  });

  test('should load Range Selection story', async ({ page }) => {
    await page.goto('/iframe.html?id=features-advanced--range-selection');
    await page.waitForSelector('argent-grid', { timeout: 15000 });

    const grid = page.locator('argent-grid').first();
    await expect(grid).toBeVisible({ timeout: 10000 });
  });

  test('should load Full Features story', async ({ page }) => {
    await page.goto('/iframe.html?id=features-advanced--full-features');
    await page.waitForSelector('argent-grid', { timeout: 15000 });

    const grid = page.locator('argent-grid').first();
    await expect(grid).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Cell Renderers Stories', () => {
  test('should load Sparkline Area story', async ({ page }) => {
    await page.goto('/iframe.html?id=features-cellrenderers--sparkline-area');
    await page.waitForSelector('argent-grid', { timeout: 15000 });

    const grid = page.locator('argent-grid').first();
    await expect(grid).toBeVisible({ timeout: 10000 });
  });

  test('should load Custom Cell Renderer story', async ({ page }) => {
    await page.goto('/iframe.html?id=features-cellrenderers--custom-cell-renderer');
    await page.waitForSelector('argent-grid', { timeout: 15000 });

    const grid = page.locator('argent-grid').first();
    await expect(grid).toBeVisible({ timeout: 10000 });
  });

  test('should load Status Badge story', async ({ page }) => {
    await page.goto('/iframe.html?id=features-cellrenderers--status-badge');
    await page.waitForSelector('argent-grid', { timeout: 15000 });

    const grid = page.locator('argent-grid').first();
    await expect(grid).toBeVisible({ timeout: 10000 });
  });
});