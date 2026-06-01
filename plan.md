# ArgentGrid Project Plan

> **Goal:** Build a free, high-performance alternative to AG Grid Enterprise using Canvas rendering and a headless logic layer.

> **Note on this document:** The status below is a *code-verified* audit (re-baselined 2026-05-31), not an aspirational checklist. A feature is marked ✅ only when real working logic exists. ⚠️ means partial/stubbed. ❌ means missing. Where earlier versions of this plan over-claimed, the entry is corrected and annotated.

## ⚖️ AG Grid Comparison Matrix (verified)

| Feature Category | AG Grid Community | AG Grid Enterprise | **ArgentGrid (Verified)** |
| :--- | :--- | :--- | :--- |
| **Rendering Engine** | DOM-based | DOM-based | **Canvas viewport + DOM headers** |
| **Data Volume (client-side)** | ~100k rows | Millions (SSRM) | **1M+ rows** ✅ |
| **Row Models** | Client-side | Client, SSRM, Infinite | **Client-side only** ❌ |
| **Custom Cell Components** | Any framework component | Any framework component | **✅ Angular components via DOM overlay (class, `cellRendererSelector`, or registered name) + canvas primitives + string functions** |
| **Sorting** | Yes | Yes | **✅ Single + multi-column** |
| **Filtering** | Text, Num, Date | + Set, Multi | **✅ Text, Num, Date, Boolean, Set; quick + floating filters** |
| **Cell Editing** | Yes | Yes | **✅ Inline (DOM overlay), valueParser/Setter, validation** |
| **Selection** | Row | Row + Range | **✅ Row + checkbox + Range** |
| **Column Pin / Resize / Reorder** | Yes | Yes | **✅** |
| **Row Pinning (top/bottom)** | Yes | Yes | **✅** |
| **Column Virtualization (horizontal)** | Yes | Yes | **✅ Off-screen center columns culled + buffered; center region clipped** |
| **Row Grouping** | No | Yes | **✅ Hierarchical** |
| **Aggregation** | No | Yes | **✅ Logic complete; ⚠️ weak group-row visuals** |
| **Pivoting** | No | Yes | **✅ Basic** |
| **Master/Detail** | No | Yes | **⚠️ Placeholder rendering only** |
| **Tree Data** | Basic | Advanced | **❌ Missing** |
| **Pagination** | Yes | Yes | **✅ Full API** |
| **Clipboard (copy/paste)** | Yes | Yes (range) | **✅ TSV, copy-with-headers** |
| **Context / Header Menus** | Community basic | Advanced | **✅ Context + header menus** |
| **Side Bar / Tool Panels** | No | Yes | **✅ Columns + Filters** |
| **Excel / CSV Export** | CSV only | True .xlsx | **✅ True .xlsx (ExcelJS) + CSV** |
| **Sparklines** | No | Yes | **✅ Line/Area/Bar/Column (canvas)** |
| **Tooltips** | Yes | Yes | **✅ DOM overlay** |
| **State Persistence** | No | Yes | **✅ LocalStorage** |
| **Overlays (loading/no-rows)** | Yes | Yes | **✅** |
| **Keyboard Navigation** | Cell-level | Advanced | **✅ Cell-to-cell nav (arrows/Tab/Home/End/PageUp-Down), Enter + type-to-edit, focus ring, ensureIndexVisible/ColumnVisible** |
| **Auto / Dynamic Row Height** | Yes | Yes | **✅ `wrapText` + `autoHeight` (measured), `getRowHeight` callback; cumulative offset model** |
| **Accessibility (ARIA)** | Yes | Yes | **⚠️ Headers only — canvas content not exposed to AT** |
| **Integrated Charts** | No | Yes | **❌ Planned** |
| **Theming** | Yes | Yes | **✅ CSS-var driven (Quartz)** |

---

## 🧭 The Core Architectural Tension

Canvas rendering buys the headline feature — **1M rows at 60fps** — but it directly fights the two things AG Grid users depend on most:

1. **Arbitrary custom components in cells / headers / filters** — the single most popular AG Grid capability. Canvas cannot host `<a>`, buttons with handlers, images, or framework components. ArgentGrid currently supports only canvas-drawn primitives (checkbox, badge, button, progress, rating, sparkline) plus `cellRenderer` functions that return *plain strings*.
2. **Accessibility** — canvas content is invisible to screen readers; only DOM headers are exposed today.

**The pivotal decision:** introduce a recycled **DOM-overlay layer** that positions a small pool of real DOM/Angular components over the canvas for the handful of *visible* cells that opt into component rendering (mirroring how AG Grid virtualizes its own DOM). Everything in Tier 1 below flows from this. It is the highest-leverage work in the roadmap and a prerequisite for genuine parity and a11y.

---

## 🗺️ Reprioritized Roadmap

Ordered by **importance × popularity** (how often real AG Grid users depend on it) weighted against effort/risk. This supersedes the old Phase I–IX numbering.

