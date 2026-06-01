/**
 * Named Cell-Renderer Registry (T1.3)
 *
 * Lets a column reference a renderer by name — `cellRenderer: 'myRenderer'` —
 * instead of importing the component/function directly. Names resolve against
 * two layers, checked in order:
 *
 *   1. The per-grid `gridOptions.components` map (AG-Grid-compatible, instance
 *      scoped, takes precedence).
 *   2. A process-wide global registry populated via {@link registerCellRenderer}
 *      (app scoped — register once at bootstrap, use everywhere).
 *
 * A name that resolves to an Angular component class routes through the DOM
 * overlay (see `cell-overlay-manager`); one that resolves to a plain function is
 * a string-returning renderer drawn on the canvas. An *unknown* name resolves to
 * `undefined`, so built-in canvas string renderers ('checkbox', 'rating', …) —
 * which are intentionally NOT in the registry — fall through to the canvas
 * primitives unchanged.
 */

import type { Type } from '@angular/core';
import type { ICellRendererParams } from '../../types/ag-grid-types';

/**
 * A registered renderer: an Angular component class (overlay), or a function
 * returning a string (canvas). Functions returning an `HTMLElement` are not yet
 * hosted by the overlay — only their string form is drawn.
 */
export type CellRendererEntry = Type<any> | ((params: ICellRendererParams) => string | HTMLElement);

/** A name→renderer map, as accepted by `gridOptions.components`. */
export type CellRendererComponents = Record<string, CellRendererEntry>;

const globalRegistry = new Map<string, CellRendererEntry>();

/**
 * Register a renderer under `name` in the process-wide registry. A later
 * registration with the same name overwrites the earlier one. Per-grid
 * `gridOptions.components` still takes precedence over anything registered here.
 */
export function registerCellRenderer(name: string, renderer: CellRendererEntry): void {
  globalRegistry.set(name, renderer);
}

/** Remove a globally-registered renderer. No-op if `name` was never registered. */
export function unregisterCellRenderer(name: string): boolean {
  return globalRegistry.delete(name);
}

/** Look up a renderer in the global registry only (ignores per-grid components). */
export function getGlobalCellRenderer(name: string): CellRendererEntry | undefined {
  return globalRegistry.get(name);
}

/** Clear the global registry — primarily for test isolation. */
export function clearCellRendererRegistry(): void {
  globalRegistry.clear();
}

/**
 * Resolve a named renderer against the per-grid `components` map first, then the
 * global registry. Returns the registered entry (component class or function),
 * or `undefined` when the name is unknown.
 */
export function resolveNamedRenderer(
  name: string,
  components?: CellRendererComponents | null
): CellRendererEntry | undefined {
  // biome-ignore lint/suspicious/noPrototypeBuiltins: Object.hasOwn is newer than the lib target; guards against inherited keys like 'toString'
  if (components && Object.prototype.hasOwnProperty.call(components, name)) {
    return components[name];
  }
  return globalRegistry.get(name);
}
