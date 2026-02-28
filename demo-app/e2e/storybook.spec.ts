import { test, expect } from '@playwright/test';

test.describe('Storybook Stories', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load Storybook homepage', async ({ page }) => {
    await expect(page).toHaveTitle(/ArgentGrid/);
    await expect(page.locator('storybook-storybook-root')).toBeVisible();
  });

  test('should render Basic story', async ({ page }) => {
    await page.goto('/?path=/story/argentgrid-basic--default');
    await expect(page.locator('argent-grid')).toBeVisible();
  });

  test('should render Large Dataset story', async ({ page }) => {
    await page.goto('/?path=/story/argentgrid-basic--large-dataset');
    await expect(page.locator('argent-grid')).toBeVisible();
    
    // Verify grid renders with 100K rows
    const grid = page.locator('argent-grid');
    await expect(grid).toBeVisible();
    
    // Verify scrolling works
    await grid.evaluate(el => {
      const viewport = el.querySelector('.argent-grid-viewport');
      if (viewport) {
        viewport.scrollTop = 5000;
      }
    });
    
    await page.waitForTimeout(100);
    await expect(grid).toBeVisible();
  });

  test('should render Stock Ticker story', async ({ page }) => {
    await page.goto('/?path=/story/argentgrid-live-updates--stock-ticker');
    await expect(page.locator('argent-grid')).toBeVisible();
    
    // Verify live updates are working
    const grid = page.locator('argent-grid');
    await expect(grid).toBeVisible();
    
    // Wait for updates to occur
    await page.waitForTimeout(2000);
    await expect(grid).toBeVisible();
  });

  test('should render Log Stream story', async ({ page }) => {
    await page.goto('/?path=/story/argentgrid-live-updates--log-stream');
    await expect(page.locator('argent-grid')).toBeVisible();
    
    // Verify log stream is working
    const grid = page.locator('argent-grid');
    await expect(grid).toBeVisible();
    
    // Wait for logs to accumulate
    await page.waitForTimeout(1000);
    await expect(grid).toBeVisible();
  });

  test('should render Light Theme story', async ({ page }) => {
    await page.goto('/?path=/story/argentgrid-theming--light-theme');
    await expect(page.locator('argent-grid')).toBeVisible();
  });

  test('should render Dark Theme story', async ({ page }) => {
    await page.goto('/?path=/story/argentgrid-theming--dark-theme');
    await expect(page.locator('argent-grid')).toBeVisible();
    
    // Verify dark theme is applied
    const grid = page.locator('argent-grid');
    const canvas = grid.locator('canvas').first();
    await expect(canvas).toBeVisible();
  });

  test('should render Custom Theme story', async ({ page }) => {
    await page.goto('/?path=/story/argentgrid-theming--custom-theme');
    await expect(page.locator('argent-grid')).toBeVisible();
  });

  test('should render Material Icons story', async ({ page }) => {
    await page.goto('/?path=/story/argentgrid-theming--material-icons');
    await expect(page.locator('argent-grid')).toBeVisible();
  });

  test('should render Compact Mode story', async ({ page }) => {
    await page.goto('/?path=/story/argentgrid-theming--compact-mode');
    await expect(page.locator('argent-grid')).toBeVisible();
  });
});
