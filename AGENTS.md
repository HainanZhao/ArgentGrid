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
5. **TDD approach** - Tests written before implementation (41 passing tests)

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
├── jest.config.js                      # Jest test config
├── setup-jest.ts                       # Jest zone.js setup
└── README.md
```

## Implementation Status

### ✅ Completed (Phase I & II + Core Features)

| Feature | Status | Notes |
|---------|--------|-------|
| AG Grid TypeScript definitions | ✅ | Full GridOptions, ColDef, GridApi |
| Angular 18 library setup | ✅ | ng-packagr build |
| Canvas renderer | ✅ | Virtual scrolling, row buffering |
| GridService (headless logic) | ✅ | Data management, state |
| Sorting | ✅ | Client-side, multi-column |
| Filtering | ✅ | Text, number, date, boolean |
| Row Grouping | ✅ | Hierarchical, with aggregations |
| Transactions (add/update/remove) | ✅ | Row data transactions |
| TDD test suite | ✅ | 41 passing tests |

### ⏳ Pending (Phase III & IV)

| Feature | Priority | Notes |
|---------|----------|-------|
| Cell Editing | High | Inline editing, validation |
| Column Pinning | Medium | Freeze left/right columns |
| Full Selection | Medium | Multi-select, keyboard nav |
| Aggregation (standalone) | Low | Pinned footers with aggregations |
| Expand/Collapse groups API | Low | Programmatic group control |
| Web Workers | Deprioritized | Current perf is adequate |

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

### GridService API

```typescript
// Create grid instance
const api = gridService.createApi(columnDefs, rowData);

// Sorting
api.setSortModel([{ colId: 'age', sort: 'desc' }]);

// Filtering
api.setFilterModel({
  name: { filterType: 'text', type: 'contains', filter: 'John' },
  age: { filterType: 'number', type: 'greaterThan', filter: 28 }
});

// Row grouping (via column defs)
const columnDefs = [
  { field: 'department', rowGroup: true },
  { field: 'salary', aggFunc: 'sum' }
];

// Transactions
api.applyTransaction({
  add: [{ id: 4, name: 'Alice' }],
  update: [{ id: 1, name: 'Updated' }],
  remove: [{ id: 2 }]
});
```

### Canvas Renderer Features

- Virtual scrolling with row buffer (5 rows above/below viewport)
- requestAnimationFrame batching
- Passive scroll listeners
- Device pixel ratio support
- Row striping for readability
- Binary search text truncation

### Test Commands

```bash
npm test              # Run tests
npm run test:watch    # Watch mode
npm run build         # Build library
npm run build:watch   # Watch build
```

## Current Test Status

```
Test Suites: 2 passed, 2 total
Tests:       4 skipped, 41 passed, 45 total
```

**Skipped tests:** 4 row grouping tests (test isolation issue with shared service instance)

## Build Output

```bash
npm run build
# Output: dist/
# - bundles/ (FESM bundles)
# - argentgrid.d.ts (type definitions)
# - package.json (distributable package)
```

## Dependencies

**Peer Dependencies:**
- @angular/core: ^18.0.0
- @angular/common: ^18.0.0
- @angular/cdk: ^18.0.0

**Dev Dependencies:**
- ng-packagr: ^18.0.0
- TypeScript: ~5.4.2
- Jest: ^29.7.0
- jest-preset-angular: ^14.1.0

## Known Issues / TODOs

1. **Row grouping tests** - Skipped due to service instance sharing between tests. Need to refactor test setup or use fresh service instances.

2. **Expand/collapse groups API** - Groups are created but no API to programmatically expand/collapse them.

3. **Canvas hit testing** - Mouse click detection works but could be optimized.

4. **Column virtualization** - Currently renders all columns; should virtualize horizontal scrolling for wide grids.

5. **Excel export** - Stubbed but not implemented (requires additional library).

## Next Steps (Priority Order)

1. **Cell Editing** - Most requested feature
   - Add cellEditor, cellEditorParams to ColDef
   - Implement editing overlay
   - Add validation callbacks

2. **Column Pinning** - Common enterprise requirement
   - Add pinned: 'left' | 'right' support
   - Render pinned columns separately
   - Handle scroll synchronization

3. **Full Selection API** - Complete the selection system
   - Multi-row selection with Ctrl/Cmd
   - Range selection with Shift
   - Select/deselect all APIs

## Git Workflow

```bash
# Current branch: main
git log --oneline -5
# Latest: e443f06 docs: Update roadmap - row grouping complete

# To push changes:
git add -A
git commit -m "feat/fix/docs: description"
git push origin main
```

## Important Notes

- **DO NOT use Web Workers** - Deprioritized. Current virtual scrolling handles 100k rows efficiently without the complexity.

- **Keep AG Grid API compatibility** - This is the main differentiator. Users should be able to switch by changing imports.

- **Test-first approach** - Continue writing tests before implementation for new features.

- **Angular 18+** - Do not downgrade. The library targets Angular 18+.

## Contact / Repository

- **GitHub:** https://github.com/HainanZhao/ArgentGrid
- **Issues:** https://github.com/HainanZhao/ArgentGrid/issues
