import { expect, test } from '@playwright/test';

test.describe('Benchmark Stories', () => {
  async function waitForBenchmarkUi(page: any, timeout = 30000) {
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('button:has-text("Run Benchmark")')).toBeVisible({ timeout });
    await expect(page.locator('argent-grid')).toBeVisible({ timeout });
  }

  test('should load Benchmark 10K story', async ({ page }) => {
    await page.goto('/iframe.html?id=features-benchmark--benchmark-10-k');
    await waitForBenchmarkUi(page, 30000);

    // Check buttons exist
    const runButton = page.locator('button:has-text("Run Benchmark")');
    await expect(runButton).toBeVisible({ timeout: 10000 });

    const reloadButton = page.locator('button:has-text("Reload Data")');
    await expect(reloadButton).toBeVisible({ timeout: 10000 });
  });

  test('should load Benchmark 100K story', async ({ page }) => {
    await page.goto('/iframe.html?id=features-benchmark--benchmark-100-k');
    await waitForBenchmarkUi(page, 60000);

    // Check buttons exist
    const runButton = page.locator('button:has-text("Run Benchmark")');
    await expect(runButton).toBeVisible({ timeout: 10000 });

    const reloadButton = page.locator('button:has-text("Reload Data")');
    await expect(reloadButton).toBeVisible({ timeout: 10000 });
  });

  test('should load Benchmark 500K story', async ({ page }) => {
    await page.goto('/iframe.html?id=features-benchmark--benchmark-500-k');
    await waitForBenchmarkUi(page, 120000);
  });

  test('should load Benchmark 1M story', async ({ page }) => {
    await page.goto('/iframe.html?id=features-benchmark--benchmark-1-m');
    await waitForBenchmarkUi(page, 180000);
  });

  test('should run benchmark and display results', async ({ page }) => {
    // Use 10K for faster test execution
    await page.goto('/iframe.html?id=features-benchmark--benchmark-10-k');
    await waitForBenchmarkUi(page, 30000);

    // Click Run Benchmark
    const runButton = page.locator('button:has-text("Run Benchmark")');
    await runButton.click();

    // Wait for results to appear
    const results = page.locator('.results');
    await expect(results).toBeVisible({ timeout: 60000 });

    // Check result items exist
    const resultItems = page.locator('.result-item');
    const count = await resultItems.count();
    expect(count).toBeGreaterThan(0);
  });
});
