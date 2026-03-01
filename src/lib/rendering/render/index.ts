/**
 * Rendering Module Index
 *
 * Exports all rendering-related modules.
 */

// Live data optimizations
export { LiveDataOptimizations } from '../live-data-optimizations';
// Rendering primitives
export { drawCheckbox, drawGroupIndicator, drawSparkline } from './primitives';
// Hit testing
export * from './hit-test';
// Column utilities
export * from './column-utils';
// Blitting optimization
export {
  BlitState,
  blitLastFrame,
  calculateBlit,
  createBufferPair,
  displayBuffer,
  MAX_BLIT_DELTA_RATIO,
  MIN_BLIT_DELTA,
  resizeBufferPair,
  shouldBlit,
  swapBuffers,
} from './blit';
// Cell rendering (explicit exports to avoid conflicts)
export {
  calculateColumnWidth,
  drawCell,
  drawCellBackground,
  drawCellContent,
  drawGroupIndicators,
  getFormattedValue,
  getValueByPath,
  measureText,
  prepColumn,
  prepColumns,
  renderRow,
  truncateText,
} from './cells';
// Grid lines
export {
  drawBorder,
  drawCellSelectionBorder,
  drawColumnLines,
  drawCrispLine,
  drawGridLines,
  drawHorizontalLine,
  drawPinnedRegionBorders,
  drawPinnedRegionShadows,
  drawRangeSelectionBorder,
  drawRowLines,
  drawVerticalLine,
  getColumnBorderPositions,
} from './lines';
// Theme (re-export the DEFAULT_THEME and utilities)
export {
  createTheme,
  DARK_THEME,
  DEFAULT_THEME,
  getCellBackgroundColor,
  getFontFromTheme,
  getRowTheme,
  getThemePreset,
  mergeTheme,
  THEME_PRESETS,
} from './theme';
// Types (base definitions)
export {
  BlitResult,
  BufferPair,
  CellDrawContext,
  CellWalkCallback,
  ColumnPrepResult,
  ColumnWalkCallback,
  DamageType,
  DirtyRegions,
  GridMouseEvent,
  GridTheme,
  HitTestResult,
  PartialTheme,
  Point,
  PositionedColumn,
  Rectangle,
  RenderState,
  RowWalkCallback,
  ScrollPosition,
  Size,
  VisibleRange,
} from './types';
// Walker functions
export {
  calculateVisibleRange,
  getColumnAtX,
  getColumnIndex,
  getPinnedWidths,
  getPositionedColumns,
  getRowAtY,
  getRowY,
  getTotalColumnWidth,
  getVisibleRowRange,
  isRowVisible,
  walkCells,
  walkColumns,
  walkRows,
} from './walk';
