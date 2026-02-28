# ArgentGrid Storybook - Status

## ⚠️ Current Status: ON HOLD

**Storybook 7.6.x is not compatible with Angular 18.**

### Issue

```
SB_FRAMEWORK_ANGULAR_0001 (AngularLegacyBuildOptionsError): 
Your Storybook startup script uses a solution that is not supported anymore.
You must use Angular builder to have an explicit configuration on the project used in angular.json.
```

**Root Cause:** Angular 18 uses the new `application` builder (`@angular-devkit/build-angular:application`), which Storybook 7.6.x doesn't support yet.

---

## 🔧 Workarounds

### Option 1: Use Demo App (RECOMMENDED)

The demo app serves as component documentation and testing:

```bash
cd demo-app
npm start
# Open http://localhost:4200
```

**Features:**
- ✅ Theme customization (Dark/Light mode)
- ✅ Live data demos (Stock ticker, log stream)
- ✅ Performance benchmarks
- ✅ All grid features

### Option 2: Wait for Storybook 8.x

Storybook 8.x will have full Angular 18 support. Expected release: Q2 2026.

Once released:

```bash
cd demo-app
npm install --save-dev @storybook/angular@latest @storybook/addon-essentials@latest
npx storybook upgrade
npm run storybook
```

### Option 3: Downgrade to Angular 17

If Storybook is critical right now:

```bash
# WARNING: This downgrades Angular!
npm install @angular/core@17 @angular/cli@17 @angular-devkit/build-angular@17
npm run storybook
```

---

## 📚 Alternative Documentation

Use the existing documentation instead:

- [THEME-API-GUIDE.md](../../docs/THEME-API-GUIDE.md) - Complete theme API guide
- [LIVE-DATA-OPTIMIZATIONS.md](../../docs/LIVE-DATA-OPTIMIZATIONS.md) - Live data guide
- [STORYBOOK-REFACTOR.md](../../docs/STORYBOOK-REFACTOR.md) - Storybook refactor plan

---

## 📦 Stories Created (Ready for Storybook 8.x)

Once Storybook 8.x is released, these stories are ready:

### Basic Stories
- `Basic/Default` - 100 rows, basic grid
- `Basic/LargeDataset` - 100K rows, performance demo

### Live Updates Stories
- `LiveUpdates/StockTicker` - 10 updates/sec
- `LiveUpdates/LogStream` - 100 logs/sec

### Theming Stories
- `Theming/LightTheme` - Default Quartz
- `Theming/DarkTheme` - Dark color scheme
- `Theming/CustomTheme` - Custom accent colors
- `Theming/MaterialIcons` - Material Design icons
- `Theming/CompactMode` - Dense data display

---

## 🧪 E2E Tests

**File:** `e2e/storybook.spec.ts`

**10 tests written** (will run once Storybook 8.x is available):
- ✅ Storybook homepage loads
- ✅ All 8 stories render correctly
- ✅ Large Dataset scrolls smoothly
- ✅ Stock Ticker updates in real-time
- ✅ Log Stream handles 100 logs/sec
- ✅ All theme stories apply correctly

---

## 🌐 GitHub Pages

**Workflow:** `.github/workflows/storybook.yml`

**Status:** ⏸️ Disabled until Storybook 8.x

**Once enabled:**
- Auto-deploys on push to `main`
- URL: https://hainanzhao.github.io/ArgentGrid/

---

## 📋 Checklist

- [x] Storybook 7.6.x installed
- [x] Stories created (8 total)
- [x] E2E tests written (10 tests)
- [x] Documentation complete
- [ ] ⏸️ Storybook 8.x Angular 18 support (WAITING)
- [ ] ⏸️ Enable GitHub Pages deployment (WAITING)

---

## 🔗 Resources

- [Storybook Angular Docs](https://storybook.js.org/docs/angular)
- [Storybook 8.0 Migration](https://github.com/storybookjs/storybook/blob/next/MIGRATION.md)
- [Angular 18 Release Notes](https://angular.dev/)
- [Issue Tracker](https://github.com/storybookjs/storybook/issues)

---

**Last Updated:** February 28, 2026  
**Status:** ⏸️ ON HOLD - Waiting for Storybook 8.x  
**Workaround:** Use demo app (`npm start`)
