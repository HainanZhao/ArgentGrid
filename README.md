# ArgentGrid

A **free, high-performance** alternative to AG Grid Enterprise built with Angular and Canvas rendering.

## 🌐 Live Demo

Check out the interactive demo: **[https://hainanzhao.github.io/ArgentGrid/](https://hainanzhao.github.io/ArgentGrid/)**

The demo showcases:
- Canvas-based rendering with 100,000+ rows
- Virtual scrolling
- Sorting, filtering, and selection
- Cell editing
- Column and row pinning
- Excel/CSV export

## Features

- 🚀 **High Performance**: Canvas-based rendering for 100,000+ rows at 60fps
- 🎯 **AG Grid Compatible**: Drop-in replacement with 1:1 API compatibility
- 📦 **Angular Native**: Built with Angular 18+ using modern best practices
- 🧪 **TDD Developed**: Comprehensive test coverage with Vitest
- 🎨 **Hybrid Architecture**: Canvas viewport + DOM headers for accessibility

## ⚖️ Feature Parity

For a detailed comparison with AG Grid and our development roadmap, see:
**[plan](./plan.md)**

## Installation

```bash
npm install argent-grid
```

## Requirements

- Angular 18+
- TypeScript 5.4+

## Quick Start

### Basic Usage

```typescript
import { Component } from '@angular/core';
import { ColDef } from 'argent-grid';

interface RowData {
  id: number;
  name: string;
  age: number;
}

@Component({
  selector: 'app-root',
  template: `
    <argent-grid
      [columnDefs]="columnDefs"
      [rowData]="rowData"
      [rowHeight]="32"
      height="600px">
    </argent-grid>
  `
})
export class AppComponent {
  columnDefs: ColDef<RowData>[] = [
    { colId: 'id', field: 'id', headerName: 'ID', width: 100 },
    { colId: 'name', field: 'name', headerName: 'Name', width: 150 },
    { colId: 'age', field: 'age', headerName: 'Age', width: 80, sortable: true }
  ];

  rowData: RowData[] = [
    { id: 1, name: 'John Doe', age: 30 },
    { id: 2, name: 'Jane Smith', age: 25 }
  ];
}
```

### Module Import

```typescript
import { NgModule } from '@angular/core';
import { ArgentGridModule } from 'argent-grid';

@NgModule({
  imports: [
    ArgentGridModule
  ]
})
export class AppModule {}
```

## Architecture

### Hybrid Rendering Approach

```
┌─────────────────────────────────────┐
│  Header Layer (DOM-based)           │  ← Accessibility, Styling
├─────────────────────────────────────┤
│  Canvas Layer (Data Viewport)       │  ← High-performance rendering
│  - 100,000+ rows                    │
│  - 60fps scrolling                  │
│  - Virtual scrolling                │
└─────────────────────────────────────┘
```

### Core Components

- **ArgentGridComponent**: Main grid component
- **CanvasRenderer**: High-performance canvas painting engine
- **GridService**: Headless logic layer for data management
- **AgGridCompatibilityDirective**: AG Grid API compatibility layer

## Development

### Setup

```bash
npm install
```

### Build

```bash
npm run build
```

### Test

```bash
npm test           # Run tests
npm run test:watch # Watch mode
npm run test:coverage # With coverage
```

### Lint

```bash
npm run lint
```

## 🎨 Storybook Development

ArgentGrid uses **Storybook** for component development, documentation, and visual testing. Each feature (Sorting, Grouping, Theming, etc.) is documented as an isolated story.

### Run Storybook

```bash
# Start Storybook dev server
npm run storybook
```

Open [http://localhost:6006](http://localhost:6006) to view the stories and interact with the grid.

### Build Storybook

```bash
# Build static Storybook site
npm run build-storybook
```

Output will be in the `./storybook-static` directory.

### E2E Testing (Playwright)

ArgentGrid uses Playwright for end-to-end testing against the Storybook stories. These tests verify visual rendering, interactivity (dragging, resizing), and complex logic (filtering, grouping).

**Run Tests:**
```bash
# Run all E2E tests
npm run test:e2e
```

This will execute the **Feature Guard Rails** suite which verifies:
- Row Grouping & Expansion
- Floating Filters
- Cell Editing
- Column Pinning & Scroll Sync
- Column Re-ordering (Drag & Drop)

### Visual Regression Testing

Since ArgentGrid renders its core data area using HTML5 Canvas, we use **Visual Regression Testing** to ensure consistent rendering and catch pixel-level regressions.

**Run Visual Tests:**
```bash
npx playwright test e2e/visual.spec.ts
```

**Updating Snapshots:**
If you have made intentional UI changes (e.g., changed selection colors, refined border logic, or adjusted header padding) and the visual tests fail, you must update the baseline snapshots:

```bash
npx playwright test e2e/visual.spec.ts --update-snapshots
```

*Note: Ensure your local environment is clean and Storybook is correctly built before updating snapshots. Baseline snapshots are committed to the repository to serve as the source of truth for CI.*

### Performance Benchmarking

ArgentGrid includes a benchmarking suite to measure rendering efficiency and scroll performance under heavy load (100,000+ rows).

**Option 1: Interactive (UI)**
1. Start Storybook: `npm run storybook`
2. Open [http://localhost:6006](http://localhost:6006)
3. Navigate to **Features / Benchmark**
4. View real-time **ms frame** metrics and a detailed report.

Available benchmark stories:
- `Benchmark10K` (quick sanity check)
- `Benchmark100K` (default large-dataset benchmark)
- `Benchmark500K` (heavy stress test)
- `Benchmark1M` (extreme stress test)

**Option 2: Automated (CLI)**
To run the automated benchmark suite:
```bash
npx playwright test e2e/benchmark.spec.ts --reporter=list
```

----------------------------------------------
🚀 ArgentGrid Performance Benchmark Results
----------------------------------------------
Metrics reported by the benchmark runner: (100K rows on MacBook Pro M2 + 16GB)
- Initial Render: 0.2ms
- Selection Update: 113.8ms
- Grouping Toggle: 101.6ms
- Avg Scroll Frame: 0.67ms
- Total (ms): 820ms


Note: Results vary by machine, browser, and thermal state. For CI comparisons,
track deltas between runs rather than absolute values.

## License

MIT License - See [LICENSE](LICENSE) for details.

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## Acknowledgments

- [AG Grid](https://www.ag-grid.com/) for the API inspiration
- [Glide Data Grid](https://github.com/hyperledger-labs/glide-data-grid) for canvas rendering approach
- [TanStack Table](https://tanstack.com/table) for headless architecture concept
