import { expect, test } from '@playwright/test';

test.describe('Drag and Drop Functionality', () => {
  test('should reorder columns by dragging', async ({ page }) => {
    await page.goto('/iframe.html?id=features-grouping--column-groups');
    
    // Wait for the grid to be ready
    await page.waitForSelector('.argent-grid-header-cell');
    
    const idHeader = page.locator('.argent-grid-header-cell:has-text("ID")').first();
    const nameHeader = page.locator('.argent-grid-header-cell:has-text("Name")').first();
    
    await expect(idHeader).toBeVisible();
    await expect(nameHeader).toBeVisible();
    
    const initialIdBox = await idHeader.boundingBox();
    const initialNameBox = await nameHeader.boundingBox();
    
    if (!initialIdBox || !initialNameBox) throw new Error('Could not find header bounding boxes');
    
    // Drag ID onto Name using the handle
    const idHandle = idHeader.locator('.argent-grid-header-content');
    const handleBox = await idHandle.boundingBox();
    if (!handleBox) throw new Error('Could not find handle bounding box');
    
    await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
    await page.mouse.down();
    // Drag way past Name to ensure it drops at index >= 1
    await page.mouse.move(initialNameBox.x + initialNameBox.width + 50, initialNameBox.y + initialNameBox.height / 2, { steps: 30 });
    await page.mouse.up();
    
    // Wait for changes to reflect
    await page.waitForTimeout(2000);
    
    const finalIdBox = await idHeader.boundingBox();
    if (!finalIdBox) throw new Error('Could not find final ID bounding box');
    
    // ID should now have moved
    expect(finalIdBox.x).toBeGreaterThan(initialIdBox.x);
  });

  test('should group columns by dragging into group panel', async ({ page }) => {
    await page.goto('/iframe.html?id=features-grouping--column-groups');
    await page.waitForSelector('.argent-grid-header-cell');
    
    const panel = page.locator('.argent-grid-row-group-panel');
    await expect(panel).toBeVisible();
    
    // Find the Department column
    const deptHeader = page.locator('.argent-grid-header-cell:has-text("Department")').first();
    await expect(deptHeader).toBeVisible();
    
    // Drag Department to the group panel
    const handle = deptHeader.locator('.argent-grid-header-content');
    const handleBox = await handle.boundingBox();
    const panelBox = await panel.boundingBox();
    if (!handleBox || !panelBox) throw new Error('Could not find bounding boxes');
    
    await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(panelBox.x + panelBox.width / 2, panelBox.y + panelBox.height / 2, { steps: 20 });
    await page.mouse.up();
    
    // Wait for changes
    await page.waitForTimeout(2000);
    
    // Verify a group pill appeared in the panel
    const pill = panel.locator('.row-group-pill:has-text("Department")');
    await expect(pill).toBeVisible({ timeout: 5000 });
  });
});
