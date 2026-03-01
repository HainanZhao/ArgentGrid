import { test, expect } from '@playwright/test';

test('take argent-grid with selection screenshot', async ({ page }) => {
  await page.goto('/iframe.html?id=components-argentgrid--with-selection');
  
  // Wait for the grid to render
  await page.waitForSelector('argent-grid', { timeout: 15000 });
  await page.waitForTimeout(2000);

  // Take screenshot
  await page.screenshot({
    path: 'e2e/screenshots/argent-grid-with-selection.png',
    fullPage: false,
  });
  
  console.log('Screenshot saved to e2e/screenshots/argent-grid-with-selection.png');
});
