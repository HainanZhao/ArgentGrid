import { expect, test } from '@playwright/test';

test.describe('Debug Streaming Story', () => {
  test('check console errors and logs', async ({ page }) => {
    page.on('console', (msg) => {
      console.log(`[BROWSER ${msg.type()}] ${msg.text()}`);
    });

    await page.goto('http://localhost:6006/iframe.html?id=features-streaming--live-stock-feed&viewMode=story');
    
    // Wait for grid
    try {
      await page.waitForSelector('argent-grid', { timeout: 10000 });
      console.log('argent-grid selector found');
    } catch (e) {
      console.log('argent-grid selector NOT found within timeout');
    }

    // Wait a bit for updates
    await page.waitForTimeout(5000);
    
    const canvas = page.locator('canvas').first();
    const isVisible = await canvas.isVisible();
    console.log('Canvas is visible:', isVisible);
    
    if (isVisible) {
      const box = await canvas.boundingBox();
      console.log('Canvas bounding box:', box);
    }
  });
});
