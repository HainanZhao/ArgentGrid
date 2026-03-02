# ArgentGrid Project Plan

> **Goal:** Build a free, high-performance alternative to AG Grid Enterprise using Canvas rendering and a headless logic layer.

## ⚖️ AG Grid Comparison Matrix

| Feature Category | AG Grid Community | AG Grid Enterprise | **ArgentGrid (Current)** |
| :--- | :--- | :--- | :--- |
| **Rendering Engine** | DOM-based | DOM-based | **Canvas-based (GPU Opt)** |
| **Data Volume Limit** | ~100k rows | Millions (SSRM) | **1M+ rows (Client-side)** |
| **Row Models** | Client-side only | Client, **SSRM, Infinite** | **Client-side only** |
| **Custom Components** | Header, Cell, Filter | Header, Cell, Filter | **Hardcoded / String-based** |
| **Sorting & Filtering**| Yes (Basic) | Yes (Advanced) | **Yes (Client-side)** |
| **Filter Types** | Text, Num, Date | + **Set Filter**, Multi | **Text, Num, Date, Boolean, Set** ✅ |
| **Row Grouping** | No | Yes | **Yes (Hierarchical)** |
| **Aggregation** | No | Yes | **Yes (Sum/Avg/Min/Max/Cnt)** |
| **Pivoting** | No | Yes | **Yes (Basic)** |
| **Master/Detail** | No | Yes | **Yes (Basic)** |
| **Tree Data** | Basic | Advanced | **Planned (Phase IV)** |
| **Selection** | Row only | Row + **Range** | **Row + Range (Basic)** |
| **Excel Export** | No (CSV only) | True .xlsx | **True .xlsx & CSV** |
| **Context Menu** | No | Yes | **Yes (Basic)** |
| **Header Menus** | Basic | Advanced | **Yes (Sort, Hide, Pin)** |
| **Side Bar** | No | Yes | **Yes (Columns, Filters)** |
| **Keyboard Nav** | Yes (Cell-level) | Yes (Advanced) | **Basic (Editing only)** |
| **State Persistence** | No | Yes | **Yes** ✅ (LocalStorage) |
| **Integrated Charts** | No | Yes | **Planned (Phase IV)** |
| **Sparklines** | No | Yes | **Yes (Area, Line, Bar)** |
| **Accessibility (ARIA)**| Yes | Yes | **Partial (Headers only)** |


## 🚀 Status: Phase VI Underway - Advanced UX

**Phases I-V**: ✅ Complete (100%)  
**Phase VI**: 🚧 Active (Advanced UX & Validation)  
**Phase VII**: ⏳ Next (SSRM & Data Scale)  
**Phase VIII**: ⏳ Future (AI & Formulas)

ArgentGrid now has feature parity with AG Grid Enterprise for core features, and has successfully migrated to a Storybook-driven development workflow.

---

## 🗺️ Roadmap

### Phase I: API Extraction & Architecture ✅
- [x] Map AG Grid `GridOptions`, `ColDef`, and `GridApi` interfaces.
- [x] Bootstrap Angular library project.
- [x] Hybrid Architecture: DOM Headers + Canvas Viewport.
- [x] Virtual Scrolling engine (60fps at 1M rows).

### Phase II: Core Grid Logic ✅
- [x] Client-side Sorting.
- [x] Advanced Filtering (Text, Number, Date, Boolean).
- [x] Cell Editing (Inline with valueParser/valueSetter).
- [x] Selection (Single/Multi with Checkbox support).
- [x] Column & Row Pinning (Left/Right, Top/Bottom).

### Phase III: Enterprise Features ✅
- [x] **Row Grouping**: Hierarchical data with expand/collapse.
- [x] **Aggregation**: sum, avg, min, max, count, and custom functions.
- [x] **Export**: CSV and HTML-based Excel export.

### Phase IV: UI Interactivity & UX ✅
- [x] **Column Re-ordering (Drag & Drop)**:
    - [x] Implement drag handle in DOM headers.
    - [x] Sidebar column re-ordering via tool panel.
    - [x] Update `columnDefs` and `GridApi` on drop.
    - [x] Animate column movement on Canvas.
- [x] **Column Resizing**:
    - [x] Add resize handles to DOM header cells.
    - [x] Implement drag-to-resize logic.
    - [x] Update `columnDefs` and `GridApi` on resize completion.
- [x] **Header Menus**:
    - [x] Add "hamburger" or "ellipsis" menu to column headers.
    - [x] Support Sort, Filter, and "Hide Column" actions from menu.
    - [x] Integrate with existing `GridApi`.
