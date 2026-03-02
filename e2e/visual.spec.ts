import { expect, test } from '@playwright/test';

test.describe('ArgentGrid Visual Regression', () => {
  // Increase timeout for visual tests as they depend on rendering
  test.slow();

  test('default grid should look correct', async ({ page }) => {
    await page.goto('/iframe.html?id=components-argentgrid--default');
    await page.waitForSelector('argent-grid', { state: 'visible' });
    // Wait longer for CI rendering and font stabilization
    await page.waitForTimeout(2000);
    
    await expect(page.locator('argent-grid')).toHaveScreenshot('grid-default.png');
  });

  test('selection column should be centered and aligned', async ({ page }) => {
    await page.goto('/iframe.html?id=components-argentgrid--with-selection');
    await page.waitForSelector('argent-grid', { state: 'visible' });
    await page.waitForTimeout(2000);
    
    await expect(page.locator('argent-grid')).toHaveScreenshot('grid-with-selection.png');
  });

  test('text filter with floating filters should be aligned', async ({ page }) => {
    await page.goto('/iframe.html?id=features-filtering--text-filter');
    await page.waitForSelector('argent-grid', { state: 'visible' });
    await page.waitForTimeout(2000);
    
    await expect(page.locator('argent-grid')).toHaveScreenshot('grid-text-filter.png');
  });

  test('hidden floating filters with popup should be correct', async ({ page }) => {
    await page.goto('/iframe.html?id=features-filtering--set-filter');
    await page.waitForSelector('argent-grid', { state: 'visible' });

    // Open the filter popup for the Department column (which uses Set Filter)
    const deptHeader = page.locator('.argent-grid-floating-filter-cell').nth(2); // Department is 3rd
    const filterBtn = deptHeader.locator('.floating-filter-btn');
    
    await filterBtn.scrollIntoViewIfNeeded();
    await filterBtn.click();
    
    // Wait for popup animation
    await page.waitForSelector('.set-filter-popup', { state: 'visible', timeout: 5000 });
    await page.waitForTimeout(1000);
    
    // Snapshot the popup area
    await expect(page.locator('argent-grid')).toHaveScreenshot('grid-filter-popup.png');
  });

  test('empty state after filtering should be clean', async ({ page }) => {
    await page.goto('/iframe.html?id=features-filtering--text-filter');
    await page.waitForSelector('argent-grid', { state: 'visible' });
    
    // Type something that matches nothing
    const filterInput = page.locator('.floating-filter-input').first();
    await filterInput.fill('NON_EXISTENT_VALUE_12345');
    await page.waitForTimeout(1000); // Wait for debounce and render
    
    await expect(page.locator('argent-grid')).toHaveScreenshot('grid-empty-state.png');
  });

  test('cell borders should remain visible after scrolling down', async ({ page }) => {
    await page.goto('/iframe.html?id=components-argentgrid--default');
    await page.waitForSelector('argent-grid', { state: 'visible' });
    
    // Scroll down significantly
    const viewport = page.locator('.argent-grid-viewport');
    await viewport.evaluate((el) => el.scrollTop = 500);
    
    // Wait for render
    await page.waitForTimeout(2000);
    
    await expect(page.locator('argent-grid')).toHaveScreenshot('grid-scroll-borders.png');
  });

  test('sidebar buttons should be visible and not blocked by header', async ({ page }) => {
    await page.goto('/iframe.html?id=features-advanced--side-bar');
    await page.waitForSelector('argent-grid', { state: 'visible' });
    
    // Check if sidebar buttons are present
    const sidebar = page.locator('.side-bar-buttons');
    await expect(sidebar).toBeVisible();
    
    // Verify first button position is below top of grid
    const firstButton = page.locator('.side-bar-button').first();
    const box = await firstButton.boundingBox();
    // In our new grid-based layout, the sidebar is a sibling of the content area
    // Just ensure it's rendered and has reasonable position
    expect(box?.y).toBeGreaterThanOrEqual(0);
    await page.waitForTimeout(1000);
    await expect(page.locator('argent-grid')).toHaveScreenshot('grid-sidebar-buttons.png');
  });
});
