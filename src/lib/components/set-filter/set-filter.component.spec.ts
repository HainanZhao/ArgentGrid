import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SetFilterComponent } from './set-filter.component';

describe('SetFilterComponent', () => {
  let component: SetFilterComponent<string>;

  const values = ['Engineering', 'Sales', 'Marketing', 'Engineering', 'Sales'];

  beforeEach(() => {
    component = new SetFilterComponent();
  });

  // ── initialSelectedValues ──────────────────────────────────────────────────

  describe('initialSelectedValues input', () => {
    it('should check all items when initialSelectedValues is null (default)', () => {
      component.values = values;
      component.initialSelectedValues = null;
      component.ngOnInit();

      expect(component.allValues.every((v) => v.selected)).toBe(true);
    });

    it('should pre-check only the provided values when initialSelectedValues is set', () => {
      component.values = values;
      component.initialSelectedValues = ['Engineering'];
      component.ngOnInit();

      const eng = component.allValues.find((v) => v.value === 'Engineering');
      const sales = component.allValues.find((v) => v.value === 'Sales');
      const mkt = component.allValues.find((v) => v.value === 'Marketing');

      expect(eng?.selected).toBe(true);
      expect(sales?.selected).toBe(false);
      expect(mkt?.selected).toBe(false);
    });

    it('should populate selectedValues matching initialSelectedValues', () => {
      component.values = values;
      component.initialSelectedValues = ['Sales', 'Marketing'];
      component.ngOnInit();

      expect(component.selectedValues).toEqual(expect.arrayContaining(['Sales', 'Marketing']));
      expect(component.selectedValues).not.toContain('Engineering');
    });

    it('should handle empty initialSelectedValues (none checked)', () => {
      component.values = values;
      component.initialSelectedValues = [];
      component.ngOnInit();

      expect(component.allValues.every((v) => !v.selected)).toBe(true);
      expect(component.selectedValues).toEqual([]);
    });

    it('should handle initialSelectedValues with values not present in list gracefully', () => {
      component.values = values;
      component.initialSelectedValues = ['NonExistent'];
      component.ngOnInit();

      expect(component.allValues.every((v) => !v.selected)).toBe(true);
    });
  });

  // ── resetFilter ────────────────────────────────────────────────────────────

  describe('resetFilter', () => {
    it('should re-select all items after reset, regardless of initialSelectedValues', () => {
      component.values = values;
      component.initialSelectedValues = ['Engineering'];
      component.ngOnInit();

      // Confirm only Engineering is selected before reset
      expect(component.allValues.filter((v) => v.selected).length).toBe(1);

      const emit = vi.fn();
      component.filterChanged.emit = emit;
      component.resetFilter();

      // After reset, all items should be selected
      expect(component.allValues.every((v) => v.selected)).toBe(true);
      expect(emit).toHaveBeenCalledWith(
        expect.arrayContaining(['Engineering', 'Sales', 'Marketing'])
      );
    });

    it('should clear search text on reset', () => {
      component.values = values;
      component.ngOnInit();
      component.searchText = 'Eng';

      component.resetFilter();

      expect(component.searchText).toBe('');
    });
  });

  // ── selectAll / clearAll ───────────────────────────────────────────────────

  describe('selectAll', () => {
    it('should mark all items selected', () => {
      component.values = values;
      component.initialSelectedValues = ['Engineering'];
      component.ngOnInit();

      component.selectAll();

      expect(component.allValues.every((v) => v.selected)).toBe(true);
    });
  });

  describe('clearAll', () => {
    it('should uncheck all items', () => {
      component.values = values;
      component.ngOnInit();

      component.clearAll();

      expect(component.allValues.every((v) => !v.selected)).toBe(true);
      expect(component.selectedValues).toEqual([]);
    });
  });

  // ── applyFilter ────────────────────────────────────────────────────────────

  describe('applyFilter', () => {
    it('should emit only selected values', () => {
      component.values = values;
      component.initialSelectedValues = ['Engineering'];
      component.ngOnInit();

      const emit = vi.fn();
      component.filterChanged.emit = emit;
      component.applyFilter();

      expect(emit).toHaveBeenCalledWith(['Engineering']);
    });
  });

  // ── filteredValues (search) ────────────────────────────────────────────────

  describe('filteredValues', () => {
    beforeEach(() => {
      component.values = values;
      component.ngOnInit();
    });

    it('should return all values when search is empty', () => {
      expect(component.filteredValues.length).toBe(3); // unique: Eng, Sales, Mkt
    });

    it('should filter by search text (case-insensitive)', () => {
      component.searchText = 'eng';
      expect(component.filteredValues.length).toBe(1);
      expect(component.filteredValues[0].value).toBe('Engineering');
    });

    it('should return empty when search matches nothing', () => {
      component.searchText = 'zzz';
      expect(component.filteredValues.length).toBe(0);
    });
  });

  // ── value counts ──────────────────────────────────────────────────────────

  describe('value counts', () => {
    it('should count occurrences correctly', () => {
      component.values = values; // Eng x2, Sales x2, Mkt x1
      component.ngOnInit();

      const eng = component.allValues.find((v) => v.value === 'Engineering');
      const mkt = component.allValues.find((v) => v.value === 'Marketing');

      expect(eng?.count).toBe(2);
      expect(mkt?.count).toBe(1);
    });
  });

  // ── valueFormatter ────────────────────────────────────────────────────────

  describe('valueFormatter', () => {
    it('should apply formatter to display values', () => {
      component.values = ['eng', 'sales'];
      component.valueFormatter = (v) => v.toUpperCase();
      component.ngOnInit();

      expect(component.allValues[0].displayValue).toBe('ENG');
      expect(component.allValues[1].displayValue).toBe('SALES');
    });
  });
});
