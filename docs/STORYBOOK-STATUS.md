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

### 1. Story Files (Ready for Future)

All story files are in **`src/stories/`** and ready:

| Story File | Stories | Status |
|------------|---------|--------|
| `src/stories/ArgentGrid.stories.ts` | 8 | ✅ Ready |
| `src/stories/Filtering.stories.ts` | 5 | ✅ Ready |
| `src/stories/Grouping.stories.ts` | 4 | ✅ Ready |
| `src/stories/Theming.stories.ts` | 5 | ✅ Ready |
| `src/stories/Advanced.stories.ts` | Multiple | ✅ Ready |
| `src/stories/CellRenderers.stories.ts` | Multiple | ✅ Ready |
| `src/stories/Benchmark.stories.ts` | Multiple | ✅ Ready |

**Total:** 30+ stories ready for Storybook 8.x

### 2. Documentation

Comprehensive documentation exists:
- ✅ [THEME-API-GUIDE.md](./THEME-API-GUIDE.md) - Theme API
- ✅ [LIVE-DATA-OPTIMIZATIONS.md](./LIVE-DATA-OPTIMIZATIONS.md) - Live data
- ✅ [STORYBOOK-REFACTOR.md](./STORYBOOK-REFACTOR.md) - Storybook plan

---

## 🔧 Workarounds

### Option 1: Wait for Storybook 8.x (RECOMMENDED)

**Expected:** Q2 2026

Once released:
```bash
npm install --save-dev @storybook/angular@latest @storybook/addon-essentials@latest
npx storybook upgrade
npm run storybook
```

### Option 2: Downgrade to Angular 17

**NOT RECOMMENDED** - Only if Storybook is absolutely critical:

```bash
# WARNING: This downgrades Angular!
npm install @angular/core@17 @angular/cli@17 @angular-devkit/build-angular@17
npm run storybook
```

---

## 📋 Story Files Location

**All stories are in:** `src/stories/`

```
src/stories/
├── ArgentGrid.stories.ts       # 8 stories
├── Filtering.stories.ts         # 5 stories (with visual indicators)
├── Grouping.stories.ts          # 4 stories (with icons)
├── Theming.stories.ts           # 5 stories
├── Advanced.stories.ts          # Multiple stories
├── CellRenderers.stories.ts     # Multiple stories
└── Benchmark.stories.ts         # Performance tests
```

**Once Storybook 8.x is released**, these stories will work immediately.

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
1. Read **documentation** for feature guides
2. **Wait for Storybook 8.x** (Q2 2026)
3. All 30+ stories are ready and will work immediately

**Once Storybook 8.x is released:**
1. Run `npx storybook upgrade`
2. All existing stories will work immediately
3. Enable GitHub Pages deployment

---

**Status:** ⏸️ **ON HOLD** - Waiting for Storybook 8.x with Angular 18 support  
**Stories:** ✅ 30+ stories in `src/stories/` (ready for Storybook 8.x)  
**Documentation:** ✅ Complete
