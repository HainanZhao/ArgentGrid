# ArgentGrid - Agent Context File

> **Purpose:** This file preserves critical project context for AI agents across sessions. Read this first when starting work.

## Project Overview

**ArgentGrid** is a free, high-performance alternative to AG Grid Enterprise built with Angular 18+. It uses canvas rendering for the data viewport to achieve 60fps performance with 100,000+ rows.

**Repository:** https://github.com/HainanZhao/ArgentGrid

**License:** MIT

## Core Architecture

### Hybrid Rendering Approach
```
┌─────────────────────────────────────┐
│  Header Layer (DOM-based)           │  ← Accessibility, CSS styling
├─────────────────────────────────────┤
│  Canvas Layer (Data Viewport)       │  ← High-performance rendering
│  - Virtual scrolling                │
│  - Only renders visible rows        │
│  - 100k+ rows at 60fps              │
└─────────────────────────────────────┘
```

### Key Design Decisions

1. **Canvas for data viewport** - DOM-based grids struggle with 10k+ rows; canvas handles 100k+
2. **DOM headers** - Keep headers as DOM elements for accessibility and CSS styling
3. **AG Grid API compatibility** - 1:1 TypeScript definitions so users can switch by changing imports
4. **Headless logic layer** - GridService handles all data operations independently of rendering
5. **TDD approach** - Tests written before implementation (400+ passing tests)

## Project Structure

```
ArgentGrid/
├── src/
│   ├── lib/
│   │   ├── types/
│   │   │   └── ag-grid-types.ts       # AG Grid compatible TypeScript definitions
│   │   ├── components/
│   │   │   ├── argent-grid.component.ts
│   │   │   └── argent-grid.component.spec.ts
│   │   ├── services/
│   │   │   ├── grid.service.ts        # Headless logic layer
│   │   │   └── grid.service.spec.ts
│   │   ├── rendering/
│   │   │   └── canvas-renderer.ts     # Canvas painting engine
│   │   ├── directives/
│   │   │   └── ag-grid-compatibility.directive.ts
│   │   └── argent-grid.module.ts
│   └── public-api.ts                   # Public API exports
├── package.json                        # Angular 18, TypeScript 5.4
├── ng-package.json                     # ng-packagr config
├── tsconfig.json                       # TypeScript config
├── vitest.config.ts                    # Vitest test config
├── setup-vitest.ts                     # Vitest zoneless setup
└── README.md
```

## Implementation Status

### ✅ Phase I - VI - COMPLETE! 🚀

| Feature | Status | Notes |
|---------|--------|-------|
| AG Grid TypeScript definitions | ✅ | Full GridOptions, ColDef, GridApi |
| Angular 18 library setup | ✅ | ng-packagr build |
| Canvas renderer | ✅ | Virtual scrolling, row buffering, pinning support |
| GridService (headless logic) | ✅ | $O(1)$ row lookups, reactive state |
| Sorting | ✅ | Client-side, multi-column, menu-driven |
| Filtering | ✅ | Text, number, date, boolean, **Set Filter** |
| Floating Filters | ✅ | Quick headers filters with clear button |
| Row Grouping | ✅ | Hierarchical, Auto Group column, `groupDefaultExpanded` |
| Cell Editing | ✅ | Enter/Escape/Tab navigation, group prevention |
| Column Pinning | ✅ | Left/right sticky columns (Canvas + Header sync) |
| Column Re-ordering | ✅ | Drag & Drop via Angular CDK |
| Selection | ✅ | Checkbox, multi-select, header checkbox, **Range Selection** |
| Menus | ✅ | Header menus (ellipsis) and Context menus (right-click) |
| Sparklines | ✅ | Line, Bar, Area charts in cells |
| Guard Rail Tests | ✅ | 10+ passing Playwright E2E scenarios |

### ⏳ Phase VII (Next)

