import { expect, test } from '@playwright/test';

test.describe('Benchmark Stories', () => {
  test('should load Benchmark 10K story', async ({ page }) => {
    await page.goto('/iframe.html?id=features-benchmark--benchmark-10-k');
    
    // Wait for the page to be fully loaded first
    await page.waitForLoadState('networkidle');
    
    // Wait for the component to be attached (not necessarily visible yet)
    await page.waitForSelector('app-benchmark-wrapper', { timeout: 30000 });

    // Check buttons exist
    const runButton = page.locator('button:has-text("Run Benchmark")');
    await expect(runButton).toBeVisible({ timeout: 15000 });

    const reloadButton = page.locator('button:has-text("Reload Data")');
    await expect(reloadButton).toBeVisible({ timeout: 5000 });
  });

  test('should load Benchmark 100K story', async ({ page }) => {
    await page.goto('/iframe.html?id=features-benchmark--benchmark-100-k');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('app-benchmark-wrapper', { timeout: 60000 });

    const wrapper = page.locator('app-benchmark-wrapper').first();
    await expect(wrapper).toBeVisible({ timeout: 30000 });

    // Check buttons exist
    const runButton = page.locator('button:has-text("Run Benchmark")');
    await expect(runButton).toBeVisible({ timeout: 15000 });

    const reloadButton = page.locator('button:has-text("Reload Data")');
    await expect(reloadButton).toBeVisible({ timeout: 5000 });
  });

  test('should load Benchmark 500K story', async ({ page }) => {
    await page.goto('/iframe.html?id=features-benchmark--benchmark-500-k');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('app-benchmark-wrapper', { timeout: 120000 });

    const wrapper = page.locator('app-benchmark-wrapper').first();
    await expect(wrapper).toBeVisible({ timeout: 30000 });
  });

  test('should load Benchmark 1M story', async ({ page }) => {
    await page.goto('/iframe.html?id=features-benchmark--benchmark-1-m');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('app-benchmark-wrapper', { timeout: 180000 });

    const wrapper = page.locator('app-benchmark-wrapper').first();
    await expect(wrapper).toBeVisible({ timeout: 60000 });
  });

  test('should run benchmark and display results', async ({ page }) => {
    // Use 10K for faster test execution
    await page.goto('/iframe.html?id=features-benchmark--benchmark-10-k');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('app-benchmark-wrapper', { timeout: 30000 });

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
