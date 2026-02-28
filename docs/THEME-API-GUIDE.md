# ArgentGrid Theme API Guide

**Compatible with AG Grid's New Theming API (v32.2+)**

---

## 🎨 Overview

ArgentGrid now supports a **programmatic Theme API** that allows you to customize the grid's appearance using JavaScript/TypeScript instead of CSS. This provides:

- ✅ **TypeScript validation** and autocomplete
- ✅ **Chainable customization** with `withParams()` and `withPart()`
- ✅ **Modular theming** with reusable parts
- ✅ **No CSS required** for most customizations

---

## 🚀 Quick Start

### 1. Import a Built-in Theme

```typescript
import { themeQuartz } from 'argent-grid';

// Apply theme to grid
gridOptions.theme = themeQuartz;
```

### 2. Customize with Parameters

```typescript
import { themeQuartz } from 'argent-grid';

const myTheme = themeQuartz.withParams({
  spacing: 12,
  accentColor: 'red',
  fontSize: 14,
  rowHeight: 48,
});

gridOptions.theme = myTheme;
```

### 3. Mix and Match Parts

```typescript
import { themeQuartz, colorSchemeDark, iconSetMaterial } from 'argent-grid';

const myTheme = themeQuartz
  .withPart(colorSchemeDark)
  .withPart(iconSetMaterial);

gridOptions.theme = myTheme;
```

---

## 📦 Built-in Themes

### themeQuartz ⭐ **Recommended**

Modern, high-contrast theme suitable for most applications.

```typescript
import { themeQuartz } from 'argent-grid';

gridOptions.theme = themeQuartz;
```

### themeBalham

Spreadsheet-style, compact theme for dense data display.

```typescript
import { themeBalham } from 'argent-grid';

gridOptions.theme = themeBalham;
```

### themeAlpine

Classic, clean theme (legacy, but still supported).

```typescript
import { themeAlpine } from 'argent-grid';

gridOptions.theme = themeAlpine;
```

---

## 🎨 Theme Customization

### withParams() Method

Customize theme parameters:

```typescript
const myTheme = themeQuartz.withParams({
  // Colors
  accentColor: '#ff5722',
  backgroundColor: '#ffffff',
  foregroundColor: '#333333',
  
  // Typography
  fontFamily: 'Inter, sans-serif',
  fontSize: 14,
  fontWeight: 400,
  
  // Spacing
  spacing: 8,
  rowHeight: 48,
  headerHeight: 48,
  cellPadding: 12,
  
  // Borders
  borderColor: '#e0e0e0',
  borderWidth: 1,
  borderRadius: 4,
});
```

### Available Parameters

| Category | Parameters |
|----------|------------|
| **Colors** | `accentColor`, `backgroundColor`, `foregroundColor`, `secondaryForegroundColor` |
| **Typography** | `fontFamily`, `fontSize`, `fontWeight`, `headerFontWeight` |
| **Spacing** | `spacing`, `rowHeight`, `headerHeight`, `cellPadding` |
| **Borders** | `borderColor`, `borderWidth`, `borderRadius` |
| **Specific** | `headerBackgroundColor`, `rowBackgroundColor`, `rowEvenBackgroundColor`, `rowHoverBackgroundColor`, `rowSelectedBackgroundColor` |
| **Group Row** | `groupRowBackgroundColor`, `groupRowIndentWidth` |
| **Icons** | `iconColor`, `iconSize` |
| **Focus** | `focusBorderColor`, `focusBorderWidth` |

---

## 🧩 Theme Parts

Parts are modular theme components that can be mixed and matched.

### Color Schemes

```typescript
import { themeQuartz, colorSchemeDark } from 'argent-grid';

// Apply dark color scheme
const myTheme = themeQuartz.withPart(colorSchemeDark);
```

**Available Color Schemes:**
- `colorSchemeLight` - Default light mode
- `colorSchemeDark` - Dark mode
- `colorSchemeAuto` - Follows system preference

### Icon Sets

```typescript
import { themeQuartz, iconSetMaterial } from 'argent-grid';

// Use Material Design icons
const myTheme = themeQuartz.withPart(iconSetMaterial);
```

**Available Icon Sets:**
- `iconSetQuartz` - Default Quartz icons
- `iconSetMaterial` - Material Design icons
- `iconSetMinimal` - Minimal line icons

### Chaining Parts

```typescript
import { 
  themeQuartz, 
  colorSchemeDark, 
  iconSetMaterial 
} from 'argent-grid';

const myTheme = themeQuartz
  .withPart(colorSchemeDark)
  .withPart(iconSetMaterial);
```

---

## 🛠️ Advanced Usage

### createPart() API

Create custom reusable parts:

```typescript
import { createPart, themeQuartz } from 'argent-grid';

const myCustomPart = createPart('myCustomPart')
  .withCSS(`
    .ag-cell {
      border-left: 1px solid ${params.borderColor};
    }
  `)
  .withAdditionalParams({
    customColor: { ref: 'accentColor', mix: 0.5 },
  });

const myTheme = themeQuartz.withPart(myCustomPart);
```

### extendTheme()

Quick theme extension:

