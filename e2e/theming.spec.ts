import { expect, test } from '@playwright/test';

test.describe('Theming Stories', () => {
  test('should load Light Mode story', async ({ page }) => {
    await page.goto('/iframe.html?id=features-theming--light-mode');
    await page.waitForSelector('argent-grid', { timeout: 15000 });

    const grid = page.locator('argent-grid').first();
    await expect(grid).toBeVisible({ timeout: 10000 });
  });

  test('should load Dark Mode story', async ({ page }) => {
    await page.goto('/iframe.html?id=features-theming--dark-mode');
    await page.waitForSelector('argent-grid', { timeout: 15000 });

    const grid = page.locator('argent-grid').first();
    await expect(grid).toBeVisible({ timeout: 10000 });
  });

  test('should load Compact Mode story', async ({ page }) => {
    await page.goto('/iframe.html?id=features-theming--compact-mode');
    await page.waitForSelector('argent-grid', { timeout: 15000 });

    const grid = page.locator('argent-grid').first();
    await expect(grid).toBeVisible({ timeout: 10000 });
  });

  test('should load Compact Dark Mode story', async ({ page }) => {
    await page.goto('/iframe.html?id=features-theming--compact-dark-mode');
    await page.waitForSelector('argent-grid', { timeout: 15000 });

    const grid = page.locator('argent-grid').first();
    await expect(grid).toBeVisible({ timeout: 10000 });
  });
});
