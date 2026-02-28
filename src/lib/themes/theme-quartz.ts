/**
 * Quartz Theme - Modern, high-contrast theme
 * Recommended for most applications
 */

import { createTheme } from './theme-builder';
import type { ThemeParameters } from './types';

// Default Quartz theme parameters
const QUARTZ_DEFAULTS: ThemeParameters = {
  // Colors
  accentColor: '#1976d2',
  backgroundColor: '#ffffff',
  foregroundColor: '#181d1f',
  secondaryForegroundColor: '#666666',

  // Typography
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  fontSize: 14,
  fontWeight: 400,
  headerFontWeight: 600,

  // Spacing
  spacing: 8,
  rowHeight: 48,
  headerHeight: 48,
  cellPadding: 12,

  // Borders
  borderColor: '#dcdcdc',
  borderWidth: 1,
  borderRadius: 0,

  // Specific colors
  headerBackgroundColor: '#f5f5f5',
  rowBackgroundColor: '#ffffff',
  rowEvenBackgroundColor: '#fafafa',
  rowHoverBackgroundColor: '#f0f0f0',
  rowSelectedBackgroundColor: '#e3f2fd',
  cellHoverBackgroundColor: '#f5f5f5',

  // Group row
  groupRowBackgroundColor: '#fafafa',
  groupRowIndentWidth: 24,
};

/**
 * Quartz theme object
 *
 * @example
 * ```typescript
 * import { themeQuartz } from 'argent-grid';
 *
 * // Basic usage
 * gridOptions.theme = themeQuartz;
 *
 * // Customization
 * const myTheme = themeQuartz.withParams({
 *   spacing: 12,
 *   accentColor: 'red',
 * });
 *
 * // Mix with parts
 * import { colorSchemeDark } from 'argent-grid';
 * const myTheme = themeQuartz.withPart(colorSchemeDark);
 * ```
 */
export const themeQuartz = createTheme({
  name: 'quartz',
  description: 'Modern, high-contrast theme recommended for most applications',
  parameters: QUARTZ_DEFAULTS,
});
