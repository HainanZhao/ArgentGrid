# Migrating from AG Grid to ArgentGrid

ArgentGrid deliberately mirrors AG Grid's API names (`columnDefs`, `rowData`, `gridOptions`, `GridApi`, `ColDef`, `ICellRendererAngularComp`, …), so a lot of an AG Grid Angular app compiles with little change. But ArgentGrid renders the **data viewport on a Canvas** and supports the **client-side row model only**. Those two architectural choices — not API gaps — drive most of the migration work.

This guide is organized so you can triage quickly:

1. [Setup differences](#1-setup-differences) — selector, module, theme
2. [Architectural constraints](#2-architectural-constraints-must-design-around) — the things no option toggles away
3. [Not implemented / ignored](#3-not-implemented--silently-ignored) — replace or drop
4. [Implemented but behaves differently](#4-implemented-but-behaves-differently)
5. [Writing components](#5-writing-components-renderers-editors-detail) — the supported extension points
6. [What maps cleanly](#6-what-maps-cleanly)
7. [Checklist](#7-migration-checklist)

> Status legend: ✅ supported · ⚠️ partial · ❌ not implemented. Verified against the source; if you hit a discrepancy, the code is the source of truth.

---

## 1. Setup differences

| | AG Grid | ArgentGrid |
|---|---|---|
| Selector | `<ag-grid-angular>` | `<argent-grid>` (a compatibility directive also matches `ag-grid-angular`) |
| Module | `AgGridModule` | `ArgentGridModule` (NgModule; not standalone) |
| Theme | CSS file (`ag-theme-quartz.css`) + CSS custom properties | **programmatic theme object**: `[theme]="themeQuartz.withParams({...})"` |
| Inputs | `columnDefs`, `rowData`, `gridOptions`, `rowSelection` | same names ✅ (also `theme`, `height`, `width`, `rowHeight`) |
| Outputs | many `(…)` events | only `(gridReady)`, `(rowClicked)`, `(selectionChanged)` — see [§4](#events) |

```html
<!-- AG Grid -->
<ag-grid-angular class="ag-theme-quartz" [columnDefs]="cols" [rowData]="rows"></ag-grid-angular>

<!-- ArgentGrid -->
<argent-grid [columnDefs]="cols" [rowData]="rows" [theme]="theme"></argent-grid>
```

---

## 2. Architectural constraints (must design around)

These are inherent to the canvas + client-side design. No config flag changes them.

| Area | What breaks | What to do instead |
|---|---|---|
| **Cell DOM** ❌ | Cells are painted on canvas — there are **no `.ag-cell` DOM nodes**. Code/tests using `document.querySelector('.ag-cell')`, `[col-id=…]`, etc. find nothing. | Test via the **DOM header** (it's real DOM), via **component cells** (renderers/editors mount real DOM in the overlay layer), via the off-screen **`[role="gridcell"]` ARIA mirror** of visible cells, or via the public `GridApi`. |
| **Accessibility** ✅ | Canvas cells aren't real DOM, but the grid maintains an **off-screen ARIA mirror** of the visible rows (`role="row"`/`role="gridcell"` with `aria-rowindex`/`aria-colindex`/`aria-selected`), alongside `role="columnheader"` headers (`aria-sort`/`aria-colindex`) and a `role="grid"` root (`aria-rowcount`/`aria-colcount`/`aria-activedescendant`). Screen readers read cell values and keyboard nav announces the focused cell. | Works out of the box; set `gridOptions.ariaLabel` for a meaningful name. ⚠️ Grouped (multi-row) header nesting and horizontally-virtualized off-screen columns are follow-ups; opt out entirely with `gridOptions.suppressAccessibility`. |
| **Cell CSS** ❌ | `cellClass`, `cellClassRules`, full `cellStyle`, `::before/::after`, per-cell fonts/borders/backgrounds do not apply (canvas, not DOM). **Only `cellStyle.color` is read.** | Dynamic text color → `cellStyle: (p) => ({ color: … })`. Anything richer → a **component cell renderer** (real DOM in the overlay). |
| **Theming** | `ag-theme-*.css` and CSS-variable overrides don't apply. | Rebuild theming with the **theme object** (`themeQuartz.withParams(...)` / `withPart(...)`). |
| **Row models** ❌ | `rowModelType: 'serverSide' \| 'infinite' \| 'viewport'` are declared but **not implemented** — only `'clientSide'` works. No SSRM/infinite lazy loading; sort/filter/group are all client-side. | Load the dataset client-side (the canvas handles 1M+ rows), or page/chunk it yourself with `pagination`. Delegating to a backend isn't available. |

---

## 3. Not implemented / silently ignored

Declared in the types (so they compile) but **not read at runtime** — verify before relying on them.

**Sorting / filtering**
- ✅ `colDef.comparator` (custom sort) — **now honored** for field-bound columns; receives `(valueA, valueB, nodeA, nodeB, isDescending)` and the grid flips the sign for descending. (Columns that sort via `valueGetter` rather than `field` still fall back to default comparison.)
- ✅ `colDef.filter` = a **custom filter component** (`IFilterAngularComp`); `filterParams` are passed through to it (see [§5](#5-writing-components-renderers-editors-detail)).
- ❌ `filterValueGetter`, `getQuickFilterText`; `filterParams` on the *built-in* filters (text/number/date/set) is still ignored.

**Styling / row meta**
- ❌ `cellClass`, `cellClassRules` (see [§2](#2-architectural-constraints-must-design-around)).
- ❌ `rowClassRules`; `getRowClass`/`getRowStyle` are sparse.
- ❌ `enableCellChangeFlash`, `animateRows`.

**Columns**
- ❌ `lockPosition`, `suppressMovable`, `lockPinned`, `lockVisible`.
- ❌ `colSpan` / `spanRows` (cell spanning), `rowDrag`.
- ❌ `initial*` fields (`initialWidth`, `initialSort`, …) — no separate initial-vs-current state.

**Components / data**
- ✅ Custom **header components** (`headerComponent`) and custom **filter components** (`colDef.filter` = a component) — **now supported** (see [§5](#5-writing-components-renderers-editors-detail)). ⚠️ Custom **floating-filter** components (`floatingFilterComponent`) are not yet supported.
- ❌ **Tree data** (`treeData`, `getDataPath`, …).

**GridApi**
- ⚠️ `refreshCells` / `refreshRows` / `refreshHeader` are **no-ops** (canvas repaints from data automatically; use `applyTransaction` to push changes).
- ❌ `addEventListener` / `removeEventListener` (use callbacks/outputs — [§4](#events)).
- ❌ `applyTransactionAsync`, SSRM methods, public `getColumnState`/`applyColumnState`.
- ❌ Clipboard processors (`processCellForClipboard` / `processCellFromClipboard`).

---

## 4. Implemented but behaves differently

### Events
Subscribe via **`@Output()`** or **`gridOptions.on*` callbacks** — there is no `api.addEventListener`.

- Outputs: `(gridReady)`, `(rowClicked)`, `(selectionChanged)`.
- GridOptions callbacks: `onCellValueChanged`, `onCellClicked`, `onCellDoubleClicked`, `onCellContextMenu`.
- `onSortChanged` / `onFilterChanged` exist only as **imperative `GridApi` methods**, not subscribable events.
- ❌ Not emitted: `onColumnResized`, `onColumnMoved`, `onRowGroupOpened`, `onFirstDataRendered`. Use `(selectionChanged)` for selection.

### Clipboard
TSV only; header detection is a >50%-match heuristic; no CSV-dialect handling.

### Scroll API
`ensureIndexVisible` / `ensureColumnVisible` emit a state event the view layer acts on, rather than scrolling synchronously.

### Sorting/filtering
Custom **sort `comparator`s** are honored (field-bound columns). Built-in filters (text/number/date/boolean/set, quick + floating) work; **custom filter components** (`colDef.filter` = a component) are supported too. Custom *floating-filter* components are the remaining gap.

---

## 5. Writing components (renderers, editors, detail)

The DOM-overlay layer is where ArgentGrid hosts real Angular components over the canvas — it's the supported escape hatch for everything CSS/DOM can't do. All three contracts mirror AG Grid closely.

### Cell renderers ✅
A `cellRenderer` may be: an **Angular component class**, a **registered name** (string), a **string-returning function** (drawn on canvas), or a `cellRendererSelector`. **Not supported:** a function returning an `HTMLElement` / raw HTML string (HTML is stripped to text), or non-Angular (React/Vue/jQuery) wrappers, or `params.eGridCell`.

```ts
@Component({ /* … */ })
export class PillRenderer implements ICellRendererAngularComp {
  agInit(p: ICellRendererParams) { /* … */ }
  refresh(p: ICellRendererParams) { return true; } // pooled & rebound on scroll
}
// colDef: { cellRenderer: PillRenderer }   // or a registered name:
registerCellRenderer('pill', PillRenderer); // → cellRenderer: 'pill'
// per-grid: gridOptions.components = { pill: PillRenderer }  (takes precedence)
```

### Cell editors ✅ (custom Angular editors supported)
A `cellEditor` may be an **Angular component class**, a **registered name**, or a `cellEditorSelector`. The editor implements `ICellEditorAngularComp`; the grid runs the normal `valueParser → validation → valueSetter → onCellValueChanged → applyTransaction` pipeline on the value returned by `getValue()`.

```ts
@Component({ /* a <select>, date picker, etc. */ })
export class SelectEditor implements ICellEditorAngularComp {
  value = '';
  agInit(p: ICellEditorParams) {
    this.value = String(p.value ?? '');
    this.options = p.values;          // from cellEditorParams
    // p.charPress  → key that triggered type-to-edit
    // p.stopEditing(cancel?) → commit/cancel from inside (e.g. select onChange)
  }
  getValue() { return this.value; }    // raw/typed value, not a string
  afterGuiAttached() { /* focus your input */ }
  isPopup?() { return false; }
  isCancelAfterEnd?() { return false; } // return true to discard on commit
}
// colDef: { editable: true, cellEditor: SelectEditor, cellEditorParams: { values: [...] } }
```
Enter/Tab commit, Escape cancels, double-click / Enter / type-to-edit all open the editor. ✅ `valueParser`, `valueSetter`, `getValidationErrors` + `invalidEditValueMode`. ❌ AG Grid's `cellEditorPopupPosition` fine-positioning is not yet honored.

### Header components ✅ (custom Angular headers supported)
A `colDef.headerComponent` may be an **Angular component class** or a **registered name** (resolved through `gridOptions.components`). Headers are real DOM (not canvas), so the component mounts directly in the header cell. It implements `IHeaderAngularComp` and receives `IHeaderParams` — including `progressSort`/`setSort`, `showColumnMenu`/`showFilter`, the live `column` (read `column.sort` for the current direction), and any `headerComponentParams`. When a column has a custom header the grid disables its default sort-on-click, so the component drives sorting itself.

```ts
@Component({ /* label + sort button + arrow */ })
export class MyHeader implements IHeaderAngularComp {
  params!: IHeaderParams;
  agInit(p: IHeaderParams) { this.params = p; }
  refresh(p: IHeaderParams) { this.params = p; }   // called on sort/filter/column change
  get arrow() { return this.params.column.sort === 'asc' ? '▲'
                     : this.params.column.sort === 'desc' ? '▼' : ''; }
  sort(e: MouseEvent) { this.params.progressSort(e.shiftKey); }
}
// colDef: { headerComponent: MyHeader, headerComponentParams: { … } }
//   or a registered name: gridOptions.components = { myHeader: MyHeader } → headerComponent: 'myHeader'
```
❌ Custom header **group** components, and AG Grid's `headerComponentFramework`/`IHeader` menu-button auto-wiring, are not honored — the built-in resize handle / menu / filter affordances stay grid-managed alongside your component. See the `Features/HeaderComponents` story.

### Filter components ✅ (custom Angular filters supported)
Set `colDef.filter` to an **Angular component class** or a **registered name** (`gridOptions.components`). It implements `IFilterAngularComp` and receives `IFilterParams` — including `filterChangedCallback()` (call it when your filter state changes → the grid re-filters), `valueGetter(node)`/`getValue(node)`, and any `filterParams`. The instance is **created lazily and kept alive** for the column, so its UI state persists across popup opens (like AG Grid).

```ts
@Component({ /* your filter UI */ })
export class RangeFilter implements IFilterAngularComp {
  params!: IFilterParams; min: number | null = null; max: number | null = null;
  agInit(p: IFilterParams) { this.params = p; }
  isFilterActive() { return this.min != null || this.max != null; }   // drives the funnel-active state
  doesFilterPass(p: IDoesFilterPassParams) {                          // called per row while active
    const v = Number(this.params.getValue(p.node));
    return (this.min == null || v >= this.min) && (this.max == null || v <= this.max);
  }
  getModel() { return this.isFilterActive() ? { min: this.min, max: this.max } : null; }
  setModel(m: any) { this.min = m?.min ?? null; this.max = m?.max ?? null; }
  onChange() { this.params.filterChangedCallback(); }                 // re-filter
}
// colDef: { filter: RangeFilter, filterParams: { … } }
//   or registered: gridOptions.components = { rangeFilter: RangeFilter } → filter: 'rangeFilter'
```
The funnel-active indicator and **Clear Filter** integrate automatically (the grid writes a `{filterType:'custom'}` entry into the filter model and consults your live `doesFilterPass`). ⚠️ Two follow-ups: custom **floating-filter** components, and rehydrating a custom filter from a filter model restored *externally* (e.g. saved-state reload) before the popup is first opened. See the `Features/CustomFilters` story.

### Master/Detail ✅
Set `masterDetail: true` + `isRowMaster` and provide a `detailCellRenderer` (component class or registered name) implementing `IDetailCellRendererAngularComp`. It's hosted full-width over the expanded detail row and receives the master `data` + node. `detailRowHeight` is fixed (auto-height detail is a follow-up). Today you supply a first-column expand toggle (there's no canvas-drawn master chevron yet) — see the `Features/MasterDetail` story.

---

## 6. What maps cleanly

These work with the same config as AG Grid:

- `columnDefs` / `rowData` / `gridOptions` / `defaultColDef`, `getRowId`
- `valueGetter` / `valueFormatter` / `valueSetter` / `valueParser`
- `field`, `width`/`minWidth`/`maxWidth`, `pinned`, `hide`, `sortable`, `sort`, `sortIndex`, `comparator`
- `rowSelection` + `checkboxSelection` / `headerCheckboxSelection`
- Pagination API; quick / floating / **set** filters
- Row grouping + `aggFunc`; basic pivot; range selection
- `wrapText` + `autoHeight` (measured), `getRowHeight`
- CSV / true `.xlsx` export; LocalStorage state persistence
- Built-in canvas renderers usable by name: `checkbox`, `rating`, `button`, `badge`, `sparkline`, `progressBar`
- Custom **cell renderers**, **cell editors**, **header components**, **filter components**, and **master/detail** components (see [§5](#5-writing-components-renderers-editors-detail))
- **Accessibility**: `role="grid"`/`columnheader`/`row`/`gridcell` semantics via DOM headers + an off-screen ARIA row mirror — no extra config beyond `gridOptions.ariaLabel`

---

## 7. Migration checklist

- [ ] Swap `<ag-grid-angular>` → `<argent-grid>`, `AgGridModule` → `ArgentGridModule`.
- [ ] Replace the CSS theme with a `theme` object (`themeQuartz.withParams(...)`).
- [ ] Confirm you're on (or can fit) the **client-side row model** — no SSRM/infinite.
- [ ] Move cell styling off `cellClass`/`cellClassRules` → `cellStyle` (color) or a component renderer.
- [ ] Port custom **header components** to `IHeaderAngularComp` and custom **filter components** to `IFilterAngularComp` (both now supported); custom **sort `comparator`s** work as-is. (Custom *floating-filter* components remain a gap.)
- [ ] Port custom **cell editors** to `ICellEditorAngularComp` (now supported).
- [ ] Rewire events: `api.addEventListener` → `gridOptions.on*` callbacks / component `@Output()`s; drop reliance on un-emitted events.
- [ ] Re-point DOM-selector E2E tests (cells are canvas; assert via header / component cells / the off-screen `[role="gridcell"]` ARIA mirror / `GridApi`).
- [ ] Set `gridOptions.ariaLabel` for a meaningful accessible name (a11y otherwise works out of the box; `suppressAccessibility` opts out).
- [ ] Drop `refreshCells`/`refreshRows` calls — push data via `applyTransaction` instead.
