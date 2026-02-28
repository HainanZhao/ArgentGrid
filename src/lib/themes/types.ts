/**
 * Theme System Type Definitions
 * 
 * Compatible with AG Grid's Theming API structure
 */

// ============================================================================
// THEME PARAMETERS
// ============================================================================

/**
 * Theme configuration parameters
 * 
 * All parameters are optional and can be overridden via withParams()
 */
export interface ThemeParameters {
  // === Colors ===
  /** Primary accent color for selections, highlights, etc. */
  accentColor?: string;
  /** Main background color */
  backgroundColor?: string;
  /** Main text/foreground color */
  foregroundColor?: string;
  /** Secondary text color (muted text) */
  secondaryForegroundColor?: string;
  
  // === Typography ===
  /** Font family stack */
  fontFamily?: string;
  /** Base font size in pixels */
  fontSize?: number;
  /** Base font weight */
  fontWeight?: number | 'normal' | 'bold' | 'lighter' | 'bolder';
  /** Header font weight */
  headerFontWeight?: number | 'normal' | 'bold' | 'lighter' | 'bolder';
  
  // === Spacing ===
  /** Base spacing unit in pixels */
  spacing?: number;
  /** Row height in pixels */
  rowHeight?: number;
  /** Header row height in pixels */
  headerHeight?: number;
  /** Cell padding in pixels */
  cellPadding?: number;
  
  // === Borders ===
  /** Border color */
  borderColor?: string;
  /** Border width in pixels */
  borderWidth?: number;
  /** Border radius in pixels */
  borderRadius?: number;
  
  // === Specific Colors ===
  /** Header background color */
  headerBackgroundColor?: string;
  /** Default row background color */
  rowBackgroundColor?: string;
  /** Even row background color (for striping) */
  rowEvenBackgroundColor?: string;
  /** Row background on hover */
  rowHoverBackgroundColor?: string;
  /** Row background when selected */
  rowSelectedBackgroundColor?: string;
  /** Cell background on hover */
  cellHoverBackgroundColor?: string;
  
  // === Group Row ===
  /** Group row background color */
  groupRowBackgroundColor?: string;
  /** Group row indent width in pixels */
  groupRowIndentWidth?: number;
  
  // === Icons ===
  /** Icon color */
  iconColor?: string;
  /** Icon size in pixels */
  iconSize?: number;
  
  // === Focus ===
  /** Focus border color */
  focusBorderColor?: string;
  /** Focus border width */
  focusBorderWidth?: number;
}

/**
 * Partial theme parameters for overrides
 */
export type PartialThemeParameters = Partial<ThemeParameters>;

// ============================================================================
// THEME PARTS
// ============================================================================

/**
 * Theme part type
 * Parts are modular theme components that can be mixed and matched
 */
export type ThemePartType = 
  | 'color-scheme'
  | 'icon-set'
  | 'checkbox-style'
  | 'input-style'
  | 'tab-style'
  | 'custom';

/**
 * Theme part configuration
 */
export interface ThemePart {
  /** Part name/identifier */
  name: string;
  /** Part type */
  type: ThemePartType;
  /** CSS rules for this part */
  css?: string;
  /** Additional parameters this part uses */
  additionalParams?: Record<string, any>;
  /** Parameters this part overrides */
  params?: PartialThemeParameters;
}

// ============================================================================
// THEME OBJECT
// ============================================================================

/**
 * Complete theme object
 */
export interface GridThemeObject {
  /** Theme name */
  name: string;
  /** Theme description */
  description?: string;
  /** Theme parameters */
  parameters: ThemeParameters;
  /** Theme parts */
  parts: ThemePart[];
}

/**
 * Theme builder interface
 * Used for chainable theme customization
 */
export interface ThemeBuilder {
  /** Theme name */
  readonly name: string;
  /** Theme description */
  readonly description?: string;
  /** Theme parameters */
  readonly parameters: ThemeParameters;
  /** Theme parts */
  readonly parts: ThemePart[];
  
  /**
   * Create a new theme with overridden parameters
   */
  withParams(params: PartialThemeParameters): ThemeBuilder;
  
  /**
   * Add a theme part to the theme
   */
  withPart(part: ThemePart): ThemeBuilder;
  
  /**
   * Get the final theme object
   */
  build(): GridThemeObject;
  
  /**
   * Convert theme to CSS custom properties
   */
  toCSS(): string;
}

// ============================================================================
// COLOR SCHEMES
// ============================================================================

/**
 * Predefined color scheme types
 */
export type ColorSchemeType = 'light' | 'dark' | 'auto';

/**
 * Color scheme part
 */
export interface ColorSchemePart extends ThemePart {
  type: 'color-scheme';
  scheme: ColorSchemeType;
}

// ============================================================================
// ICON SETS
// ============================================================================

/**
 * Predefined icon set types
 */
export type IconSetType = 'quartz' | 'material' | 'minimal' | 'custom';

/**
 * Icon definition
 */
export interface IconDefinition {
  /** Icon name */
  name: string;
  /** Icon SVG path or URL */
  path: string;
  /** Icon viewBox */
  viewBox?: string;
}

/**
 * Icon set part
 */
export interface IconSetPart extends ThemePart {
  type: 'icon-set';
  icons: Record<string, IconDefinition>;
}

// ============================================================================
// GRID OPTIONS INTEGRATION
// ============================================================================

/**
 * Grid options theme configuration
 */
export interface ThemeGridOptions {
  /** Theme object */
  theme?: ThemeBuilder;
  /** CSS layer name for theme styles */
  themeCssLayer?: string;
  /** Container element for theme styles */
  themeStyleContainer?: HTMLElement | ShadowRoot | (() => HTMLElement | ShadowRoot);
}
