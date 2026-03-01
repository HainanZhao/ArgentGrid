import { test, expect } from '@playwright/test';

test('Take selection mode screenshot', async ({ page }) => {
  // Start demo app
  await page.goto('http://localhost:4200');
  
  // Wait for grid to load
  await page.waitForSelector('argent-grid', { timeout: 30000 });
  
  // Enable selection mode (click the selection toggle if available)
  // Or navigate to a story with selection enabled
  
  // Take screenshot
  await page.screenshot({ 
    path: 'e2e/screenshots/selection-mode.png',
    fullPage: true 
  });
  
  console.log('Screenshot saved to e2e/screenshots/selection-mode.png');
});
