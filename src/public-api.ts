/**
 * ArgentGrid - Public API
 * A free, high-performance alternative to AG Grid Enterprise
 */

// Core types - AG Grid compatible
export * from './lib/types/ag-grid-types';

// Main grid component
export { ArgentGridComponent } from './lib/components/argent-grid.component';

// Canvas renderer
export { CanvasRenderer } from './lib/rendering/canvas-renderer';

// Directives
export { AgGridCompatibilityDirective } from './lib/directives/ag-grid-compatibility.directive';
export { ClickOutsideDirective } from './lib/directives/click-outside.directive';

// Components
export { SetFilterComponent } from './lib/components/set-filter/set-filter.component';

// Services
export { GridService } from './lib/services/grid.service';

// Modules
export { ArgentGridModule } from './lib/argent-grid.module';

// Theme System - New Theming API (AG Grid v32.2+ compatible)
export * from './lib/themes/types';
export { createTheme, extendTheme, mergeThemes, applyTheme, removeTheme } from './lib/themes/theme-builder';
export { themeQuartz } from './lib/themes/theme-quartz';
export { colorSchemeLight, colorSchemeDark, colorSchemeAuto, getColorScheme, COLOR_SCHEMES } from './lib/themes/parts/color-schemes';
export { iconSetQuartz, iconSetMaterial, iconSetMinimal, getIconSet, getIconSvg, ICON_SETS } from './lib/themes/parts/icon-sets';
