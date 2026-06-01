/**
 * ArgentGrid - Public API
 * A free, high-performance alternative to AG Grid Enterprise
 */

// Modules
export { ArgentGridModule } from './lib/argent-grid.module';

// Main grid component
export { ArgentGridComponent } from './lib/components/argent-grid.component';
// Components
export { SetFilterComponent } from './lib/components/set-filter/set-filter.component';

// Directives
export { AgGridCompatibilityDirective } from './lib/directives/ag-grid-compatibility.directive';
export { ClickOutsideDirective } from './lib/directives/click-outside.directive';
export { ArgentHeaderOutletDirective } from './lib/directives/header-outlet.directive';
export type { AriaRowMirrorDeps } from './lib/rendering/aria-row-mirror';
// Accessibility: off-screen ARIA mirror of the visible rows
export { AriaRowMirror } from './lib/rendering/aria-row-mirror';
// Canvas renderer
export { CanvasRenderer } from './lib/rendering/canvas-renderer';
// Cell overlay manager (DOM/Angular custom cell renderers)
export { CellOverlayManager } from './lib/rendering/cell-overlay-manager';
export type {
  InfiniteRowModelConfig,
  InfiniteRowModelDeps,
  LoadingRowNode,
} from './lib/rendering/infinite-row-model';
// Infinite Row Model (rowModelType: 'infinite' — lazy block-loading datasource)
export { DEFAULT_INFINITE_CONFIG, InfiniteRowModel } from './lib/rendering/infinite-row-model';
// Live Data Optimizations
export { LiveDataOptimizations } from './lib/rendering/live-data-optimizations';
// Named cell-renderer registry (T1.3)
export {
  type CellRendererComponents,
  type CellRendererEntry,
  clearCellRendererRegistry,
  getGlobalCellRenderer,
  registerCellRenderer,
  resolveNamedRenderer,
  unregisterCellRenderer,
} from './lib/rendering/render/cell-renderer-registry';
// Services
export { GridService } from './lib/services/grid.service';
export {
  COLOR_SCHEMES,
  colorSchemeAuto,
  colorSchemeDark,
  colorSchemeLight,
  getColorScheme,
} from './lib/themes/parts/color-schemes';
export {
  getIconSet,
  getIconSvg,
  ICON_SETS,
  iconSetMaterial,
  iconSetMinimal,
  iconSetQuartz,
} from './lib/themes/parts/icon-sets';
export {
  applyTheme,
  applyThemeCSSVariables,
  convertThemeToGridTheme,
  createTheme,
  extendTheme,
  getThemeCSSVariables,
  mergeThemes,
  removeTheme,
} from './lib/themes/theme-builder';
export { themeQuartz } from './lib/themes/theme-quartz';
// Theme System - New Theming API (AG Grid v32.2+ compatible)
export * from './lib/themes/types';
// Core types - AG Grid compatible
export * from './lib/types/ag-grid-types';
