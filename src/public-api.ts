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

// Services
export { GridService } from './lib/services/grid.service';

// Modules
export { ArgentGridModule } from './lib/argent-grid.module';
