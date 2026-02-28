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
