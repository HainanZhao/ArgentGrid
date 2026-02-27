# ArgentGrid Project Plan

> **Goal:** Build a free, high-performance alternative to AG Grid Enterprise using Canvas rendering and a headless logic layer.

## 🚀 Status: Phase V Complete - Advanced Data Analysis Implemented

ArgentGrid now supports Enterprise-grade features including Pivoting, Master/Detail, Sparklines, and native Excel export.

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
    - [x] Support for user-defined custom context menu items.
- [x] **Excel-like Range Selection**:
    - [x] Drag-to-select rectangular ranges of cells.
    - [x] Visual selection box rendered on Canvas.
    - [x] "Copy with Headers" support.

### Phase V: Advanced Data Analysis ✅
- [x] **Pivoting**: Excel-style pivot tables (cross-tabulation).
- [x] **Tool Panels & Sidebars**: Dedicated UI for column management and global filtering.
- [x] **Master/Detail**: Expandable rows to reveal nested grids or custom templates.
- [x] **True Excel Export**: Implementation using `xlsx` or `exceljs` for native `.xlsx` files with styles.
- [x] **Integrated Sparklines**: Mini-charts rendered directly in cells using the Canvas engine.

## 🎉 Project Milestone: ALL PHASES COMPLETE!

ArgentGrid has reached its initial goal of providing a high-performance, Enterprise-compatible Angular data grid.

### Future Roadmap
- [ ] **Web Workers**: Move data processing to background threads for even better responsiveness.
- [ ] **Accessibility (A11Y)**: Enhance screen reader support for the canvas viewport.
- [ ] **Localization**: Support for multiple languages and RTL.
- [ ] **Custom Cell Editors**: Support for Angular components as cell editors.


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
   - Every new UI feature must have a corresponding Playwright E2E test in the `demo-app`.
       - Logic changes must be verified by Vitest unit tests in `src/lib/services/grid.service.spec.ts`.
