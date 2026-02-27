/**
 * Rendering Types for Canvas Renderer
 *
 * Shared type definitions used across the rendering modules.
 */

import { Column, IRowNode, ColDef, GridApi } from '../../types/ag-grid-types';

// ============================================================================
// CORE RENDERING TYPES
// ============================================================================

/**
 * Rectangle for drawing operations
 */
export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Point for coordinate operations
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * Size dimensions
 */
export interface Size {
  width: number;
  height: number;
}

/**
 * Scroll position
 */
export interface ScrollPosition {
  x: number;
  y: number;
}

// ============================================================================
// COLUMN WALKER TYPES
// ============================================================================

/**
 * Column with computed position for rendering
 */
export interface PositionedColumn {
  column: Column;
  x: number;
  width: number;
  isPinned: boolean;
  pinSide?: 'left' | 'right';
}

/**
 * Callback for column walker
 */
export type ColumnWalkCallback = (
  column: Column,
  x: number,
  width: number,
  isPinned: boolean,
  pinSide?: 'left' | 'right'
) => void;

/**
 * Callback for row walker
 */
export type RowWalkCallback = (
  rowIndex: number,
  y: number,
  height: number,
  rowNode: IRowNode | null
) => void;

/**
 * Callback for cell walker
 */
export type CellWalkCallback = (
  column: Column,
  rowIndex: number,
  x: number,
  y: number,
  width: number,
  height: number,
  rowNode: IRowNode | null
) => void;

// ============================================================================
// CELL RENDERING TYPES
// ============================================================================

/**
 * Context for drawing a single cell
 */
export interface CellDrawContext<TData = any> {
  ctx: CanvasRenderingContext2D;
  theme: GridTheme;
  column: Column;
  colDef: ColDef<TData> | null;
  rowNode: IRowNode<TData>;
  rowIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
  value: any;
  formattedValue: string;
  isSelected: boolean;
  isHovered: boolean;
  isEvenRow: boolean;
}

/**
 * Result of column prep phase
 */
export interface ColumnPrepResult<TData = any> {
  column: Column;
  colDef: ColDef<TData> | null;
  theme: GridTheme;
  font: string;
}

// ============================================================================
// BLIT TYPES
// ============================================================================

/**
 * Result of a blit operation
 */
export interface BlitResult {
  /** Whether blitting was performed (false = full redraw needed) */
  blitted: boolean;
  /** Regions that still need to be drawn */
  regionsToDraw: Rectangle[];
  /** Horizontal scroll delta */
  deltaX: number;
  /** Vertical scroll delta */
  deltaY: number;
}

/**
 * Buffer pair for double buffering
 */
export interface BufferPair {
  front: HTMLCanvasElement;
  back: HTMLCanvasElement;
  frontCtx: CanvasRenderingContext2D;
  backCtx: CanvasRenderingContext2D;
}

// ============================================================================
// DAMAGE TRACKING TYPES
// ============================================================================

/**
 * Types of damage that can occur
 */
export type DamageType = 'full' | 'row' | 'column' | 'cell';

/**
 * Dirty region specification
 */
export interface DirtyRegions {
  /** Full redraw required */
  full: boolean;
  /** Specific row indices that changed */
  rows: Set<number>;
  /** Specific column indices that changed */
  columns: Set<number>;
  /** Specific cells (col,row) that changed */
  cells: Set<string>; // Format: "col,row"
}

// ============================================================================
// THEME TYPES
// ============================================================================

/**
 * Grid theme configuration
 */
export interface GridTheme {
  // === Background Colors ===
  bgCell: string;
  bgCellEven: string;
  bgHeader: string;
  bgSelection: string;
  bgHover: string;
  bgGroupRow?: string;

  // === Text ===
  textCell: string;
  textHeader: string;
  fontFamily: string;
  fontSize: number;
  fontWeight?: string;

  // === Borders ===
  borderColor: string;
  headerBorderColor: string;
  gridLineColor?: string;

  // === Spacing ===
  cellPadding: number;
  headerHeight: number;
  rowHeight: number;

  // === Group/Tree ===
  groupIndentWidth: number;
  groupIndicatorSize: number;
}

/**
 * Partial theme for overriding
 */
export type PartialTheme = Partial<GridTheme>;

// ============================================================================
// RENDER STATE TYPES
// ============================================================================

/**
 * Current render state
 */
export interface RenderState {
  scrollTop: number;
  scrollLeft: number;
  viewportWidth: number;
  viewportHeight: number;
  totalRowCount: number;
  rowHeight: number;
  dpr: number;
}

/**
 * Visible range calculation result
 */
export interface VisibleRange {
  startRow: number;
  endRow: number;
  startColumnIndex: number;
  endColumnIndex: number;
}

// ============================================================================
// HIT TEST TYPES
// ============================================================================

/**
 * Hit test result
 */
export interface HitTestResult {
  rowIndex: number;
  columnIndex: number;
  column: Column | null;
  rowNode: IRowNode | null;
  hitArea: 'cell' | 'header' | 'groupIndicator' | 'empty';
}

// ============================================================================
// EVENT TYPES
// ============================================================================

/**
 * Mouse event with hit test info
 */
export interface GridMouseEvent {
  originalEvent: MouseEvent;
  hitTest: HitTestResult;
  canvasX: number;
  canvasY: number;
}