/**
 * Theme System for Canvas Renderer
 *
 * Provides default theming and theme merging capabilities.
 */

import { GridTheme, PartialTheme } from './types';

// ============================================================================
// DEFAULT THEME
// ============================================================================

/**
 * Default grid theme matching common grid styling
 */
export const DEFAULT_THEME: GridTheme = {
  // === Background Colors ===
  bgCell: '#ffffff',
  bgCellEven: '#f8f9fa',
  bgHeader: '#f8f9fa',
  bgSelection: '#e3f2fd',
  bgHover: '#f0f2f5',
  bgGroupRow: '#f5f5f5',

  // === Text ===
  textCell: '#181d1f',
  textHeader: '#181d1f',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  fontSize: 13,
  fontWeight: 'normal',

  // === Borders ===
  borderColor: '#babed1',
  headerBorderColor: '#babed1',
  gridLineColor: '#babed1',

  // === Spacing ===
  cellPadding: 8,
  headerHeight: 32,
  rowHeight: 32,

  // === Group/Tree ===
  groupIndentWidth: 20,
  groupIndicatorSize: 12,
};

// ============================================================================
// DARK THEME
// ============================================================================

/**
 * Dark mode theme
 */
export const DARK_THEME: PartialTheme = {
  bgCell: '#1e1e1e',
  bgCellEven: '#252526',
  bgHeader: '#2d2d30',
  bgSelection: '#094771',
  bgHover: '#2a2d2e',
  bgGroupRow: '#252526',

  textCell: '#cccccc',
  textHeader: '#ffffff',
  
  borderColor: '#3c3c3c',
  headerBorderColor: '#3c3c3c',
  gridLineColor: '#3c3c3c',
};

// ============================================================================
// THEME UTILITIES
// ============================================================================

/**
 * Merge multiple themes together (later themes override earlier ones)
 */
export function mergeTheme(base: GridTheme, ...overrides: PartialTheme[]): GridTheme {
  if (overrides.length === 0) return base;

  let result = { ...base };
  
  for (const override of overrides) {
    if (override) {
      result = { ...result, ...override };
    }
  }
  
  return result;
}

/**
 * Create a font string from theme
 */
export function getFontFromTheme(theme: GridTheme): string {
  const weight = theme.fontWeight || 'normal';
  return `${weight} ${theme.fontSize}px ${theme.fontFamily}`;
}

/**
 * Create a row theme based on row state
 */
export function getRowTheme(
  baseTheme: GridTheme,
  options: {
    isSelected?: boolean;
    isHovered?: boolean;
    isEvenRow?: boolean;
    isGroup?: boolean;
  }
): PartialTheme {
  const { isSelected, isHovered, isEvenRow, isGroup } = options;

  if (isSelected) {
    return { bgCell: baseTheme.bgSelection };
  }
  
  if (isHovered) {
    return { bgCell: baseTheme.bgHover };
  }

  if (isGroup) {
    return { bgCell: baseTheme.bgGroupRow || baseTheme.bgHeader };
  }

  if (isEvenRow) {
    return { bgCell: baseTheme.bgCellEven };
  }

  return { bgCell: baseTheme.bgCell };
}

/**
 * Get cell background color based on state
 */
export function getCellBackgroundColor(
  theme: GridTheme,
  options: {
    isSelected?: boolean;
    isHovered?: boolean;
    isEvenRow?: boolean;
    isGroup?: boolean;
  }
): string {
  if (options.isSelected) return theme.bgSelection;
  if (options.isHovered) return theme.bgHover;
  if (options.isGroup) return theme.bgGroupRow || theme.bgHeader;
  if (options.isEvenRow) return theme.bgCellEven;
  return theme.bgCell;
}

// ============================================================================
// THEME PRESETS
// ============================================================================

/**
 * Predefined theme presets
 */
export const THEME_PRESETS: Record<string, PartialTheme> = {
  default: {},
  dark: DARK_THEME,
  compact: {
    rowHeight: 24,
    fontSize: 12,
    cellPadding: 4,
  },
  comfortable: {
    rowHeight: 40,
    fontSize: 14,
    cellPadding: 12,
  },
  blueAccent: {
    bgSelection: '#bbdefb',
    bgHover: '#e3f2fd',
    borderColor: '#90caf9',
    headerBorderColor: '#64b5f6',
  },
  greenAccent: {
    bgSelection: '#c8e6c9',
    bgHover: '#e8f5e9',
    borderColor: '#a5d6a7',
    headerBorderColor: '#81c784',
  },
};

/**
 * Get a theme by preset name
 */
export function getThemePreset(name: string): PartialTheme {
  return THEME_PRESETS[name] || {};
}

/**
 * Create a complete theme from a preset name and optional overrides
 */
export function createTheme(
  presetName: string = 'default',
  overrides?: PartialTheme
): GridTheme {
  const preset = getThemePreset(presetName);
  return mergeTheme(DEFAULT_THEME, preset, overrides || {});
}