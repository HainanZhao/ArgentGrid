/**
 * Icon Set Parts
 * 
 * Predefined icon sets that can be mixed with any theme
 */

import type { IconSetPart, IconDefinition } from '../types';

// ============================================================================
// QUARTZ ICON SET
// ============================================================================

const QUARTZ_ICONS: Record<string, IconDefinition> = {
  asc: {
    name: 'asc',
    path: 'M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z',
    viewBox: '0 0 24 24',
  },
  desc: {
    name: 'desc',
    path: 'M19 13H5v-2h14v2z',
    viewBox: '0 0 24 24',
  },
  menu: {
    name: 'menu',
    path: 'M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z',
    viewBox: '0 0 24 24',
  },
  filter: {
    name: 'filter',
    path: 'M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z',
    viewBox: '0 0 24 24',
  },
  close: {
    name: 'close',
    path: 'M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z',
    viewBox: '0 0 24 24',
  },
  expand: {
    name: 'expand',
    path: 'M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z',
    viewBox: '0 0 24 24',
  },
  collapse: {
    name: 'collapse',
    path: 'M16.59 14.59L12 10.83 7.41 14.59 6 13.17l6-6 6 6z',
    viewBox: '0 0 24 24',
  },
  pin: {
    name: 'pin',
    path: 'M16 12V4H8v8l-2 2v2h6v6l4-4v-2h6v-2z',
    viewBox: '0 0 24 24',
  },
  columns: {
    name: 'columns',
    path: 'M10 18h5v-6h-5v6zm-6 0h5V5H4v13zm12 0h5v-6h-5v6zM10 5v6h11V5H10z',
    viewBox: '0 0 24 24',
  },
  search: {
    name: 'search',
    path: 'M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z',
    viewBox: '0 0 24 24',
  },
};

/**
 * Quartz icon set part
 * 
 * @example
 * ```typescript
 * import { themeQuartz, iconSetQuartz } from 'argent-grid';
 * 
 * const myTheme = themeQuartz.withPart(iconSetQuartz);
 * ```
 */
export const iconSetQuartz: IconSetPart = {
  name: 'icon-set-quartz',
  type: 'icon-set',
  icons: QUARTZ_ICONS,
};

// ============================================================================
// MATERIAL ICON SET
// ============================================================================

const MATERIAL_ICONS: Record<string, IconDefinition> = {
  asc: {
    name: 'asc',
    path: 'M4 12l1.41 1.41L11 7.83V20h2V7.83l5.58 5.59L20 12l-8-8-8 8z',
    viewBox: '0 0 24 24',
  },
  desc: {
    name: 'desc',
    path: 'M20 12l-1.41-1.41L13 16.17V4h-2v12.17l-5.58-5.59L4 12l8 8 8-8z',
    viewBox: '0 0 24 24',
  },
  menu: {
    name: 'menu',
    path: 'M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z',
    viewBox: '0 0 24 24',
  },
  filter: {
    name: 'filter',
    path: 'M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z',
    viewBox: '0 0 24 24',
  },
  close: {
    name: 'close',
    path: 'M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z',
    viewBox: '0 0 24 24',
  },
  expand: {
    name: 'expand',
    path: 'M12 8l-6 6 1.41 1.41L12 10.83l4.59 4.58L18 14z',
    viewBox: '0 0 24 24',
  },
  collapse: {
    name: 'collapse',
    path: 'M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z',
    viewBox: '0 0 24 24',
  },
  pin: {
    name: 'pin',
    path: 'M17 4v7l2.29 2.29c.63.63.63 1.64 0 2.27l-1.83 1.83c-.63.63-1.64.63-2.27 0L13 13.29V20h-2v-6.71l-2.29 2.29c-.63.63-1.64.63-2.27 0L4.54 13.75c-.63-.63-.63-1.64 0-2.27L6.83 9.17V4h10.17z',
    viewBox: '0 0 24 24',
  },
  columns: {
    name: 'columns',
    path: 'M10 18h5v-6h-5v6zm-6 0h5V5H4v13zm12 0h5v-6h-5v6zM10 5v6h11V5H10z',
    viewBox: '0 0 24 24',
  },
  search: {
    name: 'search',
    path: 'M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z',
    viewBox: '0 0 24 24',
  },
};

/**
 * Material Design icon set part
 * 
 * @example
 * ```typescript
 * import { themeQuartz, iconSetMaterial } from 'argent-grid';
 * 
 * const myTheme = themeQuartz.withPart(iconSetMaterial);
 * ```
 */
export const iconSetMaterial: IconSetPart = {
  name: 'icon-set-material',
  type: 'icon-set',
  icons: MATERIAL_ICONS,
};

// ============================================================================
// MINIMAL ICON SET
// ============================================================================

const MINIMAL_ICONS: Record<string, IconDefinition> = {
  asc: {
    name: 'asc',
    path: 'M7 14l5-5 5 5z',
    viewBox: '0 0 24 24',
  },
  desc: {
    name: 'desc',
    path: 'M7 10l5 5 5-5z',
    viewBox: '0 0 24 24',
  },
  menu: {
    name: 'menu',
    path: 'M3 12h18M3 6h18M3 18h18',
    viewBox: '0 0 24 24',
  },
  filter: {
    name: 'filter',
    path: 'M3 5h18M6 12h12M10 19h4',
    viewBox: '0 0 24 24',
  },
  close: {
    name: 'close',
    path: 'M18 6L6 18M6 6l12 12',
    viewBox: '0 0 24 24',
  },
  expand: {
    name: 'expand',
    path: 'M8 9l4-4 4 4',
    viewBox: '0 0 24 24',
  },
  collapse: {
    name: 'collapse',
    path: 'M8 15l4 4 4-4',
    viewBox: '0 0 24 24',
  },
  pin: {
    name: 'pin',
    path: 'M12 2L8 6v6l-4 4v2h6v6l4-4 4 4v-6h6v-2l-4-4V6z',
    viewBox: '0 0 24 24',
  },
  columns: {
    name: 'columns',
    path: 'M4 4h16v16H4z M12 4v16',
    viewBox: '0 0 24 24',
  },
  search: {
    name: 'search',
    path: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
    viewBox: '0 0 24 24',
  },
};

/**
 * Minimal line icon set part
 * 
 * @example
 * ```typescript
 * import { themeQuartz, iconSetMinimal } from 'argent-grid';
 * 
 * const myTheme = themeQuartz.withPart(iconSetMinimal);
 * ```
 */
export const iconSetMinimal: IconSetPart = {
  name: 'icon-set-minimal',
  type: 'icon-set',
  icons: MINIMAL_ICONS,
};

// ============================================================================
// EXPORTS
// ============================================================================

/**
 * All available icon sets
 */
export const ICON_SETS: Record<string, IconSetPart> = {
  quartz: iconSetQuartz,
  material: iconSetMaterial,
  minimal: iconSetMinimal,
};

/**
 * Get icon set by name
 */
export function getIconSet(name: string): IconSetPart | undefined {
  return ICON_SETS[name];
}

/**
 * Get icon SVG from icon set
 */
export function getIconSvg(
  iconSet: IconSetPart,
  iconName: string
): string | undefined {
  const icon = iconSet.icons[iconName];
  if (!icon) return undefined;

  return `<svg viewBox="${icon.viewBox || '0 0 24 24'}" fill="currentColor">
    <path d="${icon.path}"/>
  </svg>`;
}
