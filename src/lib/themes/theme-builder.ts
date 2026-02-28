/**
 * Theme Builder - Create and customize themes programmatically
 *
 * Inspired by AG Grid's new Theming API (v32.2+)
 */

import type {
  PartialThemeParameters,
  GridThemeObject as Theme,
  ThemeBuilder,
  ThemeParameters,
  ThemePart,
} from './types';

// ============================================================================
// THEME BUILDER CLASS
// ============================================================================

/**
 * Theme builder class for creating and customizing themes
 */
class ThemeBuilderImpl implements ThemeBuilder {
  public readonly name: string;
  public readonly description?: string;
  public readonly parameters: ThemeParameters;
  public readonly parts: ThemePart[];

  constructor(config: {
    name: string;
    description?: string;
    parameters: ThemeParameters;
    parts?: ThemePart[];
  }) {
    this.name = config.name;
    this.description = config.description;
    this.parameters = config.parameters;
    this.parts = config.parts || [];
  }

  /**
   * Create a new theme with overridden parameters
   *
   * @example
   * ```typescript
   * const myTheme = themeQuartz.withParams({
   *   spacing: 12,
   *   accentColor: 'red',
   *   fontSize: 14,
   * });
   * ```
   */
  withParams(params: PartialThemeParameters): ThemeBuilder {
    const mergedParams = {
      ...this.parameters,
      ...params,
    };

    return new ThemeBuilderImpl({
      name: this.name,
      description: this.description,
      parameters: mergedParams,
      parts: this.parts,
    });
  }

  /**
   * Add a theme part to the theme
   *
   * @example
   * ```typescript
   * const myTheme = themeQuartz
   *   .withPart(colorSchemeDark)
   *   .withPart(iconSetMaterial);
   * ```
   */
  withPart(part: ThemePart): ThemeBuilder {
    return new ThemeBuilderImpl({
      name: this.name,
      description: this.description,
      parameters: this.parameters,
      parts: [...this.parts, part],
    });
  }

  /**
   * Get the final theme object with all parts applied
   */
  build(): Theme {
    return {
      name: this.name,
      description: this.description,
      parameters: this.parameters,
      parts: this.parts,
    };
  }

  /**
   * Convert theme to CSS custom properties
   */
  toCSS(): string {
    const cssVars: string[] = [];

    // Convert parameters to CSS custom properties
    Object.entries(this.parameters).forEach(([key, value]) => {
      const cssVarName = camelToKebab(key);
      cssVars.push(`  --ag-${cssVarName}: ${value};`);
    });

    // Add parts CSS
    this.parts.forEach((part) => {
      if (part.css) {
        cssVars.push(part.css);
      }
    });

    return `:root {\n${cssVars.join('\n')}\n}`;
  }
}

// ============================================================================
// THEME CREATION FUNCTIONS
// ============================================================================

/**
 * Create a new theme
 *
 * @example
 * ```typescript
 * const myTheme = createTheme({
 *   name: 'my-theme',
 *   description: 'My custom theme',
 *   parameters: {
 *     accentColor: 'blue',
 *     spacing: 12,
 *   },
 * });
 * ```
 */
export function createTheme(config: {
  name: string;
  description?: string;
  parameters: ThemeParameters;
  parts?: ThemePart[];
}): ThemeBuilder {
  return new ThemeBuilderImpl(config);
}

/**
 * Create a theme by extending an existing theme
 *
 * @example
 * ```typescript
 * const myTheme = extendTheme(themeQuartz, {
 *   accentColor: 'red',
 *   spacing: 12,
 * });
 * ```
 */
export function extendTheme(baseTheme: ThemeBuilder, params: PartialThemeParameters): ThemeBuilder {
  return baseTheme.withParams(params);
}

/**
 * Merge multiple themes together
 * Later themes override earlier ones
 */
