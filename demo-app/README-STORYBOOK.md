# Storybook Setup - Known Issue

## ⚠️ Current Status

Storybook 7.6.x has **limited compatibility** with Angular 18's new application builder (`@angular-devkit/build-angular:application`).

### Error

```
SB_FRAMEWORK_ANGULAR_0001 (AngularLegacyBuildOptionsError): 
Your Storybook startup script uses a solution that is not supported anymore.
You must use Angular builder to have an explicit configuration on the project used in angular.json.
```

## 🔧 Workarounds

### Option 1: Use Existing Demo App (Recommended)

The demo app already serves as component documentation:

```bash
cd demo-app
npm start
# Open http://localhost:4200
```

### Option 2: Wait for Storybook 8.x

Storybook 8.x will have full Angular 18 support. Once released:

```bash
npm install --save-dev @storybook/angular@latest @storybook/addon-essentials@latest
npx storybook upgrade
```

### Option 3: Downgrade to Angular 17

If Storybook is critical:

```bash
# Downgrade Angular to v17
npm install @angular/core@17 @angular/cli@17 @angular-devkit/build-angular@17

# Then Storybook 7.6 works
npm run storybook
```

## 📚 Alternative: Component Documentation

Use the existing documentation:

- [THEME-API-GUIDE.md](../../docs/THEME-API-GUIDE.md) - Theme API documentation
- [LIVE-DATA-OPTIMIZATIONS.md](../../docs/LIVE-DATA-OPTIMIZATIONS.md) - Live data guide
- [STORYBOOK-REFACTOR.md](../../docs/STORYBOOK-REFACTOR.md) - Storybook refactor plan

## 🎯 Recommendation

**For now:** Use the demo app (`npm start`) for manual testing and the docs for documentation.

**Future:** Migrate to Storybook 8.x when Angular 18 support is stable.

---

**Status:** ⏸️ On hold until Storybook 8.x Angular 18 support  
**Priority:** LOW - Demo app serves the purpose for now
