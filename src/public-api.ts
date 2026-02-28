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
// Canvas renderer
export { CanvasRenderer } from './lib/rendering/canvas-renderer';
// Live Data Optimizations
export { LiveDataOptimizations } from './lib/rendering/live-data-optimizations';
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
  createTheme,
  extendTheme,
  mergeThemes,
  removeTheme,
} from './lib/themes/theme-builder';
export { themeQuartz } from './lib/themes/theme-quartz';
// Theme System - New Theming API (AG Grid v32.2+ compatible)
export * from './lib/themes/types';
// Core types - AG Grid compatible
export * from './lib/types/ag-grid-types';