### ✅ Done & verified (baseline)
Core canvas engine, sorting, filtering (incl. set/quick/floating), editing+validation, selection+range, pin/resize/reorder, grouping+aggregation logic, pivot (basic), pagination, menus, side bar, CSV/xlsx export, sparklines, tooltips, state persistence, overlays, theming.

### Tier 1 — Closes the biggest adoption gaps (do first)

- [~] **T1.1 — DOM-overlay cell & header renderer system** *(highest impact, highest effort)* — **cell renderers landed**
  - [x] Recycled pool of absolutely-positioned Angular components composited over the canvas for visible component-cells only (`CellOverlayManager`).
  - [x] Driven by `CanvasRenderer.onAfterRender` so it stays in lockstep on scroll/resize/sort/filter/data; `PositionedColumn.x` handles pinned offset.
  - [x] `cellRenderer: MyComponent` (Angular class) + `cellRendererSelector`; AG-Grid-style `ICellRendererParams` / `ICellRendererAngularComp` (`agInit`/`refresh`). Validated in `Features/CustomComponents` story (interactive pill + star rating, click + `applyTransaction` from a cell).
  - [ ] Follow-ups: **custom DOM headers/filters** over the canvas (same layer); **pinned component columns** edge cases; function-returns-`HTMLElement` renderers; reduce first-paint flash of overlay cells.
  - Unlocks links, buttons, images, framework components in cells.
- [x] **T1.2 — Full keyboard navigation** — **landed**
  - [x] Arrow keys (clamp at edges), Tab/Shift-Tab (wrap rows), Home/End (row), Ctrl+Home/End (grid), PageUp/Down, Enter-to-edit, type-to-edit. Dispatch in `handleKeyDown` via shared `computeNextCell` helper (reused by editor-Tab `moveToNextCell`).
  - [x] Focused-cell state in `GridService` (`setFocusedCell`/`getFocusedCell`), mirroring the `cellRanges` pattern; visible focus ring drawn on canvas (`CanvasRenderer.drawFocusedCell` via `drawCellSelectionBorder`).
  - [x] `ensureIndexVisible` (auto/top/bottom) + `ensureColumnVisible`/`scrollToColumn` (center-column scroll math; pinned cols are no-ops). Click-to-focus via `onCellClick`.
  - [x] Validated: `grid.service.spec.ts` (Focus + Scroll API) + Storybook interaction (`play`) tests on the `Components/ArgentGrid` `KeyboardNavigation` / `KeyboardEditing` stories (run via `@storybook/test-runner`).
  - [ ] Follow-ups: cell-to-cell range extension on Shift+Arrow; focus traversal into pinned rows (top/bottom); damage-tracked partial repaint of focus ring (currently full `render()`).
- [x] **T1.3 — Named cell-renderer registry** — **landed**
  - [x] `cellRenderer: 'myRenderer'` (string) resolution shared by the canvas and the DOM overlay via `resolveNamedRenderer` (`render/cell-renderer-registry.ts`); a name → Angular component routes to the overlay, a name → string-returning function draws on canvas, an unknown/built-in name ('checkbox', 'rating') falls through to the canvas primitives unchanged.
  - [x] Two-layer resolution: per-grid `gridOptions.components` map (AG-Grid-compatible, takes precedence) over a process-wide global registry (`registerCellRenderer`/`unregisterCellRenderer`/`getGlobalCellRenderer`/`clearCellRendererRegistry`, exported from the public API). `cellRendererSelector` may also return a registered name.
  - [x] Validated: `cell-renderer-registry.spec.ts` + new resolution tests in `cells.spec.ts` (`usesComponentRenderer`/`resolveCellComponent`/`getFormattedValue`); `Features/NamedRenderers` story (`GlobalRegistry` + `PerGridComponents` precedence override).

### Tier 2 — High-frequency everyday features

- [x] **T2.1 — Auto-height rows + text wrapping** — **landed**
  - [x] Canvas text wrapping: `colDef.wrapText`/`autoHeight` draw greedy word-wrapped lines (newline-aware, long words char-broken) vertically centered and clipped to the row (`wrapLines`/`getTextLineHeight` in `render/cells.ts`); plain columns keep single-line + ellipsis.
  - [x] Variable row heights reuse the existing cumulative offset model: `updateRowHeightCache` now resolves each non-detail row's height fresh from the `gridOptions.getRowHeight` callback (AG-Grid-compatible), then an injected auto-height measurer, else the default; detail-row heights are preserved.
  - [x] Auto-height measurer wired in the component (`setupAutoRowHeight`): an offscreen 2D context measures the tallest wrapped `autoHeight` column per row (live column widths, clamped to ≥ default height), reusing `getCellValue`/`getFormattedValue`/`wrapLines`. Re-measures on column resize, theme change, and column-visibility re-init; the scrollbar/virtualization stay correct via `getTotalHeight`.
  - [x] Validated: `cells.spec.ts` (wrap word-boundary/newline/long-word/empty/zero-width + line-height); `grid.service.spec.ts` (getRowHeight callback, injected calculator, callback-over-calculator precedence, `recalculateRowHeights`, clearing). `Features/AutoHeightRows` story (wrapped summary/tags columns, resizable). Full suite 558 passing; build clean.
  - [ ] Follow-up: auto-height currently measures all displayed rows on each rebuild (fine for the client-side model / moderate data); lazy per-viewport measurement would be needed to pair auto-height with 1M-row datasets.
