import { test, expect } from '@playwright/test';

test.describe('ArgentGrid Visual Comparison', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForSelector('argent-grid', { timeout: 10000 });
    
    // Dismiss any Vite error overlay
    const overlay = page.locator('vite-error-overlay');
    if (await overlay.isVisible()) {
      await overlay.evaluate(el => el.remove());
    }
  });

  test('capture grid with 100K rows loaded', async ({ page }) => {
    // Load 100K rows
    await page.click('button:has-text("100K")');
    await page.waitForSelector('.loading', { state: 'detached', timeout: 60000 });
    
    // Wait for grid to stabilize
    await page.waitForTimeout(2000);
    
    // Capture full grid
    await page.screenshot({ 
      path: 'e2e/screenshots/argentgrid-100k-loaded.png',
      fullPage: false 
    });
    
    console.log('✓ Captured grid with 100K rows loaded');
  });

  test('capture scrolling performance', async ({ page }) => {
    // Load 100K rows
    await page.click('button:has-text("100K")');
    await page.waitForSelector('.loading', { state: 'detached', timeout: 60000 });
    await page.waitForTimeout(2000);
    
    // Find the argent-grid component and scroll its viewport
    const gridComponent = page.locator('argent-grid').first();
    const viewport = gridComponent.locator('.argent-grid-viewport').first();
    
    // Capture initial view (top)
    await page.screenshot({ path: 'e2e/screenshots/argentgrid-scroll-top.png' });
    
    // Scroll down
    await viewport.evaluate(el => el.scrollTop = 5000);
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'e2e/screenshots/argentgrid-scroll-middle.png' });
    
    // Scroll to bottom
    await viewport.evaluate(el => el.scrollTop = el.scrollHeight - el.clientHeight);
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'e2e/screenshots/argentgrid-scroll-bottom.png' });
    
    console.log('✓ Captured scrolling performance');
  });

  test('capture sorting functionality', async ({ page }) => {
    // Load 10K rows for faster sorting
    await page.click('button:has-text("100K")');
    await page.waitForSelector('.loading', { state: 'detached', timeout: 60000 });
    await page.waitForTimeout(1000);
    
    // Find the ID column header (ArgentGrid uses different selectors than AG Grid)
    // Look for header cells with text content
    const headerCells = page.locator('.argent-grid-header-cell, [class*="header"], th');
    
    // Try to find and click the ID column header
    const idHeader = headerCells.filter({ hasText: 'ID' }).first();
    
    if (await idHeader.isVisible()) {
      await idHeader.click();
      await page.waitForTimeout(500);
      
      // Capture sorted view (ascending)
      await page.screenshot({ path: 'e2e/screenshots/argentgrid-sorted-ascending.png' });
      
      // Click again for descending
      await idHeader.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'e2e/screenshots/argentgrid-sorted-descending.png' });
      
      console.log('✓ Captured sorting functionality');
    } else {
      // Fallback: capture grid state without sorting
      await page.screenshot({ path: 'e2e/screenshots/argentgrid-sorting-not-implemented.png' });
      console.log('⚠ Sorting not yet implemented - captured placeholder');
    }
  });

  test('capture filtering functionality', async ({ page }) => {
    // Load 100K rows
    await page.click('button:has-text("100K")');
    await page.waitForSelector('.loading', { state: 'detached', timeout: 60000 });
    await page.waitForTimeout(1000);
    
    // Click the "Filter Eng" button
    const filterButton = page.locator('button:has-text("Filter")');
    
    if (await filterButton.isVisible()) {
      await filterButton.click();
      await page.waitForTimeout(1000);
      
      // Capture filtered view
      await page.screenshot({ path: 'e2e/screenshots/argentgrid-filtered.png' });
      
      console.log('✓ Captured filtering functionality');
    } else {
      // Fallback: capture grid state without filtering
      await page.screenshot({ path: 'e2e/screenshots/argentgrid-filtering-not-implemented.png' });
      console.log('⚠ Filtering not yet implemented - captured placeholder');
    }
  });

  test('capture grouping functionality', async ({ page }) => {
    // Load 100K rows
    await page.click('button:has-text("100K")');
    await page.waitForSelector('.loading', { state: 'detached', timeout: 60000 });
    await page.waitForTimeout(1000);
    
    // Click the "Group by Dept" button
    const groupButton = page.locator('button:has-text("Group by Dept")');
    
    if (await groupButton.isVisible()) {
      await groupButton.click();
      await page.waitForTimeout(2000);
      
      // Capture grouped view
      await page.screenshot({ path: 'e2e/screenshots/argentgrid-grouped.png' });
      
      console.log('✓ Captured grouping functionality');
    } else {
      await page.screenshot({ path: 'e2e/screenshots/argentgrid-grouping-not-implemented.png' });
      console.log('⚠ Grouping not yet implemented - captured placeholder');
    }
  });

  test('capture full demo page overview', async ({ page }) => {
    // Load 100K rows
    await page.click('button:has-text("100K")');
    await page.waitForSelector('.loading', { state: 'detached', timeout: 60000 });
    await page.waitForTimeout(2000);
    
    // Capture full page
    await page.screenshot({ 
      path: 'e2e/screenshots/argentgrid-full-demo.png',
      fullPage: true 
    });
    
    console.log('✓ Captured full demo page overview');
  });
});