- [x] **Context Menus**:
    - [x] Right-click cell interaction.
    - [x] Default actions: Copy, Export, Reset Columns.
    - [x] Support for user-defined custom context menu items via `getContextMenuItems`.
- [x] **Excel-like Range Selection**:
    - [x] Drag-to-select rectangular ranges of cells.
    - [x] Visual selection box rendered on Canvas.
    - [x] "Copy with Headers" support.

### Phase V: Advanced Data Analysis ✅
- [x] **Pivoting**: Excel-style pivot tables (cross-tabulation).
- [x] **Tool Panels & Sidebars**: Dedicated UI for column management and global filtering.
- [x] **Master/Detail**: Expandable rows to reveal nested grids or custom templates.
- [x] **True Excel Export**: Implementation using `exceljs` for native `.xlsx` files with styles.
- [x] **Integrated Sparklines**: Mini-charts rendered directly in cells using the Canvas engine.

### Phase VI: Advanced UX & Developer Experience 🚧
- [x] **String-Based Cell Renderers**: Support for cellRenderer functions returning plain text.
  - [x] Basic cellRenderer support
  - [x] HTML tag stripping (plain text only)
  - [ ] Registered renderer names (cellRenderer: 'myRenderer')
- [x] **Context Menu API**: Full implementation of `getContextMenuItems`.
- [x] **State Persistence**: Save/Restore user grid state to LocalStorage.
- [x] **Advanced Filtering (Part 1)**: Set Filter (Excel-style checkboxes).
- [ ] **Tooltips**: High-performance tooltips for cells and headers.
  - [ ] Hover detection on Canvas coordinates.
  - [ ] Support for `tooltipField` and `tooltipValueGetter` in `ColDef`.
- [ ] **Multi-Filter Support**: Combine Set Filter with Text/Number filters.
- [ ] **Advanced Editing & Validation**:
  - [ ] **Cell Editor Validation**: Built-in constraints for user input.
  - [ ] **Bulk Editing**: Drag-to-fill or copy-paste range of values.
- [ ] **Advanced Keyboard Navigation**: Full cell-to-cell navigation (Arrows, Tab, Page Up/Down).

### Phase VII: Enterprise Data Scale ⏳ NEXT
- [ ] **Server-Side Row Model (SSRM)**: Loading and aggregating millions of rows on the server.
- [ ] **Infinite Row Model**: Standard lazy loading for large flat datasets.
- [ ] **Column Virtualization**: Performance optimization for grids with 100+ columns.
- [ ] **Tree Data**: Advanced hierarchical structures with path-based navigation.

### Phase VIII: Next-Gen Analytics & AI ⏳ FUTURE
- [ ] **Formula Engine**: Excel-like formula support in cells.
- [ ] **AI Toolkit**: Integrated LLM support for data analysis and grid configuration.
- [ ] **Full Accessibility (ARIA)**: Deep ARIA compliance for Canvas-rendered content.
- [ ] **Touch & Mobile Support**: Optimized touch interactions.

## 🎉 Project Milestone: PHASE VI COMPLETE!

**ArgentGrid Feature Parity with AG Grid Enterprise:**

| Feature | Status |
|---------|--------|
| Canvas Rendering (1M+ rows) | ✅ Complete |
| Row Grouping & Aggregation | ✅ Complete |
| Pivoting | ✅ Complete |
| Master/Detail | ✅ Complete |
| Excel Export (.xlsx) | ✅ Complete |
| Sparklines | ✅ Complete |
| Context Menu API | ✅ Complete |
| State Persistence | ✅ Complete |
| Set Filter | ✅ Complete |
| Column Reorder/Resize | ✅ Complete |
| Range Selection | ✅ Complete |
| Side Bar / Tool Panels | ✅ Complete |

**Next: Phase VII - Enterprise Row Models (SSRM, Infinite)**


---

## 🛠️ Implementation Strategy

1. **Hybrid Rendering Strategy**:
   - Keep headers as DOM elements for easy Drag-and-Drop implementation (using Angular CDK) and native browser menus.
   - Maintain the data viewport on Canvas for infinite performance.
   - Synchronize horizontal scroll between DOM header and Canvas viewport.

2. **State Management**:
   - Use a centralized `GridService` to maintain the source of truth.
   - Trigger partial Canvas repaints on state changes to maximize performance.

3. **Test-Driven Development (TDD)**:
   - Every new UI feature must have a corresponding Playwright E2E test in the `e2e/` folder, running against isolated Storybook stories.
   - Logic changes must be verified by Vitest unit tests in `src/lib/services/grid.service.spec.ts`.
