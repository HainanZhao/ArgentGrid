# ArgentGrid Theme API Implementation Plan

## 📊 AG Grid New Theming API Research

**Source:** AG Grid v32.2+ (October 2024), default in v33+

### Key Features of AG Grid's New Theming API

1. **Programmatic Theme Objects**
   - `themeQuartz`, `themeBalham`, `themeAlpine`, `themeMaterial`
   - Import from `@ag-grid-community/theming`
   - Applied via `theme` grid option (not CSS class)

2. **withParams() Method**
   - Customize themes programmatically
   - TypeScript validation & autocomplete
   - Example: `themeQuartz.withParams({ spacing: 12, accentColor: 'red' })`

3. **Parts System**
   - Modular theme components
   - Mix and match: `themeQuartz.withPart(iconSetMaterial).withPart(colorSchemeDark)`
   - Available parts:
     - Color schemes (light, dark, etc.)
     - Icon sets (Material, etc.)
     - Checkbox styles
     - Input styles
     - Tab styles

4. **createPart() API**
   - Create custom reusable parts
   - `withCSS()`, `withAdditionalParams()`, `withParams()`

5. **CSS Layer Support**
   - `themeCssLayer` grid option
   - Proper layer ordering for overrides

6. **Shadow DOM Support**
   - `themeStyleContainer` grid option
   - Automatic detection and style injection

7. **Theme Builder Tool**
   - Visual theme designer
   - Export to code

---

## 🔍 Current ArgentGrid Theme System

### What We Have ✅

1. **Basic Theme Constants**
   - `DEFAULT_THEME` - Default light theme
   - `DARK_THEME` - Dark mode theme

2. **Theme Utilities**
   - `mergeTheme()` - Merge multiple themes
   - `getFontFromTheme()` - Generate font string
   - `getRowTheme()` - Row state-based theming
   - `getCellBackgroundColor()` - Cell background by state

3. **Theme Presets**
   - `default`, `dark`, `compact`, `comfortable`, `blueAccent`, `greenAccent`
   - `createTheme()` - Create theme from preset

### What's Missing ❌

| Feature | AG Grid | ArgentGrid | Priority |
|---------|---------|------------|----------|
| **Theme Objects** | ✅ themeQuartz, etc. | ❌ | **HIGH** |
| **withParams()** | ✅ Chainable customization | ❌ | **HIGH** |
| **Parts System** | ✅ Modular parts | ❌ | **MEDIUM** |
| **createPart()** | ✅ Custom parts | ❌ | **LOW** |
| **CSS Layer Support** | ✅ themeCssLayer | ❌ | **MEDIUM** |
| **Shadow DOM** | ✅ themeStyleContainer | ❌ | **LOW** |
| **Theme Builder** | ✅ Visual tool | ❌ | **LOW** |
| **Icon Sets** | ✅ Multiple icon sets | ❌ | **MEDIUM** |
| **Color Schemes** | ✅ Built-in schemes | ⚠️ Partial | **MEDIUM** |

---

## 🎯 Implementation Plan

### Phase 1: Core Theme API (HIGH Priority)

**Goal:** Match AG Grid's core theming API

#### 1.1 Theme Objects
```typescript
// New API
import { themeQuartz, themeBalham } from 'argent-grid';

// Apply theme
gridOptions.theme = themeQuartz;
```

**Files to create:**
- `src/lib/themes/theme-quartz.ts`
- `src/lib/themes/theme-balham.ts`
- `src/lib/themes/theme-alpine.ts`

#### 1.2 withParams() Method
```typescript
// Chainable customization
const myTheme = themeQuartz
  .withParams({ spacing: 12, accentColor: 'red' })
  .withParams({ fontSize: 14 });
```

**Files to modify:**
- `src/lib/themes/theme-builder.ts` (NEW)
- `src/lib/rendering/render/theme.ts` (Extend)

#### 1.3 Theme Parameters Interface
```typescript
interface ThemeParameters {
  // Colors
  accentColor?: string;
  backgroundColor?: string;
  foregroundColor?: string;
  
  // Typography
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string | number;
  
  // Spacing
  spacing?: number;
  rowHeight?: number;
  headerHeight?: number;
  
  // Borders
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  
  // Density
  compact?: boolean;
}
```

---

### Phase 2: Parts System (MEDIUM Priority)

**Goal:** Enable modular theme customization

#### 2.1 Built-in Parts
```typescript
import { 
  themeQuartz, 
  colorSchemeDark, 
  iconSetMaterial,
  checkboxStyleQuartz 
} from 'argent-grid';

const myTheme = themeQuartz
  .withPart(colorSchemeDark)
  .withPart(iconSetMaterial);
```

**Files to create:**
- `src/lib/themes/parts/color-schemes.ts`
- `src/lib/themes/parts/icon-sets.ts`
- `src/lib/themes/parts/checkbox-styles.ts`
- `src/lib/themes/parts/input-styles.ts`

#### 2.2 createPart() API
```typescript
import { createPart } from 'argent-grid';

const myCustomPart = createPart('myPart')
  .withCSS(`
    .ag-checkbox-input {
      color: ${params.checkboxColor};
    }
  `)
  .withAdditionalParams({
    checkboxColor: { ref: 'accentColor', mix: 0.5 },
  });
```

**Files to create:**
- `src/lib/themes/part-builder.ts` (NEW)

---

