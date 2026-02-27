/**
 * Rendering Module Index
 *
 * Exports all rendering-related modules.
 */

// Types (base definitions)
export {
  Rectangle,
  Point,
  Size,
  ScrollPosition,
  PositionedColumn,
  ColumnWalkCallback,
  RowWalkCallback,
  CellWalkCallback,
  CellDrawContext,
  ColumnPrepResult,
  BlitResult,
  BufferPair,
  DamageType,
  DirtyRegions,
  GridTheme,
  PartialTheme,
  RenderState,
  VisibleRange,
  HitTestResult,
  GridMouseEvent,
} from './types';

// Theme (re-export the DEFAULT_THEME and utilities)
export {
  DEFAULT_THEME,
  DARK_THEME,
  THEME_PRESETS,
  mergeTheme,
  getFontFromTheme,
  getRowTheme,
  getCellBackgroundColor,
  getThemePreset,
  createTheme,
} from './theme';

// Walker functions
export {
  walkColumns,
  getPositionedColumns,
  getPinnedWidths,
  walkRows,
  getVisibleRowRange,
  getRowY,
  walkCells,
  getColumnAtX,
  getColumnIndex,
  getTotalColumnWidth,
  getRowAtY,
  isRowVisible,
  calculateVisibleRange,
} from './walk';

// Blitting optimization
export {
  MIN_BLIT_DELTA,
  MAX_BLIT_DELTA_RATIO,
  shouldBlit,
  calculateBlit,
  blitLastFrame,
  createBufferPair,
  swapBuffers,
  displayBuffer,
  resizeBufferPair,
  BlitState,
} from './blit';

// Cell rendering (explicit exports to avoid conflicts)
export {
  prepColumn,
  prepColumns,
  drawCell,
  drawCellBackground,
  drawCellContent,
  drawGroupIndicators,
  truncateText,
  measureText,
  calculateColumnWidth,
  getFormattedValue,
  getValueByPath,
  renderRow,
} from './cells';

// Grid lines
export {
  drawCrispLine,
  drawHorizontalLine,
  drawVerticalLine,
  drawRowLines,
  drawColumnLines,
  getColumnBorderPositions,
  drawGridLines,
  drawBorder,
  drawCellSelectionBorder,
  drawRangeSelectionBorder,
  drawPinnedRegionBorders,
  drawPinnedRegionShadows,
} from './lines';