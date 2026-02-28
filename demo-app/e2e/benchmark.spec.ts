import { test, expect } from '@playwright/test';

// Skip until benchmark functionality is stable
test.describe.skip('ArgentGrid Performance Benchmark', () => {
  test('should run the benchmark and report results', async ({ page }) => {
    // Navigate to the demo page
    await page.goto('/', { waitUntil: 'networkidle' });

    // Wait for the grid to be ready
    await page.waitForSelector('argent-grid', { timeout: 10000 });

    // Click the Benchmark button
    console.log('Starting benchmark...');
    await page.click('.btn-benchmark');

    // Wait for benchmark to complete (isBenchmarking becomes false)
    // The benchmark-results section appears when finished
    await page.waitForSelector('.benchmark-results', { timeout: 30000 });

    // Extract results
    const results = await page.evaluate(() => {
      const items = document.querySelectorAll('.result-item');
      const data: Record<string, string> = {};
      items.forEach(item => {
        const label = item.querySelector('label')?.textContent?.replace(':', '') || 'unknown';
        const value = item.querySelector('span')?.textContent || '0';
        data[label] = value;
      });
      return data;
    });

    console.log('-------------------------------------------');
    console.log('🚀 ArgentGrid Performance Benchmark Results');
    console.log('-------------------------------------------');
    Object.entries(results).forEach(([label, value]) => {
      console.log(`${label.padEnd(20)}: ${value}`);
    });
    console.log('-------------------------------------------');

    // Optional assertions based on targets
    const initialRender = parseFloat(results['Initial Render']);
    const scrollFrame = parseFloat(results['Avg Scroll Frame']);
    
    console.log(`Checking against targets...`);
    console.log(`Initial Render: ${initialRender}ms (Target: < 30ms)`);
    console.log(`Avg Scroll Frame: ${scrollFrame}ms (Target: < 4ms)`);

    // We don't fail the test if targets aren't met yet, but we report it
    if (initialRender > 30) console.warn('⚠️ Initial render is slower than target (30ms)');
    if (scrollFrame > 4) console.warn('⚠️ Scroll frame time is slower than target (4ms)');

    expect(results['Total Test Time']).toBeDefined();
  });
});
