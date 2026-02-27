# ArgentGrid Demo App

Live demo showcasing the canvas-based high-performance Angular grid.

## Quick Start

```bash
# Install dependencies
npm install

# Start dev server
npm start

# Build for production
npm run build

# Build for GitHub Pages
npm run build:gh-pages
```

## Demo Features

- **100K rows** - Standard load test
- **500K rows** - Heavy load test  
- **1M rows** - Extreme stress test
- **Real-time FPS** - Monitor rendering performance
- **Canvas rendering** - Zero DOM overhead

## Live Demo

https://hainanzhao.github.io/ArgentGrid/

## Tech Stack

- Angular 18
- Canvas 2D API
- RequestAnimationFrame for 60fps
- Zero dependencies beyond Angular

## Performance Targets

| Rows | Load Time | FPS | Memory |
|------|-----------|-----|--------|
| 100K | < 500ms | 60 | ~50MB |
| 500K | < 2s | 60 | ~150MB |
| 1M | < 5s | 55-60 | ~300MB |
