/**
 * Color Scheme Parts
 * 
 * Predefined color schemes that can be mixed with any theme
 */

import type { ColorSchemePart, ThemeParameters } from '../types';

// ============================================================================
// LIGHT COLOR SCHEME
// ============================================================================

/**
 * Light color scheme parameters
 */
const LIGHT_SCHEME_PARAMS: ThemeParameters = {
  backgroundColor: '#ffffff',
  foregroundColor: '#181d1f',
  secondaryForegroundColor: '#666666',
  headerBackgroundColor: '#f5f5f5',
  rowBackgroundColor: '#ffffff',
  rowEvenBackgroundColor: '#fafafa',
  rowHoverBackgroundColor: '#f0f0f0',
  rowSelectedBackgroundColor: '#e3f2fd',
  cellHoverBackgroundColor: '#f5f5f5',
  groupRowBackgroundColor: '#fafafa',
  borderColor: '#dcdcdc',
  iconColor: '#181d1f',
};

/**
 * Light color scheme part
 * 
 * @example
 * ```typescript
 * import { themeQuartz, colorSchemeLight } from 'argent-grid';
 * 
 * const myTheme = themeQuartz.withPart(colorSchemeLight);
 * ```
 */
export const colorSchemeLight: ColorSchemePart = {
  name: 'color-scheme-light',
  type: 'color-scheme',
  scheme: 'light',
  params: LIGHT_SCHEME_PARAMS,
};

// ============================================================================
// DARK COLOR SCHEME
// ============================================================================

/**
 * Dark color scheme parameters
 */
const DARK_SCHEME_PARAMS: ThemeParameters = {
  backgroundColor: '#1e1e1e',
  foregroundColor: '#e0e0e0',
  secondaryForegroundColor: '#a0a0a0',
  headerBackgroundColor: '#2d2d30',
  rowBackgroundColor: '#1e1e1e',
  rowEvenBackgroundColor: '#252526',
  rowHoverBackgroundColor: '#2a2d2e',
  rowSelectedBackgroundColor: '#094771',
  cellHoverBackgroundColor: '#2a2d2e',
  groupRowBackgroundColor: '#252526',
  borderColor: '#3c3c3c',
  iconColor: '#e0e0e0',
};

/**
 * Dark color scheme part
 * 
 * @example
 * ```typescript
 * import { themeQuartz, colorSchemeDark } from 'argent-grid';
 * 
 * const myTheme = themeQuartz.withPart(colorSchemeDark);
 * ```
 */
export const colorSchemeDark: ColorSchemePart = {
  name: 'color-scheme-dark',
  type: 'color-scheme',
  scheme: 'dark',
  params: DARK_SCHEME_PARAMS,
};

// ============================================================================
// AUTO COLOR SCHEME
// ============================================================================

/**
 * Auto color scheme (follows system preference)
 * 
 * Note: This requires JavaScript to detect system preference
 * and apply the appropriate scheme
 */
export const colorSchemeAuto = {
  name: 'color-scheme-auto',
  type: 'color-scheme' as const,
  scheme: 'auto' as const,
  
  /**
   * Get the appropriate scheme based on system preference
   */
  getScheme(): ColorSchemePart {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      return prefersDark ? colorSchemeDark : colorSchemeLight;
    }
    return colorSchemeLight;
  },
};

// ============================================================================
// EXPORTS
// ============================================================================

/**
 * All available color schemes
 */
export const COLOR_SCHEMES: Record<string, ColorSchemePart> = {
  light: colorSchemeLight,
  dark: colorSchemeDark,
  auto: colorSchemeAuto as any,
};

/**
 * Get color scheme by name
 */
export function getColorScheme(name: string): ColorSchemePart | undefined {
  return COLOR_SCHEMES[name];
}
