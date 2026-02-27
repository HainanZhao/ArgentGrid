/**
 * Unit tests for Theme System
 *
 * Tests for theme definitions, merging, and utilities.
 */

import {
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
import { GridTheme, PartialTheme } from './types';

describe('Theme System', () => {
  describe('DEFAULT_THEME', () => {
    it('should have all required properties', () => {
      expect(DEFAULT_THEME.bgCell).toBeDefined();
      expect(DEFAULT_THEME.bgCellEven).toBeDefined();
      expect(DEFAULT_THEME.bgHeader).toBeDefined();
      expect(DEFAULT_THEME.bgSelection).toBeDefined();
      expect(DEFAULT_THEME.textCell).toBeDefined();
      expect(DEFAULT_THEME.textHeader).toBeDefined();
      expect(DEFAULT_THEME.fontFamily).toBeDefined();
      expect(DEFAULT_THEME.fontSize).toBeDefined();
      expect(DEFAULT_THEME.borderColor).toBeDefined();
      expect(DEFAULT_THEME.cellPadding).toBeDefined();
      expect(DEFAULT_THEME.headerHeight).toBeDefined();
      expect(DEFAULT_THEME.rowHeight).toBeDefined();
    });

    it('should have valid color values', () => {
      // Colors should be valid hex or rgba
      const colorPattern = /^(#[0-9a-fA-F]{6}|rgba?\([^)]+\))$/;
      expect(DEFAULT_THEME.bgCell).toMatch(colorPattern);
      expect(DEFAULT_THEME.textCell).toMatch(colorPattern);
    });

    it('should have sensible defaults', () => {
      expect(DEFAULT_THEME.fontSize).toBeGreaterThan(10);
      expect(DEFAULT_THEME.fontSize).toBeLessThan(20);
      expect(DEFAULT_THEME.rowHeight).toBeGreaterThanOrEqual(24);
      expect(DEFAULT_THEME.cellPadding).toBeGreaterThan(0);
    });
  });

  describe('DARK_THEME', () => {
    it('should be a valid partial theme', () => {
      expect(DARK_THEME.bgCell).toBeDefined();
      expect(DARK_THEME.textCell).toBeDefined();
    });

    it('should have darker background colors', () => {
      // Dark theme should have darker backgrounds than default
      expect(DARK_THEME.bgCell).not.toBe(DEFAULT_THEME.bgCell);
    });
  });

  describe('mergeTheme', () => {
    it('should return base theme when no overrides', () => {
      const result = mergeTheme(DEFAULT_THEME);
      expect(result).toEqual(DEFAULT_THEME);
    });

    it('should override single property', () => {
      const result = mergeTheme(DEFAULT_THEME, { bgCell: '#ff0000' });
      expect(result.bgCell).toBe('#ff0000');
      expect(result.textCell).toBe(DEFAULT_THEME.textCell);
    });

    it('should override multiple properties', () => {
      const result = mergeTheme(DEFAULT_THEME, {
        bgCell: '#ff0000',
        textCell: '#00ff00',
        fontSize: 16,
      });

      expect(result.bgCell).toBe('#ff0000');
      expect(result.textCell).toBe('#00ff00');
      expect(result.fontSize).toBe(16);
    });

    it('should apply multiple overrides in order', () => {
      const result = mergeTheme(
        DEFAULT_THEME,
        { bgCell: '#ff0000' },
        { bgCell: '#00ff00' }
      );

      expect(result.bgCell).toBe('#00ff00');
    });

    it('should ignore undefined overrides', () => {
      const result = mergeTheme(DEFAULT_THEME, undefined as any, { bgCell: '#ff0000' });
      expect(result.bgCell).toBe('#ff0000');
    });

    it('should not mutate base theme', () => {
      const original = { ...DEFAULT_THEME };
      mergeTheme(DEFAULT_THEME, { bgCell: '#ff0000' });
      expect(DEFAULT_THEME.bgCell).toBe(original.bgCell);
    });
  });

  describe('getFontFromTheme', () => {
    it('should create font string from theme', () => {
      const font = getFontFromTheme(DEFAULT_THEME);
      expect(font).toContain(`${DEFAULT_THEME.fontSize}px`);
      expect(font).toContain(DEFAULT_THEME.fontFamily);
    });

    it('should include font weight when specified', () => {
      const theme: GridTheme = {
        ...DEFAULT_THEME,
        fontWeight: 'bold',
      };
      const font = getFontFromTheme(theme);
      expect(font).toContain('bold');
    });
  });

  describe('getRowTheme', () => {
    it('should return selection theme when selected', () => {
      const result = getRowTheme(DEFAULT_THEME, { isSelected: true });
      expect(result.bgCell).toBe(DEFAULT_THEME.bgSelection);
    });

    it('should return hover theme when hovered', () => {
      const result = getRowTheme(DEFAULT_THEME, { isHovered: true });
      expect(result.bgCell).toBe(DEFAULT_THEME.bgHover);
    });

    it('should return group theme for group rows', () => {
      const result = getRowTheme(DEFAULT_THEME, { isGroup: true });
      expect(result.bgCell).toBe(DEFAULT_THEME.bgGroupRow || DEFAULT_THEME.bgHeader);
    });

    it('should return even row theme for even rows', () => {
      const result = getRowTheme(DEFAULT_THEME, { isEvenRow: true });
      expect(result.bgCell).toBe(DEFAULT_THEME.bgCellEven);
    });

    it('should return default cell color for odd rows', () => {
      const result = getRowTheme(DEFAULT_THEME, { isEvenRow: false });
      expect(result.bgCell).toBe(DEFAULT_THEME.bgCell);
    });

    it('should prioritize selection over other states', () => {
      const result = getRowTheme(DEFAULT_THEME, {
        isSelected: true,
        isHovered: true,
        isEvenRow: true,
      });
      expect(result.bgCell).toBe(DEFAULT_THEME.bgSelection);
    });
  });

  describe('getCellBackgroundColor', () => {
    it('should return selection color when selected', () => {
      const color = getCellBackgroundColor(DEFAULT_THEME, { isSelected: true });
      expect(color).toBe(DEFAULT_THEME.bgSelection);
    });

    it('should return hover color when hovered', () => {
      const color = getCellBackgroundColor(DEFAULT_THEME, { isHovered: true });
      expect(color).toBe(DEFAULT_THEME.bgHover);
    });

    it('should return group color for groups', () => {
      const color = getCellBackgroundColor(DEFAULT_THEME, { isGroup: true });
      expect(color).toBe(DEFAULT_THEME.bgGroupRow || DEFAULT_THEME.bgHeader);
    });

    it('should return even row color for even rows', () => {
      const color = getCellBackgroundColor(DEFAULT_THEME, { isEvenRow: true });
      expect(color).toBe(DEFAULT_THEME.bgCellEven);
    });

    it('should return default color for regular cells', () => {
      const color = getCellBackgroundColor(DEFAULT_THEME, {});
      expect(color).toBe(DEFAULT_THEME.bgCell);
    });

    it('should prioritize selection over hover', () => {
      const color = getCellBackgroundColor(DEFAULT_THEME, {
        isSelected: true,
        isHovered: true,
      });
      expect(color).toBe(DEFAULT_THEME.bgSelection);
    });
  });

  describe('THEME_PRESETS', () => {
    it('should have default preset', () => {
      expect(THEME_PRESETS.default).toBeDefined();
      expect(Object.keys(THEME_PRESETS.default).length).toBe(0);
    });

    it('should have dark preset', () => {
      expect(THEME_PRESETS.dark).toBeDefined();
      expect(THEME_PRESETS.dark.bgCell).toBeDefined();
    });

    it('should have compact preset', () => {
      expect(THEME_PRESETS.compact).toBeDefined();
      expect(THEME_PRESETS.compact.rowHeight).toBeLessThan(DEFAULT_THEME.rowHeight);
    });

    it('should have comfortable preset', () => {
      expect(THEME_PRESETS.comfortable).toBeDefined();
      expect(THEME_PRESETS.comfortable.rowHeight).toBeGreaterThan(DEFAULT_THEME.rowHeight);
    });
  });

  describe('getThemePreset', () => {
    it('should return preset by name', () => {
      expect(getThemePreset('dark')).toBe(THEME_PRESETS.dark);
      expect(getThemePreset('compact')).toBe(THEME_PRESETS.compact);
    });

    it('should return empty object for unknown preset', () => {
      expect(getThemePreset('nonexistent')).toEqual({});
    });
  });

  describe('createTheme', () => {
    it('should create default theme with no arguments', () => {
      const theme = createTheme();
      expect(theme).toEqual(DEFAULT_THEME);
    });

    it('should create theme from preset', () => {
      const theme = createTheme('dark');
      expect(theme.bgCell).toBe(DARK_THEME.bgCell);
    });

    it('should create theme from preset with overrides', () => {
      const theme = createTheme('dark', { bgCell: '#custom' });
      expect(theme.bgCell).toBe('#custom');
      expect(theme.textCell).toBe(DARK_THEME.textCell);
    });

    it('should create theme with custom overrides only', () => {
      const theme = createTheme('default', { rowHeight: 40 });
      expect(theme.rowHeight).toBe(40);
      expect(theme.bgCell).toBe(DEFAULT_THEME.bgCell);
    });
  });

  describe('Theme consistency', () => {
    it('dark theme should have all colors defined', () => {
      const darkFull = mergeTheme(DEFAULT_THEME, DARK_THEME);

      expect(darkFull.bgCell).toBeDefined();
      expect(darkFull.bgCellEven).toBeDefined();
      expect(darkFull.bgHeader).toBeDefined();
      expect(darkFull.bgSelection).toBeDefined();
      expect(darkFull.textCell).toBeDefined();
      expect(darkFull.textHeader).toBeDefined();
      expect(darkFull.borderColor).toBeDefined();
    });

    it('compact theme should have smaller dimensions', () => {
      const compactFull = mergeTheme(DEFAULT_THEME, THEME_PRESETS.compact);

      expect(compactFull.rowHeight).toBeLessThan(DEFAULT_THEME.rowHeight);
      expect(compactFull.fontSize).toBeLessThan(DEFAULT_THEME.fontSize);
    });

    it('comfortable theme should have larger dimensions', () => {
      const comfortableFull = mergeTheme(DEFAULT_THEME, THEME_PRESETS.comfortable);

      expect(comfortableFull.rowHeight).toBeGreaterThan(DEFAULT_THEME.rowHeight);
      expect(comfortableFull.fontSize).toBeGreaterThan(DEFAULT_THEME.fontSize);
    });
  });
});