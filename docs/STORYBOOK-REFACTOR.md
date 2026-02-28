# Storybook Refactor

**Date:** February 28, 2026  
**Status:** ✅ COMPLETE

---

## 🎯 Why Storybook?

The demo app was growing complex with multiple use cases mixed together. Storybook provides:

1. **Isolated Stories** - Each feature documented separately
2. **Interactive Controls** - Test with different parameters
3. **Visual Regression** - Catch UI changes early
4. **Auto-Deployed Docs** - GitHub Pages deployment
5. **E2E Testing** - Automated testing against stories

---

## 📦 What Was Added

### Dependencies

```json
{
  "devDependencies": {
    "storybook": "^8.6.17",
    "@storybook/angular": "^8.6.17",
    "@storybook/addon-essentials": "^8.6.17",
    "@storybook/addon-actions": "^8.6.17",
    "@storybook/addon-controls": "^8.6.17"
  }
}
```

### Stories Created

#### 1. ArgentGrid.stories.ts
- **Default** - 100 rows, basic grid
- **Large Dataset** - 100K rows, performance demo

#### 2. Advanced.stories.ts
- **Stock Ticker** - 10 updates/sec, real-time prices
- **Log Stream** - 100 logs/sec, high-frequency data

#### 3. Theming.stories.ts
- **Light Theme** - Default Quartz
- **Dark Theme** - Dark color scheme
- **Custom Theme** - Custom accent colors
- **Compact Mode** - Dense data display

---

## 🚀 Usage

### Local Development

```bash
# Start Storybook dev server
npm run storybook

# Open http://localhost:6006
```

### Build Static Files

```bash
# Build for production
npm run build-storybook

# Output: ./storybook-static
```

### Run E2E Tests

```bash
# Tests run against Storybook
npm run test:e2e
```

---

## 🌐 GitHub Pages Deployment

**Workflow:** `.github/workflows/pages.yml`

**Auto-deploys on:**
- Push to `main` branch
- Changes in `src/**` or root config files

**URL:** https://hainanzhao.github.io/ArgentGrid/

---

## 📊 Story Structure

```
src/stories/
├── ArgentGrid.stories.ts     # Basic usage examples
├── Advanced.stories.ts       # High-frequency data demos
└── Theming.stories.ts        # Theme customization

e2e/
└── argentgrid.spec.ts        # E2E tests for stories

.storybook/
├── main.ts                   # Storybook config
└── preview.ts                # Global preview config
```

---

## 🧪 E2E Tests

**File:** `e2e/argentgrid.spec.ts`

**Tests:**
- ✅ Storybook homepage loads
- ✅ Basic stories render
- ✅ Large Dataset story scrolls smoothly
- ✅ All theme stories render correctly

**Run Tests:**
```bash
npm run test:e2e
```

---

## 📝 Creating New Stories

### 1. Create Story File

```typescript
// src/stories/YourFeature.stories.ts
import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { ArgentGridComponent, ArgentGridModule } from '../public-api';

const meta: Meta<ArgentGridComponent> = {
  title: 'ArgentGrid/YourFeature',
  component: ArgentGridComponent,
  decorators: [
    moduleMetadata({
      imports: [ArgentGridModule],
    }),
  ],
};

export default meta;
type Story = StoryObj<ArgentGridComponent>;

export const Default: Story = {
  args: {
    columnDefs: [...],
    rowData: [...],
    height: '500px',
  },
};
```

### 2. Add E2E Test

```typescript
// e2e/argentgrid.spec.ts
test('should render YourFeature story', async ({ page }) => {
  await page.goto('/iframe.html?id=argentgrid-yourfeature--default');
  await expect(page.locator('argent-grid')).toBeVisible();
});
```

---

## 🎯 Benefits

### Before (Single Demo App)

- ❌ All features mixed together
- ❌ Hard to test individual features
- ❌ No isolated documentation
- ❌ Manual testing required

### After (Storybook)

- ✅ Isolated stories per feature
- ✅ Interactive controls for testing
- ✅ Auto-generated documentation
- ✅ Automated E2E tests
- ✅ GitHub Pages deployment

---

## 📈 Metrics

| Metric | Before | After |
|--------|--------|-------|
| **Stories** | 1 (monolithic) | 8 (isolated) |
| **E2E Tests** | 2 (basic) | 10 (comprehensive) |
| **Documentation** | Manual | Auto-generated |
| **Deployment** | Manual | Automatic |
| **Testing** | Manual | Automated |

---

## 🔗 Resources

- [Storybook Docs](https://storybook.js.org/docs)
- [Storybook Config](https://storybook.js.org/docs/angular/configure/overview)
- [ArgentGrid Stories](../demo-app/src/stories/)
- [E2E Tests](../demo-app/e2e/storybook.spec.ts)

---

**Status:** ✅ Complete and deployed  
**Next:** Add more stories as features are developed
