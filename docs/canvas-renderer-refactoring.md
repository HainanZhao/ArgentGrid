# Canvas Renderer Refactoring Plan

Based on research of [Glide Data Grid](https://github.com/glideapps/glide-data-grid), this document outlines best practices and a refactoring plan for ArgentGrid's canvas renderer.

## Current State

The current `canvas-renderer.ts` is a monolithic ~600 line file handling:
- Canvas setup and DPR scaling
- Virtual scrolling
- Row/column rendering
- Hit testing
- Event handling
- Border drawing

While functional, it has limitations:
- All rendering happens in a single `doRender()` method
- No partial redraw support (redraws entire viewport every frame)
- No frame-to-frame optimization
- Tightly coupled concerns

## Best Practices from Glide Data Grid

### 1. Modular Architecture

Glide Data Grid separates concerns into focused modules:

```
render/
├── data-grid-render.ts        # Main orchestrator
├── data-grid-render.walk.ts   # Walker/iteration patterns
├── data-grid-render.blit.ts   # Blitting optimization
├── data-grid-render.cells.ts  # Cell rendering
├── data-grid-render.header.ts # Header rendering
├── data-grid-render.lines.ts  # Grid lines
└── draw-grid-arg.ts           # Type definitions
```

**Benefits:**
- Each module has a single responsibility
- Easy to test and debug individual components
- Clear separation of concerns

### 2. Walker Pattern

Instead of nested for-loops, use composable walker functions:

```typescript
// Bad: Nested loops are hard to optimize
for (let col of columns) {
  for (let row = startRow; row < endRow; row++) {
    // draw cell
  }
}

// Good: Walker pattern allows optimization and reusability
walkColumns(columns, cellYOffset, translateX, translateY, headerHeight, 
  (col, drawX, drawY, clipX, startRow) => {
    walkRowsInCol(startRow, drawY, height, rows, getRowHeight,
      (drawY, row, rowHeight, isSticky) => {
        // draw cell with all context pre-calculated
      });
  });
```

**Benefits:**
- Centralized iteration logic
- Easy to skip non-visible cells
- Reusable for different operations (draw, hit-test, measure)
- Pre-calculates drawing coordinates

### 3. Blitting Optimization

Reuse pixels from previous frame instead of redrawing everything:

```typescript
// Calculate scroll delta
const deltaX = currentScrollX - lastScrollX;
const deltaY = currentScrollY - lastScrollY;

// If only vertical scroll changed
if (deltaX === 0 && deltaY !== 0) {
  // Copy unchanged pixels
  ctx.drawImage(canvas, 0, 0, width, height - Math.abs(deltaY), 
                      0, deltaY > 0 ? deltaY : 0, width, height - Math.abs(deltaY));
  // Only redraw the newly visible strip
  drawRows(newStartRow, newEndRow);
}
```

**Benefits:**
- Dramatically reduces pixels drawn per frame
- Maintains 60fps even with millions of rows
- Works best with fixed row heights

### 4. Damage Tracking

Track which cells need redrawing:

```typescript
interface DamageRegion {
  columns: Set<number>;  // Column indices that changed
  rows: Set<number>;     // Row indices that changed
  cells: Set<[number, number]>; // Specific cells
}

// Only redraw damaged regions
if (damage.cells.size > 0) {
  for (const [col, row] of damage.cells) {
    drawCell(col, row);
  }
}
```

**Benefits:**
- Partial redraws for cell edits
- Efficient selection updates
- Minimal redraws for theme changes

### 5. Double Buffering

Use two canvases to avoid flicker:

```typescript
// Buffer A and B alternate each frame
let currentBuffer: 'a' | 'b' = 'a';

function render() {
  const ctx = currentBuffer === 'a' ? bufferACtx : bufferBCtx;
  
  // Draw to off-screen buffer
  drawGrid(ctx);
  
  // Copy to visible canvas
  displayCtx.drawImage(ctx.canvas, 0, 0);
  
  currentBuffer = currentBuffer === 'a' ? 'b' : 'a';
}
```

**Benefits:**
- Eliminates tearing during blit operations
- Smoother visual updates
- Required for complex blitting

### 6. Theme System

Hierarchical theme merging:

```typescript
interface Theme {
  bgCell?: string;
  bgHeader?: string;
  textHeader?: string;
  textCell?: string;
  borderColor?: string;
  fontFamily?: string;
  fontSize?: number;
  // ... more properties
}

// Merge themes at different levels
const cellTheme = mergeTheme(
  baseTheme,        // Grid default
  rowTheme,         // Row-specific (e.g., alternating colors)
  columnTheme,      // Column-specific overrides
  cellTheme         // Cell-specific overrides
);
```

**Benefits:**
- Flexible customization at any level
- Consistent styling
- Easy dark mode support

### 7. Prep/Draw Cycle for Cells

Optimize context state changes:

```typescript
// Per-column prep phase
let prepResult = prepColumn(ctx, col, theme);

// Per-row draw phase (reuses prepped state)
for (let row of visibleRows) {
  drawCell(ctx, prepResult, row, cell);
}

// Prep caches expensive operations
function prepColumn(ctx, col, theme): PrepResult {
  ctx.font = theme.font;  // Set once per column
  return { 
    col, 
    theme,
    // Cached measurements
  };
}
```

**Benefits:**
- Reduces context state changes
- Batches expensive operations
- Better cache utilization

---

## Refactoring Plan

### Phase 1: Modular Architecture

Create separate files under `src/lib/rendering/`:

```
rendering/
├── canvas-renderer.ts          # Main orchestrator (simplified)
├── render/
│   ├── types.ts                # Shared types and interfaces
│   ├── walk.ts                 # Walker functions
│   ├── blit.ts                 # Blitting optimization
│   ├── cells.ts                # Cell rendering
│   ├── lines.ts                # Grid lines rendering
│   └── theme.ts                # Theme definitions and merging
├── utils/
│   ├── damage-tracker.ts       # Damage region tracking
│   └── math.ts                 # Math utilities
```

### Phase 2: Implement Walker Pattern

Extract iteration logic into composable walkers:

```typescript
// render/walk.ts
export function walkColumns(
  columns: Column[],
  scrollX: number,
  viewportWidth: number,
  callback: (col: Column, x: number, width: number, isSticky: boolean) => void
): void;

export function walkRows(
  startRow: number,
  endRow: number,
  scrollY: number,
  rowHeight: number,
  callback: (row: number, y: number, height: number) => void
): void;

export function walkCells(
  columns: Column[],
  rows: { start: number; end: number },
  scroll: { x: number; y: number },
  callback: (col: Column, row: number, x: number, y: number, width: number, height: number) => void
): void;
```

### Phase 3: Add Blitting

Implement frame-to-frame optimization:

```typescript
// render/blit.ts
export interface BlitResult {
  regionsToDraw: Rectangle[];
  blitted: boolean;
}

export function blitLastFrame(
  ctx: CanvasRenderingContext2D,
  lastCanvas: HTMLCanvasElement,
  currentScroll: { x: number; y: number },
  lastScroll: { x: number; y: number },
  viewportSize: { width: number; height: number }
): BlitResult;
```

### Phase 4: Damage Tracking

Add partial redraw support:

```typescript
// utils/damage-tracker.ts
export class DamageTracker {
  private damagedCells: Set<string> = new Set();
  private damagedRows: Set<number> = new Set();
  private damagedColumns: Set<number> = new Set();
  private fullRedrawNeeded = false;

  markCellDirty(col: number, row: number): void;
  markRowDirty(row: number): void;
  markColumnDirty(col: number): void;
  markAllDirty(): void;
  
  getDirtyRegions(): DirtyRegions;
  clear(): void;
}
```

### Phase 5: Theme System

Create flexible theming:

```typescript
// render/theme.ts
export interface GridTheme {
  // Colors
  bgCell: string;
  bgCellEven: string;
  bgHeader: string;
  bgSelection: string;
  bgHover: string;
  
  // Text
  textCell: string;
  textHeader: string;
  fontFamily: string;
  fontSize: number;
  
  // Borders
  borderColor: string;
  headerBorderColor: string;
  
  // Spacing
  cellPadding: number;
  headerHeight: number;
  rowHeight: number;
}

export const DEFAULT_THEME: GridTheme = {
  bgCell: '#ffffff',
  bgCellEven: '#f8f9fa',
  bgHeader: '#f8f9fa',
  bgSelection: '#e3f2fd',
  bgHover: '#f0f2f5',
  textCell: '#181d1f',
  textHeader: '#181d1f',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  fontSize: 13,
  borderColor: '#babed1',
  headerBorderColor: '#babed1',
  cellPadding: 8,
  headerHeight: 32,
  rowHeight: 32,
};

export function mergeTheme(base: GridTheme, ...overrides: Partial<GridTheme>[]): GridTheme;
```

### Phase 6: Cell Rendering Optimization

Implement prep/draw cycle:

```typescript
// render/cells.ts
export interface CellDrawContext {
  ctx: CanvasRenderingContext2D;
  theme: GridTheme;
  column: Column;
  row: number;
  x: number;
  y: number;
  width: number;
  height: number;
  value: any;
  selected: boolean;
}

// Prep phase - called once per column
export function prepColumn(ctx: CanvasRenderingContext2D, col: Column, theme: GridTheme): ColumnPrepResult;

// Draw phase - called for each visible cell
export function drawCell(prep: ColumnPrepResult, cellCtx: CellDrawContext): void;
```

---

## Implementation Order

1. **Week 1: Foundation** ✅ COMPLETED
   - [x] Create folder structure
   - [x] Extract types to `types.ts`
   - [x] Create `theme.ts` with default theme
   - [x] Implement walker pattern (`walk.ts`)
   - [x] Implement blitting optimization (`blit.ts`)
   - [x] Create damage tracker (`damage-tracker.ts`)
   - [x] Implement cell rendering with prep/draw (`cells.ts`)
   - [x] Implement grid lines rendering (`lines.ts`)

2. **Week 2: Integration** (Next)
   - [ ] Refactor `canvas-renderer.ts` to use new modules
   - [ ] Integrate `DamageTracker` with selection changes
   - [ ] Add blitting support to scroll handler
   - [ ] Test performance improvements

3. **Week 3: Testing**
   - [ ] Unit tests for walker functions
   - [ ] Unit tests for damage tracker
   - [ ] Performance benchmarks
   - [ ] Visual regression tests

---

## Performance Targets

| Metric | Current | Target |
|--------|---------|--------|
| Initial render (1000 rows) | ~50ms | ~30ms |
| Scroll frame time | ~8ms | ~4ms |
| Selection update | Full redraw | Partial redraw |
| Cell edit redraw | Full redraw | Single cell |
| Memory per 100k rows | ~50MB | ~30MB |

---

## Testing Strategy

1. **Unit Tests**
   - Test walker functions independently
   - Test theme merging
   - Test damage tracking logic

2. **Performance Tests**
   - Benchmark scroll performance
   - Measure frame times
   - Compare before/after metrics

3. **Visual Tests**
   - Screenshot comparisons
   - Verify no visual regressions
   - Test edge cases (empty grid, single row, etc.)

---

## References

- [Glide Data Grid GitHub](https://github.com/glideapps/glide-data-grid)
- [Glide Data Grid Docs](https://docs.grid.glideapps.com/)
- [HTML Canvas Performance Tips](https://developer.mozilla.org/en-US/docs/Web/Performance/Canvas_performance)