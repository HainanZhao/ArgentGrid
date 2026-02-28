import { test, expect, Page } from '@playwright/test';

// Skip these tests until features are implemented
test.describe.skip('ArgentGrid Feature Guard Rails', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    // Wait for grid to be ready
    await page.waitForSelector('argent-grid', { timeout: 10000 });
    // Wait for data to load
    await page.waitForSelector('.loading', { state: 'detached', timeout: 30000 });
  });

  test('should support row grouping and expansion', async ({ page }) => {
    // 1. Toggle Grouping
    await page.click('button:has-text("Group by Dept")');
    
    // 2. Verify "Organization" column (Auto Group Column) appears
    const groupHeader = page.locator('.argent-grid-header-cell').filter({ hasText: /^Organization/ });
    await expect(groupHeader).toBeVisible();

    // 3. Verify original "Department" column is hidden
    const deptHeader = page.locator('.argent-grid-header-cell').filter({ hasText: /^Department/ });
    await expect(deptHeader).not.toBeVisible();

    // 4. Verify row count via GridApi (initially grouped)
    const rowCountBefore = await page.evaluate(() => window.gridApi.getDisplayedRowCount());
    expect(rowCountBefore).toBeLessThan(20);

    // 5. Expand first group (click near chevron)
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas box not found');

    // Click at x=20, y=16 (roughly the first group's chevron)
    await page.mouse.click(box.x + 20, box.y + 16);
    
    // 6. Verify row count increased
    await page.waitForTimeout(1000); // Wait for processing
    const rowCountAfter = await page.evaluate(() => window.gridApi.getDisplayedRowCount());
    expect(rowCountAfter).toBeGreaterThan(rowCountBefore);
  });

  test('should support floating filters', async ({ page }) => {
    // 1. Verify floating filter row is visible
    const filterRow = page.locator('.floating-filter-row');
    await expect(filterRow).toBeVisible();

    // 2. Type "Sales" into the Department filter (3rd input)
    const deptFilter = page.locator('.floating-filter-input').nth(2);
    await deptFilter.fill('Sales');
    
    // 3. Wait for debounce and verify filtered count
    await page.waitForTimeout(1500);
    const filteredCount = await page.evaluate(() => window.gridApi.getDisplayedRowCount());
    
    expect(filteredCount).toBeGreaterThan(0);
    expect(filteredCount).toBeLessThan(100000);

    // 4. Verify Clear button (x) works
    const clearBtn = page.locator('.floating-filter-clear').first();
    await expect(clearBtn).toBeVisible();
    await clearBtn.click();

    // 5. Verify count restored
    await page.waitForTimeout(1000);
    const restoredCount = await page.evaluate(() => window.gridApi.getDisplayedRowCount());
    expect(restoredCount).toBe(100000);
  });

  test('should support cell editing with keyboard navigation', async ({ page }) => {
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas box not found');

    // 1. Double click to start editing (Name column, first row)
    // Click on Name column (x=150 is roughly middle of Name column)
    await canvas.dblclick({ position: { x: 150, y: 16 } });
    
    const editor = page.locator('.argent-grid-editor-input');
    await expect(editor).toBeVisible();

    // 2. Type new value and Enter to save
    await editor.fill('TEST_EDIT_SUCCESS');
    await page.keyboard.press('Enter');

    // 3. Verify editor is gone and value persisted
    await expect(editor).not.toBeVisible();
    const savedValue = await page.evaluate(() => window.gridApi.getDisplayedRowAtIndex(0).data.name);
    expect(savedValue).toBe('TEST_EDIT_SUCCESS');

    // 4. Test Escape to cancel
    await canvas.dblclick({ position: { x: 150, y: 16 } });
    await expect(editor).toBeVisible();
    await editor.fill('WILL_CANCEL');
    await page.keyboard.press('Escape');
    
    await expect(editor).not.toBeVisible();
    const afterCancelValue = await page.evaluate(() => window.gridApi.getDisplayedRowAtIndex(0).data.name);
    expect(afterCancelValue).toBe('TEST_EDIT_SUCCESS');
  });

  test('should support column pinning and horizontal scroll sync', async ({ page }) => {
    // Force horizontal scroll by reducing viewport
    await page.setViewportSize({ width: 800, height: 600 });

    // 1. Pin ID column to Left via Menu
    const idHeader = page.locator('.argent-grid-header-cell').filter({ hasText: /^ID/ });
    await idHeader.hover();
    const menuIcon = idHeader.locator('.argent-grid-header-menu-icon');
    await menuIcon.waitFor({ state: 'visible' });
    await menuIcon.click();

    // Click Pin Left
    await page.locator('.menu-item').filter({ hasText: 'Pin Left' }).click();

    // 2. Verify internal state via GridApi
    await page.waitForFunction(() => {
      const api = (window as any).gridApi;
      const col = api.getAllColumns().find(c => c.colId === 'id');
      return col && col.pinned === 'left';
    }, { timeout: 5000 });

    // 3. Scroll grid horizontally
    const viewport = page.locator('.argent-grid-viewport');
    await viewport.evaluate(el => el.scrollLeft = 200);
    
    // 4. Verify header scroll sync
    await page.waitForTimeout(1000);
    const headerScrollable = page.locator('.argent-grid-header-scrollable').first();
    const headerScrollLeft = await headerScrollable.evaluate(el => el.scrollLeft);
    expect(headerScrollLeft).toBe(200);

    // 5. Verify pinned column remains at the left
    const idHeaderBox = await idHeader.boundingBox();
    const containerBox = await page.locator('.argent-grid-container').boundingBox();
    // Allow 2px margin for borders
    expect(Math.abs((idHeaderBox?.x || 0) - (containerBox?.x || 0))).toBeLessThanOrEqual(2);
  });

  test('should support column re-ordering via drag and drop', async ({ page }) => {
    const idHeader = page.locator('.argent-grid-header-cell').filter({ hasText: /^ID/ });
    const nameHeader = page.locator('.argent-grid-header-cell').filter({ hasText: /^Name/ });
    
    const idBoxBefore = await idHeader.boundingBox();
    const nameBoxBefore = await nameHeader.boundingBox();
    
    expect(idBoxBefore!.x).toBeLessThan(nameBoxBefore!.x);

    // Drag Name to before ID
    await nameHeader.hover();
    await page.mouse.down();
    await page.mouse.move(idBoxBefore!.x + 10, idBoxBefore!.y + 10, { steps: 10 });
    await page.mouse.up();

    // Verify order swapped
    await page.waitForTimeout(1000);
    const idBoxAfter = await idHeader.boundingBox();
    const nameBoxAfter = await nameHeader.boundingBox();
    
    expect(nameBoxAfter!.x).toBeLessThan(idBoxAfter!.x);
  });

  test('should support programmatic filter synchronization and UI reactivity', async ({ page }) => {
    // 1. Apply filter via "Filter Engineering" button (calls gridApi.setFilterModel)
    await page.click('button:has-text("Filter \'Engineering\'")');
    
    // 2. Verify row count via GridApi dropped (reactivity check)
    await page.waitForTimeout(1000);
    const filteredCount = await page.evaluate(() => window.gridApi.getDisplayedRowCount());
    expect(filteredCount).toBeLessThan(100000);
    expect(filteredCount).toBeGreaterThan(0);

    // 3. Verify the floating filter input shows "Eng" (bidirectional sync check)
    const deptFilter = page.locator('.floating-filter-input').nth(2);
    const filterValue = await deptFilter.inputValue();
    expect(filterValue).toBe('Eng');

    // 4. Clear via "Clear Filters" button
    await page.click('button:has-text("Clear Filters")');
    await page.waitForTimeout(500);
    
    // 5. Verify input cleared and count restored
    const clearedValue = await deptFilter.inputValue();
    expect(clearedValue).toBe('');
    const finalCount = await page.evaluate(() => window.gridApi.getDisplayedRowCount());
    expect(finalCount).toBe(100000);
  });

  test('should support global options toggle via setGridOption', async ({ page }) => {
    // 1. Hide Filters via button (calls gridApi.setGridOption)
    await page.click('button:has-text("Hide Filters")');
    
    // 2. Verify floating filter row is removed from DOM
    const filterRow = page.locator('.floating-filter-row');
    await expect(filterRow).not.toBeVisible();

    // 3. Show Filters back
    await page.click('button:has-text("Show Filters")');
    
    // 4. Verify floating filter row returned
    await expect(filterRow).toBeVisible();
  });

  test('should support column resizing by dragging the handle', async ({ page }) => {
    const idHeader = page.locator('.argent-grid-header-cell').filter({ hasText: /^ID/ });
    const idBoxBefore = await idHeader.boundingBox();
    if (!idBoxBefore) throw new Error('ID header box not found');

    const initialWidth = idBoxBefore.width;

    // Locate resize handle
    const resizeHandle = idHeader.locator('.argent-grid-header-resize-handle');
    await expect(resizeHandle).toBeVisible();

    // Drag to resize
    await resizeHandle.hover();
    await page.mouse.down();
    await page.mouse.move(idBoxBefore.x + idBoxBefore.width + 100, idBoxBefore.y + 10, { steps: 10 });
    await page.mouse.up();

    // Verify width increased
    await page.waitForTimeout(500);
    const idBoxAfter = await idHeader.boundingBox();
    expect(idBoxAfter!.width).toBeGreaterThan(initialWidth);
    // Should be roughly initialWidth + 100 (allow 10px margin)
    expect(Math.abs(idBoxAfter!.width - (initialWidth + 100))).toBeLessThanOrEqual(10);
  });

  test('should support Excel-like range selection by dragging', async ({ page }) => {
    const canvas = page.locator('canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas box not found');

    // 1. Start drag at cell (row 1, col 'name')
    // Name column starts at x=80 (if selection col hidden) or x=112 (if selection col shown)
    // selectionColumnWidth is 32. 
    // ID column is 80.
    // Name column starts around x = 32 + 80 = 112.
    const startX = 150;
    const startY = 16; // Middle of first row (32px high)

    await page.mouse.move(box.x + startX, box.y + startY);
    await page.mouse.down();

    // 2. Drag to cell (row 3, col 'department')
    // Row 3 is at y = 32 * 2 + 16 = 80.
    // Dept column is 180 wide.
    const endX = 350;
    const endY = 80;

    await page.mouse.move(box.x + endX, box.y + endY, { steps: 10 });
    await page.mouse.up();

    // 3. Verify range selection via API
    const ranges = await page.evaluate(() => window.gridApi.getCellRanges());
    expect(ranges).toBeTruthy();
    expect(ranges.length).toBe(1);
    
    const range = ranges[0];
    expect(range.startRow).toBe(0);
    expect(range.endRow).toBe(2); // row 1 to 3
    expect(range.columns.length).toBeGreaterThan(1);
  });
});

declare global {
  interface Window {
    gridApi: any;
  }
}
