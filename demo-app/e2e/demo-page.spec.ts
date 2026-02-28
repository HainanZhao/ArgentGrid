import { test, expect } from '@playwright/test';

test.describe('ArgentGrid Demo', () => {
  test('should load the demo page without errors', async ({ page }) => {
    // Set up console error listener to catch Angular errors
    const errors: string[] = [];
    const consoleMessages: string[] = [];
    
    page.on('console', (msg) => {
      const text = msg.text();
      consoleMessages.push(text);
      if (msg.type() === 'error') {
        errors.push(text);
        console.log('Console error:', text);
      }
    });

    page.on('pageerror', (error) => {
      errors.push(error.message);
      console.log('Page error:', error.message);
    });

    // Navigate to the demo page
    await page.goto('/', { waitUntil: 'networkidle', timeout: 30000 });

    // Take a screenshot for debugging
    await page.screenshot({ path: 'e2e/screenshots/page-load.png' });

    // Get page content for debugging
    const content = await page.content();
    console.log('Page content length:', content.length);

    // Check for Angular errors in console
    const ngErrors = errors.filter((err) => err.includes('NG0') || err.includes('ERROR'));
    
    if (ngErrors.length > 0) {
      console.error('Angular errors detected:', ngErrors);
    }

    // Wait for the page to load - check for app-root
    await page.waitForSelector('app-root', { timeout: 10000 });
    
    // Wait for demo container
    await page.waitForSelector('.demo-container', { timeout: 10000 });

    // Assert no critical Angular injection errors
    const criticalErrors = ngErrors.filter(err => 
      err.includes('NG0203') || err.includes('NG0201') || err.includes('NullInjectorError')
    );
    
    expect(criticalErrors).toHaveLength(0);

    // Check that the grid container is visible (use first to avoid strict mode violation)
    const gridContainer = page.locator('.argent-grid-container').first();
    await expect(gridContainer).toBeVisible({ timeout: 10000 });

    // Check that rows are loaded
    await expect(page.locator('.stat-badge').first()).toBeVisible();
  });

  test('should load 100K rows successfully', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    // Wait for initial load
    await page.waitForSelector('argent-grid', { timeout: 10000 });

    // Click the 100K button
    await page.click('button:has-text("100K")');

    // Wait for loading to complete
    await page.waitForSelector('.loading', { state: 'detached', timeout: 30000 });

    // Verify row count updated
    const stats = await page.locator('.stat-badge').first().textContent();
    expect(stats).toContain('100,000');
  });
});