```typescript
import { themeQuartz, extendTheme } from 'argent-grid';

const myTheme = extendTheme(themeQuartz, {
  accentColor: 'blue',
  spacing: 12,
});
```

### mergeThemes()

Merge multiple themes:

```typescript
import { themeQuartz, themeBalham, mergeThemes } from 'argent-grid';

const myTheme = mergeThemes(themeQuartz, themeBalham);
```

### applyTheme()

Apply theme to a container:

```typescript
import { themeQuartz, applyTheme } from 'argent-grid';

// Apply to document
applyTheme(themeQuartz);

// Apply to specific container
applyTheme(themeQuartz, document.getElementById('my-container'));

// Apply to Shadow DOM
applyTheme(themeQuartz, shadowRoot);
```

---

## 📊 Theme Presets

### Compact Theme

```typescript
import { themeQuartz } from 'argent-grid';

const compactTheme = themeQuartz.withParams({
  rowHeight: 32,
  fontSize: 12,
  cellPadding: 8,
  spacing: 4,
});
```

### Comfortable Theme

```typescript
import { themeQuartz } from 'argent-grid';

const comfortableTheme = themeQuartz.withParams({
  rowHeight: 56,
  fontSize: 16,
  cellPadding: 16,
  spacing: 12,
});
```

### Blue Accent Theme

```typescript
import { themeQuartz } from 'argent-grid';

const blueTheme = themeQuartz.withParams({
  accentColor: '#2196f3',
  rowSelectedBackgroundColor: '#bbdefb',
  rowHoverBackgroundColor: '#e3f2fd',
});
```

---

## 🎯 Migration from Old Theme System

### Before (Old System)

```typescript
import { DEFAULT_THEME, mergeTheme } from 'argent-grid';

const myTheme = mergeTheme(DEFAULT_THEME, {
  bgCell: '#ffffff',
  bgHeader: '#f5f5f5',
  rowHeight: 48,
});
```

### After (New Theme API)

```typescript
import { themeQuartz } from 'argent-grid';

const myTheme = themeQuartz.withParams({
  backgroundColor: '#ffffff',
  headerBackgroundColor: '#f5f5f5',
  rowHeight: 48,
});
```

---

## 📚 API Reference

### ThemeBuilder Interface

```typescript
interface ThemeBuilder {
  readonly name: string;
  readonly description?: string;
  readonly parameters: ThemeParameters;
  readonly parts: ThemePart[];
  
  withParams(params: PartialThemeParameters): ThemeBuilder;
  withPart(part: ThemePart): ThemeBuilder;
  build(): Theme;
  toCSS(): string;
}
```

### ThemeParameters Interface

```typescript
interface ThemeParameters {
  // Colors
  accentColor?: string;
  backgroundColor?: string;
  foregroundColor?: string;
  
  // Typography
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: number | string;
  
  // Spacing
  spacing?: number;
  rowHeight?: number;
  headerHeight?: number;
  cellPadding?: number;
  
  // Borders
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  
  // ... and more
}
```

---

## 🔗 Related Documentation

- [THEME-API-PLAN.md](./THEME-API-PLAN.md) - Implementation plan
- [AG Grid Theming API](https://www.ag-grid.com/react-data-grid/theming-api/) - Original API reference
- [AG Grid Theme Builder](https://www.ag-grid.com/theme-builder/) - Visual theme designer

---

## 💡 Tips & Best Practices

### 1. Start with a Built-in Theme

Always start with a built-in theme (`themeQuartz`, `themeBalham`, etc.) and customize from there.

### 2. Use TypeScript Autocomplete

The Theme API provides full TypeScript support. Use your IDE's autocomplete to discover available parameters.

### 3. Chain withParams() Calls

```typescript
const myTheme = themeQuartz
  .withParams({ spacing: 12 })
  .withParams({ accentColor: 'red' })
  .withParams({ fontSize: 14 });
```

### 4. Reuse Custom Parts

```typescript
// Create once
const myCustomPart = createPart('myPart')
  .withCSS('...')
  .withAdditionalParams({...});

// Reuse across themes
const theme1 = themeQuartz.withPart(myCustomPart);
const theme2 = themeBalham.withPart(myCustomPart);
```

### 5. Test with Different Color Schemes

```typescript
// Test light mode
const lightTheme = themeQuartz.withPart(colorSchemeLight);

// Test dark mode
const darkTheme = themeQuartz.withPart(colorSchemeDark);
```

---

## 🐛 Troubleshooting

### Theme Not Applying

1. Ensure you're setting `gridOptions.theme`
2. Check browser console for errors
3. Verify theme is imported correctly

### TypeScript Errors

1. Ensure you're importing from `'argent-grid'`
2. Check that parameters match `ThemeParameters` interface
3. Use `withParams()` for customization, not direct mutation

### Parts Not Working

1. Ensure parts are imported correctly
2. Check that part type matches (`color-scheme`, `icon-set`, etc.)
3. Verify part is compatible with base theme

---

**Last Updated:** February 28, 2026  
**Version:** 1.0.0  
**Compatible with:** AG Grid Theming API v32.2+