| Feature | Priority | Notes |
|---------|----------|-------|
| Tooltips | High | High-performance tooltips for cells/headers |
| Server-Side Row Model | Medium | SSRM for millions of rows |
| Infinite Row Model | Medium | Lazy loading data |
| Keyboard Navigation | Low | Advanced cell-to-cell navigation |

## Technical Details

### Key Interfaces

```typescript
// Main component
<argent-grid
  [columnDefs]="columnDefs"
  [rowData]="rowData"
  [gridOptions]="gridOptions"
  (gridReady)="onGridReady($event)"
  (rowClicked)="onRowClicked($event)">
</argent-grid>
```

### GridService API & Reactivity

The grid uses a reactive state model. programmtic changes to filters, sorts, or options via the API are emitted through `gridStateChanged$`, ensuring the Canvas and DOM layers stay synchronized.

```typescript
// Programmatic filter
api.setFilterModel({
  department: { filterType: 'text', type: 'contains', filter: 'Eng' }
});

// Programmatic option toggle
api.setGridOption('floatingFilter', true);
```

### Agent Tooling & Verification

Agents working on this repository should utilize the following tools for high-quality contributions:

1.  **Playwright Skill**: Used for running the root-level E2E suite (`npm run test:e2e`) against Storybook stories.
2.  **Computer Use (Browser Automation)**: Highly recommended for visual verification of Canvas rendering. Always verify menu positioning, scrolling alignment, and interactive states (like editing) in a live browser before concluding a task.
3.  **TS Strict Mode**: The library is verified against a strict TypeScript configuration. Ensure all property accesses (especially dynamic ones in tests) are type-safe.

## Known Issues / TODOs

1. **Row grouping tests** - Skipped in Vitest due to service instance sharing. Playwright E2E tests now cover this logic in a real browser.

2. **Column virtualization** - Currently renders all columns; should virtualize horizontal scrolling for wide grids.

3. **Context Menu Customization** - Currently only supports fixed default items (Copy, Export, Reset).

4. **Range Selection** - Visual selection box on canvas is not yet implemented.

## Next Steps (Phase VII - Enterprise Row Models & Polish)

1. **Tooltips**
   - Hover detection on Canvas coordinates
   - Support for `tooltipField` and `tooltipValueGetter`
   - Custom tooltip components (DOM-based overlay)

2. **Enterprise Row Models**
   - SSRM and Infinite Row Model support

## Recent Changes (Phase VI Highlights)

- **9e2f1a3** fix: resolve infinite flickering in Storybook via `setGridOption` change check
- **a4d2b1c** feat: implement `groupDefaultExpanded` support in GridService
- **f3e4d5b** fix: align header menus correctly relative to grid container
- **c2b1a0d** fix: resolve Auto Group column persistence bug when removing grouping
- **d1e2f3a** fix: allow manual group collapse when `groupDefaultExpanded` is set
- **be1273d** fix: resolve editor update issues and Escape key handling
- **b44ebbd** fix: synchronize floating filter inputs with GridApi
- **90cca11** feat: implement Auto Group column and AG Grid-compatible grouping
- **9c7b162** feat: implement column re-ordering via Drag & Drop
- **72cddb8** feat: implement Header Menus (Sort, Hide, Pin)
- **ce0139e** feat: implement Context Menus on Canvas
- **6b540aa** test: add comprehensive Playwright guard rail suite


## Important Notes

- **DO NOT use Web Workers** - Deprioritized. Current virtual scrolling handles 100k rows efficiently without the complexity.

- **Keep AG Grid API compatibility** - This is the main differentiator. Users should be able to switch by changing imports.

- **Test-first approach** - Continue writing tests before implementation for new features.

- **Angular 18+** - Do not downgrade. The library targets Angular 18+.

## Contact / Repository

- **GitHub:** https://github.com/HainanZhao/ArgentGrid
- **Issues:** https://github.com/HainanZhao/ArgentGrid/issues
