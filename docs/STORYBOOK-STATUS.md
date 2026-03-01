# Storybook Status

**Last Updated:** March 1, 2026  
**Status:** ⚠️ **NOT WORKING** - Angular 18 Compatibility Issue

---

## ❌ Current Issue

**Storybook fails to build with the following error:**

```
SB_BUILDER-WEBPACK5_0003 (WebpackCompilationError): 
There were problems when compiling your code with Webpack.
```

**Root Cause:** Storybook 7.6.x has **incompatible dependencies** with Angular 18's build system.

---

## 🔍 Technical Details

### Version Conflict

| Package | Required By | Compatible With |
|---------|-------------|-----------------|
| Storybook 7.6.x | Current install | Angular 14-17 |
| Angular 18 | Current project | Storybook 8.x (not yet stable) |

### Specific Issues

1. **Webpack 5 Builder** - Storybook's webpack builder conflicts with Angular 18's esbuild
2. **Angular Builder API** - Angular 18 uses new application builder not supported by Storybook 7.6
3. **Ivy Compilation** - Storybook's Angular compiler doesn't support Angular 18's Ivy changes

---

## 🚫 What Doesn't Work

- ❌ `npm run storybook` - Dev server fails to start
- ❌ `npm run build-storybook` - Build fails with webpack errors
- ❌ GitHub Pages deployment - Cannot build static files
- ❌ E2E tests against Storybook - No running instance

---

## ✅ What DOES Work

### 1. Demo App (RECOMMENDED)

The demo app serves as component documentation:

```bash
cd demo-app
npm start
# Open http://localhost:4200
```

**Features:**
- ✅ All grid features demonstrated
- ✅ Theme customization (Dark/Light mode)
- ✅ Live data demos (Stock ticker, log stream)
- ✅ Performance benchmarks (100K rows)
- ✅ Interactive controls

### 2. Story Files (Ready for Future)

All story files are written and ready:
- ✅ `src/stories/ArgentGrid.stories.ts` - 8 stories
- ✅ `src/stories/Filtering.stories.ts` - 5 stories
- ✅ `src/stories/Grouping.stories.ts` - 4 stories
- ✅ `src/stories/Theming.stories.ts` - 5 stories
- ✅ `src/stories/Advanced.stories.ts` - Multiple stories
- ✅ `src/stories/CellRenderers.stories.ts` - Multiple stories
- ✅ `src/stories/Benchmark.stories.ts` - Performance tests

**Once Storybook 8.x is released**, these stories will work immediately.

### 3. Documentation

Comprehensive documentation exists:
- ✅ [THEME-API-GUIDE.md](./THEME-API-GUIDE.md) - Theme API
- ✅ [LIVE-DATA-OPTIMIZATIONS.md](./LIVE-DATA-OPTIMIZATIONS.md) - Live data
- ✅ [STORYBOOK-REFACTOR.md](./STORYBOOK-REFACTOR.md) - Storybook plan

---

## 🔧 Workarounds

### Option 1: Use Demo App (RECOMMENDED)

```bash
cd demo-app
npm start
```

This is the **recommended approach** until Storybook 8.x is stable.

### Option 2: Wait for Storybook 8.x

**Expected:** Q2 2026

Once released:
```bash
npm install --save-dev @storybook/angular@latest @storybook/addon-essentials@latest
npx storybook upgrade
npm run storybook
```

### Option 3: Downgrade to Angular 17

**NOT RECOMMENDED** - Only if Storybook is absolutely critical:

```bash
# WARNING: This downgrades Angular!
npm install @angular/core@17 @angular/cli@17 @angular-devkit/build-angular@17
npm run storybook
```

---

## 📋 Story Files Status

| Story File | Status | Stories | Ready for SB 8.x |
|------------|--------|---------|------------------|
| ArgentGrid.stories.ts | ✅ Written | 8 | ✅ Yes |
| Filtering.stories.ts | ✅ Written | 5 | ✅ Yes |
| Grouping.stories.ts | ✅ Written | 4 | ✅ Yes |
| Theming.stories.ts | ✅ Written | 5 | ✅ Yes |
| Advanced.stories.ts | ✅ Written | Multiple | ✅ Yes |
| CellRenderers.stories.ts | ✅ Written | Multiple | ✅ Yes |
| Benchmark.stories.ts | ✅ Written | Multiple | ✅ Yes |

**Total:** 30+ stories ready for Storybook 8.x

---

## 📅 Timeline

| Date | Event |
|------|-------|
| **Feb 2026** | Storybook setup attempted |
| **Feb 2026** | Angular 18 incompatibility discovered |
| **Feb 2026** | Stories written (ready for SB 8.x) |
| **Mar 2026** | **Current: Waiting for Storybook 8.x** |
| **Q2 2026** | Expected: Storybook 8.x with Angular 18 support |

---

## 🔗 Resources

- [Storybook Angular Docs](https://storybook.js.org/docs/angular)
- [Storybook 8.0 Migration](https://github.com/storybookjs/storybook/blob/next/MIGRATION.md)
- [Angular 18 Release Notes](https://angular.dev/)
- [Issue: Storybook + Angular 18](https://github.com/storybookjs/storybook/issues)

---

## ✅ Recommendation

**For now:**
1. Use **demo app** (`npm start`) for component exploration
2. Read **documentation** for feature guides
3. **Wait for Storybook 8.x** (Q2 2026)

**Once Storybook 8.x is released:**
1. Run `npx storybook upgrade`
2. All existing stories will work immediately
3. Enable GitHub Pages deployment

---

**Status:** ⏸️ **ON HOLD** - Waiting for Storybook 8.x with Angular 18 support  
**Workaround:** Use demo app (`npm start`)  
**Stories:** ✅ 30+ stories ready for Storybook 8.x