### Phase 3: Advanced Features (LOW Priority)

#### 3.1 CSS Layer Support
```typescript
gridOptions.themeCssLayer = 'grid';
gridOptions.themeStyleContainer = document.body;
```

#### 3.2 Shadow DOM Support
```typescript
gridOptions.themeStyleContainer = shadowRoot;
```

#### 3.3 Icon Sets
```typescript
// Multiple icon sets
import { iconSetMaterial, iconSetQuartz } from 'argent-grid';

const myTheme = themeQuartz.withPart(iconSetMaterial);
```

---

## 📋 Implementation Checklist

### Phase 1: Core Theme API

- [ ] Create theme objects (themeQuartz, themeBalham, themeAlpine)
- [ ] Implement withParams() method
- [ ] Create ThemeParameters interface
- [ ] Add TypeScript autocomplete/validation
- [ ] Update GridApi to support theme option
- [ ] Update GridComponent to accept theme
- [ ] Write unit tests
- [ ] Write documentation

### Phase 2: Parts System

- [ ] Create Parts system architecture
- [ ] Implement color scheme parts
- [ ] Implement icon set parts
- [ ] Implement checkbox style parts
- [ ] Implement withPart() method
- [ ] Create createPart() API
- [ ] Write unit tests
- [ ] Write documentation

### Phase 3: Advanced Features

- [ ] Implement CSS layer support
- [ ] Implement Shadow DOM support
- [ ] Create additional icon sets
- [ ] Create theme presets library
- [ ] Write documentation

---

## 🎨 Theme Presets to Implement

### Built-in Themes (Phase 1)

| Theme | Description | Based On |
|-------|-------------|----------|
| **themeQuartz** | Modern, high contrast | AG Grid Quartz |
| **themeBalham** | Spreadsheet-style, compact | AG Grid Balham |
| **themeAlpine** | Classic, clean | AG Grid Alpine |
| **themeMaterial** | Material Design | AG Grid Material |

### Color Schemes (Phase 2)

| Scheme | Description |
|--------|-------------|
| **colorSchemeLight** | Default light mode |
| **colorSchemeDark** | Dark mode |
| **colorSchemeAuto** | System preference |

### Icon Sets (Phase 2)

| Icon Set | Description |
|----------|-------------|
| **iconSetQuartz** | Default Quartz icons |
| **iconSetMaterial** | Material Design icons |
| **iconSetMinimal** | Minimal line icons |

---

## 📊 Timeline Estimate

| Phase | Features | Estimated Time |
|-------|----------|----------------|
| **Phase 1** | Core Theme API | 2-3 days |
| **Phase 2** | Parts System | 2-3 days |
| **Phase 3** | Advanced Features | 1-2 days |
| **Total** | Complete Theme API | **5-8 days** |

---

## 🎯 Success Criteria

### Phase 1 Complete When:
- ✅ Can import and use `themeQuartz`, `themeBalham`, etc.
- ✅ `withParams()` method works with TypeScript validation
- ✅ Theme parameters are properly typed
- ✅ Grid renders with applied theme
- ✅ Unit tests pass

### Phase 2 Complete When:
- ✅ Can mix and match parts: `themeQuartz.withPart(iconSetMaterial)`
- ✅ Color schemes work: `themeQuartz.withPart(colorSchemeDark)`
- ✅ `createPart()` API works for custom parts
- ✅ Unit tests pass

### Phase 3 Complete When:
- ✅ CSS layers work properly
- ✅ Shadow DOM support works
- ✅ Documentation complete
- ✅ All tests pass

---

## 📚 Documentation Plan

### Files to Create/Update:

1. **THEMING-API.md** - Main theming API documentation
2. **THEME-PRESETS.md** - Built-in theme reference
3. **THEME-PARTS.md** - Parts system reference
4. **CUSTOM-THEMES.md** - Guide for creating custom themes
5. **MIGRATION-GUIDE.md** - Migration from old theme system

### Code Examples:

```typescript
// Basic usage
import { themeQuartz } from 'argent-grid';

gridOptions.theme = themeQuartz;

// Customization
const myTheme = themeQuartz.withParams({
  spacing: 12,
  accentColor: 'red',
  fontSize: 14,
});

// Mix and match
import { themeQuartz, colorSchemeDark, iconSetMaterial } from 'argent-grid';

const myTheme = themeQuartz
  .withPart(colorSchemeDark)
  .withPart(iconSetMaterial);

// Custom part
import { createPart } from 'argent-grid';

const myPart = createPart('myPart')
  .withCSS(`...`)
  .withAdditionalParams({...});

const myTheme = themeQuartz.withPart(myPart);
```

---

## 🔗 References

- [AG Grid Theming API](https://www.ag-grid.com/react-data-grid/theming-api/)
- [AG Grid Theme Builder](https://www.ag-grid.com/theme-builder/)
- [AG Grid Themes](https://www.ag-grid.com/react-data-grid/themes/)
- [AG Grid Theme Parameters](https://www.ag-grid.com/react-data-grid/theming-parameters/)
- [AG Grid Theme Parts](https://www.ag-grid.com/react-data-grid/theming-parts/)
- [AG Grid Blog: New Theming API](https://blog.ag-grid.com/introducing-our-new-theming-api/)

---

**Status:** Ready to start implementation
**Priority:** HIGH (Phase 1)
**Estimated Start:** Immediately