- [x] **T2.2 — Horizontal column virtualization** — **landed**
  - [x] `walkColumns` computes every center column's x in one pass and emits only the visible window plus a `columnBuffer` (renderer default 1) each side, so off-screen center columns are never drawn and fast horizontal scroll doesn't pop a blank column at the leading edge. (Re-baseline note: the unbuffered cull already existed but was untested and undocumented; this hardens it.)
  - [x] Center cells are now clipped to the center region in `renderRow` (drawn before the pinned columns), fixing a latent bug where a center column straddling/buffered under the pinned edge overdrew the pinned cells.
  - [x] Clipping extended consistently across the frame via a shared `clipCenter` helper: the range-selection box (center-only ranges; ranges touching a pinned column stay unclipped) and the keyboard focus ring (center cells) are clipped to the center region; the DOM cell-overlay layer clip-paths each center cell to the center region (`OverlayLayout.centerClip` → `CellOverlayManager.applyCenterClip`). Grid lines already region-filter their borders, so they needed no change.
  - [x] Validated: strengthened `walk.spec.ts` (off-screen center columns *excluded* both edges + `columnBuffer` behavior/clamping); `canvas-renderer.spec.ts` asserts the center clip rect for the cell pass and that the focus-ring/range passes clip center-only cases but not pinned ones; `cell-overlay-manager.spec.ts` asserts the per-cell `clip-path` (overflow clipped, fully-in-view unclipped, pinned never clipped).
  - [ ] Follow-up: O(log n) first-visible lookup via cumulative offsets for grids with thousands of columns (current scan is O(total center columns)/frame).
- [ ] **T2.3 — Master/Detail (real)** — embed actual nested grid/component in expanded detail rows (depends on T1.1).
- [ ] **T2.4 — Accessibility / ARIA pass** — off-screen DOM mirror of focused/visible rows with roles, so AT and a11y audits pass (often a procurement hard-requirement).

### Tier 3 — Scale & enterprise data

- [ ] **T3.1 — Infinite Row Model** — lazy block loading; smaller than SSRM, high value.
- [ ] **T3.2 — Server-Side Row Model (SSRM)** — server-side group/sort/filter, block cache. Gates "enterprise" positioning.
- [ ] **T3.3 — Tree Data** — path-based hierarchy; reuses grouping infrastructure.

### Tier 4 — Polish & differentiation

- [ ] **T4.1 — Group-row aggregation visuals** (inline agg values on group rows).
- [ ] **T4.2 — Status bar** (selection sum/count/avg).
- [ ] **T4.3 — Fill handle** (Excel-style drag-to-fill).
- [ ] **T4.4 — Integrated charts** from range selection.
- [ ] **T4.5 — Cell flashing** on data change.

---

## 🛠️ Implementation Strategy

1. **Hybrid Rendering**
   - DOM headers for drag-and-drop (Angular CDK) and native menus.
   - Canvas data viewport for performance; sync horizontal scroll between header and canvas.
   - **New:** recycled DOM-overlay layer (Tier 1) for component cells and accessibility mirror.

2. **State Management**
   - Centralized `GridService` as the single source of truth.
   - Partial canvas repaints via the damage tracker on state changes.

3. **Test-Driven Development**
   - Every UI feature gets a Playwright E2E test against an isolated Storybook story.
   - Logic changes verified by Vitest unit tests in `grid.service.spec.ts`.

---

## 📌 Known Discrepancies Corrected in This Re-baseline

- **Sparklines**: render correctly on canvas (previously a service helper looked stubbed — the real drawing lives in `render/primitives.ts`). Marked ✅.
- **Master/Detail**: previously "✅ Complete" — actual detail rows render placeholder text only. Downgraded to ⚠️.
- **Keyboard Navigation**: re-baseline found only editor keys + copy/paste (downgraded to ⚠️). **Now resolved** — full cell-to-cell navigation implemented in T1.2, marked ✅.
- **Custom Cell Renderers**: previously framed as supported — only canvas primitives + string-returning functions. No DOM/framework components. This is now Tier 1 priority.
- **Column Virtualization (horizontal)**: re-baseline marked this ❌ ("draws all visible columns"), but `walkColumns` already culled off-screen center columns at the draw level — the claim was stale. **Now resolved & hardened** in T2.2: the cull is buffered, the center region is clipped (fixing a pinned-overdraw bug), and both are covered by tests. Marked ✅.
- **Accessibility**: headers only; canvas content not exposed to assistive tech.
</content>
</invoke>
