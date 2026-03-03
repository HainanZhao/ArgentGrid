import { test } from '@playwright/test';

test.describe('ArgentGrid Screenshots', () => {
  test.beforeEach(async () => {
    // Skip if not in CI
    test.skip(!process.env.CI, 'Screenshot tests only run in CI');
  });

  test('capture default grid screenshot', async ({ page }) => {
    await page.goto('/iframe.html?id=components-argentgrid--default');
    await page.waitForSelector('argent-grid', { timeout: 15000 });
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: 'e2e/screenshots/grid-default.png',
      fullPage: false,
    });
  });

  test('capture dark mode screenshot', async ({ page }) => {
    await page.goto('/iframe.html?id=features-theming--dark-mode');
    await page.waitForSelector('argent-grid', { timeout: 15000 });
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: 'e2e/screenshots/grid-dark-mode.png',
      fullPage: false,
    });
  });

  test('capture grouping screenshot', async ({ page }) => {
    await page.goto('/iframe.html?id=features-grouping--row-grouping');
    await page.waitForSelector('argent-grid', { timeout: 15000 });
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: 'e2e/screenshots/grid-grouping.png',
      fullPage: false,
    });
  });

  test('capture benchmark screenshot', async ({ page }) => {
    // Capture console errors for debugging
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    
    await page.goto('/iframe.html?id=features-benchmark--benchmark-100-k');
    
    // Wait for the wrapper component to be attached to DOM first
    await page.waitForLoadState('domcontentloaded');
    
    // Then wait for the element with a generous timeout (CI can be slow)
    await page.waitForSelector('app-benchmark-wrapper', { timeout: 120000 });
    
    // Log any console errors for debugging
    if (consoleErrors.length > 0) {
      console.log('Console errors:', consoleErrors);
    }
    
    // Wait for Angular to finish rendering and any initial data to load
    await page.waitForTimeout(3000);

    await page.screenshot({
      path: 'e2e/screenshots/benchmark.png',
      fullPage: false,
    });
  });
});
