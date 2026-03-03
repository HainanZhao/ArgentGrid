import { expect, test } from '@playwright/test';

test.describe('Debug Streaming Story', () => {
  test('check console errors and logs', async ({ page }) => {
    const browserErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') browserErrors.push(msg.text());
    });

    await page.goto('http://localhost:6006/iframe.html?id=features-streaming--live-stock-feed&viewMode=story');

    await page.waitForSelector('argent-grid', { timeout: 10000 });

    // Wait a bit for updates
    await page.waitForTimeout(5000);

    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible();

    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    expect((box?.width ?? 0) > 0).toBe(true);
    expect((box?.height ?? 0) > 0).toBe(true);

    const criticalErrors = browserErrors.filter(
      (e) => e.includes('NG0203') || e.includes('NG0201') || e.includes('NullInjectorError')
    );
    expect(criticalErrors).toHaveLength(0);
  });
});
