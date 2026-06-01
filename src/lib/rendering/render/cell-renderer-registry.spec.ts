import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  clearCellRendererRegistry,
  getGlobalCellRenderer,
  registerCellRenderer,
  resolveNamedRenderer,
  unregisterCellRenderer,
} from './cell-renderer-registry';

/** A stand-in for an Angular component class — `isAngularComponent` only checks `ɵcmp`. */
function fakeComponent(name: string): any {
  const cls = class {};
  (cls as any).ɵcmp = { name };
  return cls;
}

describe('cell-renderer-registry', () => {
  beforeEach(() => clearCellRendererRegistry());
  afterEach(() => clearCellRendererRegistry());

  describe('global registry', () => {
    it('registers and retrieves a renderer by name', () => {
      const comp = fakeComponent('Pill');
      registerCellRenderer('pill', comp);
      expect(getGlobalCellRenderer('pill')).toBe(comp);
    });

    it('returns undefined for an unknown name', () => {
      expect(getGlobalCellRenderer('nope')).toBeUndefined();
    });

    it('overwrites an existing registration with the same name', () => {
      const a = fakeComponent('A');
      const b = fakeComponent('B');
      registerCellRenderer('x', a);
      registerCellRenderer('x', b);
      expect(getGlobalCellRenderer('x')).toBe(b);
    });

    it('unregisters a renderer', () => {
      registerCellRenderer('tmp', fakeComponent('Tmp'));
      expect(unregisterCellRenderer('tmp')).toBe(true);
      expect(getGlobalCellRenderer('tmp')).toBeUndefined();
      // No-op for an unknown name.
      expect(unregisterCellRenderer('tmp')).toBe(false);
    });

    it('clears the whole registry', () => {
      registerCellRenderer('a', fakeComponent('A'));
      registerCellRenderer('b', fakeComponent('B'));
      clearCellRendererRegistry();
      expect(getGlobalCellRenderer('a')).toBeUndefined();
      expect(getGlobalCellRenderer('b')).toBeUndefined();
    });

    it('stores function renderers too', () => {
      const fn = (p: any) => String(p.value);
      registerCellRenderer('fn', fn);
      expect(getGlobalCellRenderer('fn')).toBe(fn);
    });
  });

  describe('resolveNamedRenderer', () => {
    it('prefers the per-grid components map over the global registry', () => {
      const globalComp = fakeComponent('Global');
      const localComp = fakeComponent('Local');
      registerCellRenderer('shared', globalComp);
      expect(resolveNamedRenderer('shared', { shared: localComp })).toBe(localComp);
    });

    it('falls back to the global registry when the name is not in components', () => {
      const globalComp = fakeComponent('Global');
      registerCellRenderer('only-global', globalComp);
      expect(resolveNamedRenderer('only-global', { other: fakeComponent('Other') })).toBe(
        globalComp
      );
    });

    it('resolves from the global registry when no components map is given', () => {
      const comp = fakeComponent('G');
      registerCellRenderer('g', comp);
      expect(resolveNamedRenderer('g')).toBe(comp);
      expect(resolveNamedRenderer('g', null)).toBe(comp);
    });

    it('returns undefined for an unknown name (built-in canvas string falls through)', () => {
      expect(resolveNamedRenderer('checkbox')).toBeUndefined();
      expect(resolveNamedRenderer('checkbox', {})).toBeUndefined();
    });

    it('does not treat inherited Object properties as registered names', () => {
      // Guards the hasOwnProperty check — 'toString' exists on the prototype.
      expect(resolveNamedRenderer('toString', {})).toBeUndefined();
    });
  });
});
