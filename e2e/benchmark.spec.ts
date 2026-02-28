import { test, expect } from '@playwright/test';

test.describe('Benchmark Stories', () => {
  test('should load Benchmark 10K story', async ({ page }) => {
    await page.goto('/iframe.html?id=features-benchmark--benchmark-10-k');
    await page.waitForSelector('app-benchmark-wrapper', { timeout: 15000 });

    const wrapper = page.locator('app-benchmark-wrapper').first();
    await expect(wrapper).toBeVisible({ timeout: 10000 });

    // Check buttons exist
    const runButton = page.locator('button:has-text("Run Benchmark")');
    await expect(runButton).toBeVisible();

    const reloadButton = page.locator('button:has-text("Reload Data")');
    await expect(reloadButton).toBeVisible();
  });

  test('should load Benchmark 50K story', async ({ page }) => {
    await page.goto('/iframe.html?id=features-benchmark--benchmark-50-k');
    await page.waitForSelector('app-benchmark-wrapper', { timeout: 15000 });

    const wrapper = page.locator('app-benchmark-wrapper').first();
    await expect(wrapper).toBeVisible({ timeout: 10000 });
  });

  test('should load Benchmark 100K story', async ({ page }) => {
    await page.goto('/iframe.html?id=features-benchmark--benchmark-100-k');
    await page.waitForSelector('app-benchmark-wrapper', { timeout: 15000 });

    const wrapper = page.locator('app-benchmark-wrapper').first();
    await expect(wrapper).toBeVisible({ timeout: 10000 });
  });

  test('should run benchmark and display results', async ({ page }) => {
    await page.goto('/iframe.html?id=features-benchmark--benchmark-10-k');
    await page.waitForSelector('app-benchmark-wrapper', { timeout: 15000 });

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