export function mergeThemes(...themes: ThemeBuilder[]): ThemeBuilder {
  if (themes.length === 0) {
    throw new Error('At least one theme is required');
  }

  const baseTheme = themes[0];
  const mergedParams = { ...baseTheme.parameters };
  const mergedParts = [...baseTheme.parts];

  for (let i = 1; i < themes.length; i++) {
    const theme = themes[i];
    Object.assign(mergedParams, theme.parameters);
    mergedParts.push(...theme.parts);
  }

  return new ThemeBuilderImpl({
    name: 'merged',
    parameters: mergedParams,
    parts: mergedParts,
  });
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Convert camelCase to kebab-case
 */
function camelToKebab(str: string): string {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

/**
 * Get CSS variables from theme as a map
 * Returns CSS custom properties that can be applied to an element's style
 */
export function getThemeCSSVariables(theme: ThemeBuilder): Record<string, string> {
  const params = theme.parameters;
  const parts = theme.parts;

  // Collect all parameters from theme and parts
  let allParams = { ...params };

  // Merge parameters from all parts (later parts override earlier ones)
  for (const part of parts) {
    if (part.params) {
      allParams = { ...allParams, ...part.params };
    }
  }

  // Map to CSS variables
  return {
    '--ag-background-color': allParams.backgroundColor || allParams.rowBackgroundColor || '#ffffff',
    '--ag-foreground-color': allParams.foregroundColor || '#181d1f',
    '--ag-secondary-foreground-color': allParams.secondaryForegroundColor || '#666666',
    '--ag-header-background-color': allParams.headerBackgroundColor || '#f8f9fa',
    '--ag-header-foreground-color': allParams.foregroundColor || '#181d1f',
    '--ag-odd-row-background-color': allParams.rowEvenBackgroundColor || '#f8f9fa',
    '--ag-row-hover-color':
      allParams.rowHoverBackgroundColor || allParams.cellHoverBackgroundColor || '#f0f2f5',
    '--ag-selected-row-background-color': allParams.rowSelectedBackgroundColor || '#e3f2fd',
    '--ag-border-color': allParams.borderColor || '#babed1',
    '--ag-cell-horizontal-padding': `${String(allParams.cellPadding || allParams.spacing || 8)}px`,
    '--ag-header-height': `${String(allParams.headerHeight || 48)}px`,
    '--ag-row-height': `${String(allParams.rowHeight || 32)}px`,
    '--ag-font-size': `${String(allParams.fontSize || 14)}px`,
    '--ag-font-family':
      allParams.fontFamily || '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  };
}

/**
 * Apply theme CSS variables to a specific element
 * This updates both the element's inline styles and any CSS that uses these variables
 */
export function applyThemeCSSVariables(theme: ThemeBuilder, element: HTMLElement): void {
  const cssVars = getThemeCSSVariables(theme);

  Object.entries(cssVars).forEach(([key, value]) => {
    element.style.setProperty(key, value);
  });
}

/**
 * Apply theme to a container element
 * Injects CSS custom properties
 */
export function applyTheme(
  theme: ThemeBuilder,
  container: HTMLElement | ShadowRoot = document.documentElement
): void {
  const css = theme.toCSS();

  // Remove existing theme styles
  const existingStyle = container.querySelector('style[data-ag-theme]');
  if (existingStyle) {
    existingStyle.remove();
  }

  // Create new style element
  const style = document.createElement('style');
  style.setAttribute('data-ag-theme', theme.name);
  style.textContent = css;

  // Append to container
  container.appendChild(style);
}

/**
 * Remove theme from a container element
 */
export function removeTheme(
  theme: ThemeBuilder,
  container: HTMLElement | ShadowRoot = document.documentElement
): void {
  const existingStyle = container.querySelector(`style[data-ag-theme="${theme.name}"]`);
  if (existingStyle) {
    existingStyle.remove();
  }
}

// ============================================================================
// THEME CONVERTER - Convert ThemeBuilder to Canvas Renderer format
// ============================================================================

/**
 * Convert ThemeBuilder parameters to internal GridTheme format
 * This allows the new Theming API to work with the canvas renderer
 */
export function convertThemeToGridTheme(theme: ThemeBuilder): Record<string, any> {
  const params = theme.parameters;
  const parts = theme.parts;

  // Collect all parameters from theme and parts
  let allParams = { ...params };

  // Merge parameters from all parts (later parts override earlier ones)
  for (const part of parts) {
    if (part.params) {
      allParams = { ...allParams, ...part.params };
    }
  }

  // Map ThemeParameters to internal GridTheme format
  const gridTheme: Record<string, any> = {
    // Background colors
    bgCell: allParams.backgroundColor || allParams.rowBackgroundColor || '#ffffff',
    bgCellEven: allParams.rowEvenBackgroundColor || '#f8f9fa',
    bgHeader: allParams.headerBackgroundColor || '#f8f9fa',
    bgSelection: allParams.rowSelectedBackgroundColor || '#e3f2fd',
    bgHover: allParams.rowHoverBackgroundColor || allParams.cellHoverBackgroundColor || '#f0f2f5',
    bgGroupRow: allParams.groupRowBackgroundColor || '#f5f5f5',

    // Text colors
    textCell: allParams.foregroundColor || '#181d1f',
    textHeader: allParams.foregroundColor || '#181d1f',

    // Typography
    fontFamily:
      allParams.fontFamily || '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: allParams.fontSize || 14,
    fontWeight: allParams.fontWeight || 'normal',

    // Borders
    borderColor: allParams.borderColor || '#babed1',
    headerBorderColor: allParams.borderColor || '#babed1',
    gridLineColor: allParams.borderColor || '#babed1',

    // Spacing
    cellPadding: allParams.cellPadding || allParams.spacing || 8,
    headerHeight: allParams.headerHeight || 48,
    rowHeight: allParams.rowHeight || 32,

    // Group/Tree
    groupIndentWidth: allParams.groupRowIndentWidth || 24,
    groupIndicatorSize: allParams.iconSize || 12,
  };

  return gridTheme;
}
