import { test, expect } from '@playwright/test';

test.describe('ArgentGrid Screenshots', () => {
  test.beforeEach(async ({ page }) => {
    // Skip if not in CI
    test.skip(!process.env['CI'], 'Screenshot tests only run in CI');
  });

  test('capture default grid screenshot', async ({ page }) => {
    await page.goto('/iframe.html?id=components-argentgrid--default');
    await page.waitForSelector('argent-grid', { timeout: 15000 });
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: 'e2e/screenshots/grid-default.png',
      fullPage: false
    });
  });

  test('capture dark mode screenshot', async ({ page }) => {
    await page.goto('/iframe.html?id=features-theming--dark-mode');
    await page.waitForSelector('argent-grid', { timeout: 15000 });
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: 'e2e/screenshots/grid-dark-mode.png',
      fullPage: false
    });
  });

  test('capture grouping screenshot', async ({ page }) => {
    await page.goto('/iframe.html?id=features-grouping--row-grouping');
    await page.waitForSelector('argent-grid', { timeout: 15000 });
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: 'e2e/screenshots/grid-grouping.png',
      fullPage: false
    });
  });

  test('capture benchmark screenshot', async ({ page }) => {
    await page.goto('/iframe.html?id=features-benchmark--benchmark-10k');
    await page.waitForSelector('app-benchmark-wrapper', { timeout: 15000 });
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: 'e2e/screenshots/benchmark.png',
      fullPage: false
    });
  });
});