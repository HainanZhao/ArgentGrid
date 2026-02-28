import { test, expect } from '@playwright/test';

test.describe('ArgentGrid Stories', () => {
  test('should load ArgentGrid Default story', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/iframe.html?id=components-argentgrid--default');
    await page.waitForSelector('argent-grid', { timeout: 15000 });

    // Check grid container is visible
    const grid = page.locator('argent-grid').first();
    await expect(grid).toBeVisible({ timeout: 10000 });

    // No critical errors
    const criticalErrors = errors.filter(e => 
      e.includes('NG0203') || e.includes('NG0201') || e.includes('NullInjectorError')
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test('should load Large Dataset story', async ({ page }) => {
    await page.goto('/iframe.html?id=components-argentgrid--large-dataset');
    await page.waitForSelector('argent-grid', { timeout: 15000 });

    const grid = page.locator('argent-grid').first();
    await expect(grid).toBeVisible({ timeout: 10000 });
  });

  test('should load Empty state story', async ({ page }) => {
    await page.goto('/iframe.html?id=components-argentgrid--empty');
    await page.waitForSelector('argent-grid', { timeout: 15000 });

    const grid = page.locator('argent-grid').first();
    await expect(grid).toBeVisible({ timeout: 10000 });
  });

  test('should load With Sorting story', async ({ page }) => {
    await page.goto('/iframe.html?id=components-argentgrid--with-sorting');
    await page.waitForSelector('argent-grid', { timeout: 15000 });

    const grid = page.locator('argent-grid').first();
    await expect(grid).toBeVisible({ timeout: 10000 });
  });

  test('should load With Selection story', async ({ page }) => {
    await page.goto('/iframe.html?id=components-argentgrid--with-selection');
    await page.waitForSelector('argent-grid', { timeout: 15000 });

    const grid = page.locator('argent-grid').first();
    await expect(grid).toBeVisible({ timeout: 10000 });
  });

  test('should load With Filtering story', async ({ page }) => {
    await page.goto('/iframe.html?id=components-argentgrid--with-filtering');
    await page.waitForSelector('argent-grid', { timeout: 15000 });

    const grid = page.locator('argent-grid').first();
    await expect(grid).toBeVisible({ timeout: 10000 });
  });
});