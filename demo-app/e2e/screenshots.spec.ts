import { test, expect } from '@playwright/test';

test.describe('ArgentGrid Screenshots', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForSelector('argent-grid', { timeout: 10000 });
    
    // Dismiss any Vite error overlay
    const overlay = page.locator('vite-error-overlay');
    if (await overlay.isVisible()) {
      await overlay.evaluate(el => el.remove());
    }
  });

  test('capture grid with 100K rows', async ({ page }) => {
    // Dismiss overlay again if it reappeared
    const overlay = page.locator('vite-error-overlay');
    if (await overlay.isVisible()) {
      await overlay.evaluate(el => el.remove());
    }
    
    // Load 100K rows
    await page.click('button:has-text("100K")');
    await page.waitForSelector('.loading', { state: 'detached', timeout: 60000 });
    
    // Wait for grid to stabilize
    await page.waitForTimeout(2000);
    
    // Capture full grid
    await page.screenshot({ 
      path: 'e2e/screenshots/grid-100k-rows.png',
      fullPage: false 
    });
    
    console.log('✓ Captured grid with 100K rows');
  });

  test('capture scrolling behavior', async ({ page }) => {
    // Dismiss overlay
    const overlay = page.locator('vite-error-overlay');
    if (await overlay.isVisible()) {
      await overlay.evaluate(el => el.remove());
    }
    
    // Load 100K rows
    await page.click('button:has-text("100K")');
    await page.waitForSelector('.loading', { state: 'detached', timeout: 60000 });
    await page.waitForTimeout(2000);
    
    // Use the first grid container in the grid-wrapper
    const gridContainer = page.locator('.grid-wrapper .argent-grid-container').first();
    
    // Capture initial view
    await page.screenshot({ path: 'e2e/screenshots/scroll-top.png' });
    
    // Scroll down
    await gridContainer.evaluate(el => el.scrollTop = 5000);
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'e2e/screenshots/scroll-middle.png' });
    
    // Scroll to bottom
    await gridContainer.evaluate(el => el.scrollTop = el.scrollHeight - el.clientHeight);
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'e2e/screenshots/scroll-bottom.png' });
    
    console.log('✓ Captured scrolling behavior');
  });

  test('capture sorting', async ({ page }) => {
    // Dismiss overlay
    const overlay = page.locator('vite-error-overlay');
    if (await overlay.isVisible()) {
      await overlay.evaluate(el => el.remove());
    }
    
    // Load 10K rows for faster sorting
    await page.click('button:has-text("100K")');
    await page.waitForSelector('.loading', { state: 'detached', timeout: 60000 });
    await page.waitForTimeout(1000);
    
    // Find and click the ID column header to sort
    const columnHeader = page.locator('.ag-header-cell-text:has-text("ID")').first();
    await columnHeader.click();
    await page.waitForTimeout(500);
    
    // Capture sorted view
    await page.screenshot({ path: 'e2e/screenshots/sorted-ascending.png' });
    
    // Click again for descending
    await columnHeader.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'e2e/screenshots/sorted-descending.png' });
    
    console.log('✓ Captured sorting behavior');
  });
});
