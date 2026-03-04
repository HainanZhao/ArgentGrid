import { expect, test } from '@playwright/test';

test.describe('ArgentGrid Pagination', () => {
  // Increase timeout for visual tests
  test.slow();

  test.beforeEach(async ({ page }) => {
    await page.goto('/iframe.html?id=components-argentgrid--with-pagination');
    await page.waitForSelector('argent-grid', { state: 'visible', timeout: 15000 });
    // Wait for rendering to stabilize
    await page.waitForTimeout(1000);
  });

  test('should display correct initial pagination info and look correct', async ({ page }) => {
    const info = page.locator('.pagination-rows');
    await expect(info).toContainText('1 - 20 of 100');
    
    const pageInfo = page.locator('.pagination-page');
    await expect(pageInfo).toContainText('Page 1 of 5');

    await expect(page.locator('argent-grid')).toHaveScreenshot('grid-pagination-page-1.png');
  });

  test('should navigate to next and previous pages and update data', async ({ page }) => {
    // Next page
    await page.click('button[title="Next Page"]');
    await expect(page.locator('.pagination-rows')).toContainText('21 - 40 of 100');
    await expect(page.locator('.pagination-page')).toContainText('Page 2 of 5');
    
    await page.waitForTimeout(500); // Wait for canvas redraw
    await expect(page.locator('argent-grid')).toHaveScreenshot('grid-pagination-page-2.png');

    // Previous page
    await page.click('button[title="Previous Page"]');
    await expect(page.locator('.pagination-rows')).toContainText('1 - 20 of 100');
    await expect(page.locator('.pagination-page')).toContainText('Page 1 of 5');
  });

  test('should navigate to first and last pages and update data', async ({ page }) => {
    // Last page
    await page.click('button[title="Last Page"]');
    await expect(page.locator('.pagination-rows')).toContainText('81 - 100 of 100');
    await expect(page.locator('.pagination-page')).toContainText('Page 5 of 5');
    
    await page.waitForTimeout(500); // Wait for canvas redraw
    await expect(page.locator('argent-grid')).toHaveScreenshot('grid-pagination-page-last.png');

    // First page
    await page.click('button[title="First Page"]');
    await expect(page.locator('.pagination-rows')).toContainText('1 - 20 of 100');
    await expect(page.locator('.pagination-page')).toContainText('Page 1 of 5');
  });

  test('should disable buttons on first and last pages', async ({ page }) => {
    const firstBtn = page.locator('button[title="First Page"]');
    const prevBtn = page.locator('button[title="Previous Page"]');
    const nextBtn = page.locator('button[title="Next Page"]');
    const lastBtn = page.locator('button[title="Last Page"]');

    // Initial state (Page 1)
    await expect(firstBtn).toBeDisabled();
    await expect(prevBtn).toBeDisabled();
    await expect(nextBtn).toBeEnabled();
    await expect(lastBtn).toBeEnabled();

    // Go to last page
    await page.click('button[title="Last Page"]');
    await expect(firstBtn).toBeEnabled();
    await expect(prevBtn).toBeEnabled();
    await expect(nextBtn).toBeDisabled();
    await expect(lastBtn).toBeDisabled();
  });
});
