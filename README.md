# ArgentGrid

> ⚠️ **WORK IN PROGRESS** - This project is under active development. The API is not stable and some features are not yet implemented. Use at your own risk in production environments.

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
- 🧪 **TDD Developed**: Comprehensive test coverage with Jest
- 🎨 **Hybrid Architecture**: Canvas viewport + DOM headers for accessibility

## Feature Parity Comparison

| Feature | AG Grid Community | AG Grid Enterprise | **ArgentGrid (Current)** |
| :--- | :--- | :--- | :--- |
| **Rendering Engine** | DOM-based | DOM-based | **Canvas-based** |
| **Data Volume Limit** | ~100k rows | Millions (SSRM) | **1M+ rows (Client-side)** |
| **Sorting & Filtering**| Yes | Yes | **Yes** |
| **Row Grouping** | No | Yes | **Yes (Basic Hierarchical)** |
| **Aggregation** | No | Yes | **Yes (Sum/Avg/Min/Max/Count)** |
| **Export** | CSV only | .xlsx | **HTML-based Excel & CSV** |
| **Selection** | Row only | Range | **Row (Checkbox/Multi)** |
| **Header Menus** | Basic | Advanced | **Planned (Phase IV)** |
| **Context Menus** | No | Yes | **Planned (Phase IV)** |
| **Drag/Drop Columns**| Yes | Yes | **Planned (Phase IV)** |
| **Pivoting** | No | Yes | **Planned (Phase V)** |

## Installation

```bash
npm install argentgrid
```

## Requirements

- Angular 18+
- TypeScript 5.4+

## Quick Start

### Basic Usage

```typescript
import { Component } from '@angular/core';
import { ColDef } from 'argentgrid';

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
import { ArgentGridModule } from 'argentgrid';

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

The repository includes a standalone Angular application for visual testing and performance benchmarking. It is configured to import `argentgrid` directly from the `src/` folder using TypeScript path mapping.

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

ArgentGrid uses Playwright for end-to-end testing of visual and interactive features (like Canvas rendering, dragging, and menu interactions).

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

## Roadmap

### Phase I: API Extraction ✅
- [x] Map AG Grid TypeScript interfaces
- [x] Create compatible type definitions

### Phase II: Core Implementation ✅
- [x] Bootstrap Angular library
- [x] Canvas renderer setup
- [x] Basic GridService implementation
- [x] Virtual scrolling optimization (100,000+ rows)

## 🎉 Phase III: Features - COMPLETE!

All core features implemented:
- [x] Basic sorting (client-side)
- [x] Filtering (text, number, date, boolean)
- [x] Row Grouping (hierarchical, with aggregations)
- [x] Cell Editing (inline, with valueParser/valueSetter)
- [x] Column Pinning (left/right sticky columns)
- [x] Row Pinning (top/bottom pinned rows)
- [x] Selection (full implementation with checkbox)
- [x] Aggregation (sum, avg, min, max, count, custom)
- [x] Excel/CSV Export (with formatting options)

### Phase IV: Advanced Features
- [ ] Pivot Tables
- [ ] Tree Data
- [ ] Master/Detail
- [ ] Integrated Charts
- [ ] Excel Export

### Future Considerations
- [ ] Web Workers for background processing (deprioritized - current virtual scrolling handles 100k rows efficiently)

## Performance Targets

| Dataset Size | Target FPS | Status |
|-------------|------------|--------|
| 1,000 rows  | 60 fps     | ✅     |
| 10,000 rows | 60 fps     | ✅     |
| 100,000 rows| 60 fps     | ✅ (virtual scrolling) |

## License

MIT License - See [LICENSE](LICENSE) for details.

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## Acknowledgments

- [AG Grid](https://www.ag-grid.com/) for the API inspiration
- [Glide Data Grid](https://github.com/hyperledger-labs/glide-data-grid) for canvas rendering approach
- [TanStack Table](https://tanstack.com/table) for headless architecture concept
