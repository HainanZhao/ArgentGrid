const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('http://localhost:4201');
  
  // wait for grid
  await page.waitForSelector('.argent-grid-container');
  
  // hover over first header
  await page.hover('.argent-grid-header-cell:nth-child(2)');
  
  // click menu icon
  await page.click('.argent-grid-header-cell:nth-child(2) .argent-grid-header-menu-icon');
  
  // screenshot
  await page.screenshot({ path: 'demo-app/e2e/screenshots/menu-open.png' });
  await browser.close();
})();
