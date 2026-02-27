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

## 🎨 Demo App Development

The repository includes a standalone Angular application for visual testing and performance benchmarking. It is configured to import `argent-grid` directly from the `src/` folder using TypeScript path mapping.

**Why this is better:**
- **No Build Step:** You don't need to run `npm run build` in the root every time you change the library.
- **HMR / Live Reload:** Changes in `src/` are detected by the Angular dev-server, triggering an immediate browser refresh.
- **Easier Debugging:** Sourcemaps point directly to your original library source code.

### Run Demo App

```bash
cd demo-app
npm install
npm start
```

Open [http://localhost:4200](http://localhost:4200) to view the demo.

### E2E Testing (Playwright)

argent-grid uses Playwright for end-to-end testing of visual and interactive features (like Canvas rendering, dragging, and menu interactions).

**Prerequisites:**
The demo app must be running (`npm start` inside `demo-app/`).

**Run Tests:**
```bash
cd demo-app
npx playwright test
```

This will execute the **Feature Guard Rails** suite which verifies:
- Row Grouping & Expansion
- Floating Filters
- Cell Editing (Enter/Escape/Tab)
- Column Pinning & Scroll Sync
- Column Re-ordering (Drag & Drop)

### Performance Benchmarking

ArgentGrid includes a built-in benchmarking suite to measure rendering efficiency, scroll performance, and memory overhead.

**Option 1: Interactive (UI)**
1. Start the demo app: `cd demo-app && npm start`
2. Open [http://localhost:4200](http://localhost:4200)
3. Click the **🚀 Benchmark** button in the header.
4. View real-time **ms frame** metrics and a detailed report covering initial render, scrolling, and selection updates.

**Option 2: Automated (CLI)**
To run the automated performance test and see results in your terminal:
```bash
cd demo-app
npx playwright test e2e/benchmark.spec.ts --reporter=list
```

-------------------------------------------
🚀 ArgentGrid Performance Benchmark Results
-------------------------------------------
Initial Render      : 2.60ms
Avg Scroll Frame    : 1.55ms
Selection All       : 103.70ms
Grouping Toggle     : 147.10ms
Total Test Time     : 495.60ms
-------------------------------------------

## License

MIT License - See [LICENSE](LICENSE) for details.

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## Acknowledgments

- [AG Grid](https://www.ag-grid.com/) for the API inspiration
- [Glide Data Grid](https://github.com/hyperledger-labs/glide-data-grid) for canvas rendering approach
- [TanStack Table](https://tanstack.com/table) for headless architecture concept
