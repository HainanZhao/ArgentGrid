/**
 * CellOverlayManager
 *
 * Renders real DOM/Angular components for the small set of *visible* cells in
 * columns that opt into a component `cellRenderer`, composited over the canvas.
 *
 * The canvas still draws every plain cell. Only component-cells get a DOM node,
 * and those nodes are pooled and recycled on scroll (data is rebound to existing
 * instances rather than create/destroy). For a grid where N of M columns use a
 * component renderer, the live DOM node count is ~visibleRows × N — by
 * construction never more than AG Grid would mount, and far fewer when most
 * columns are plain.
 *
 * Driven by `CanvasRenderer.onAfterRender`, so the overlay stays in lockstep
 * with the canvas across scroll / resize / sort / filter / data changes.
 */

import type { ComponentRef, Type, ViewContainerRef } from '@angular/core';
import {
  type ColDef,
  type Column,
  type GridApi,
  type ICellRendererParams,
  type OverlayLayout,
} from '../types/ag-grid-types';
import {
  getCellValue,
  getFormattedValue,
  resolveCellComponent,
  usesComponentRenderer,
} from './render/cells';

interface CellEntry {
  componentRef: ComponentRef<any>;
  hostEl: HTMLElement;
  componentType: Type<any>;
  /** Cache key — when unchanged we only reposition, skipping change detection. */
  bindingKey: string;
}

export interface CellOverlayDeps<TData = any> {
  /** The sticky DOM layer (inside the scrolling viewport) to host cells in. */
  container: HTMLElement;
  gridApi: GridApi<TData>;
  /** Used to instantiate Angular components attached to the host change detection. */
  viewContainerRef: ViewContainerRef;
  /** Resolve the effective (merged) ColDef for a column. */
  getColDef: (column: Column) => ColDef<TData> | null;
}

export class CellOverlayManager<TData = any> {
  private container: HTMLElement;
  private gridApi: GridApi<TData>;
  private viewContainerRef: ViewContainerRef;
  private getColDef: (column: Column) => ColDef<TData> | null;

  /** Currently mounted cells, keyed by `rowIndex::colId`. */
  private active = new Map<string, CellEntry>();
  /** Idle instances available for reuse, keyed by component type. */
  private free = new Map<Type<any>, CellEntry[]>();

  /** Soft cap on idle instances kept per component type. */
  private static readonly MAX_FREE_PER_TYPE = 30;

  /**
   * When set (`rowIndex::colId`), that one cell is force-hidden — used while its
   * inline editor is open so the live editor input owns the cell, not the
   * component. Survives re-syncs until {@link showAll} clears it.
   */
  private hiddenKey: string | null = null;

  constructor(deps: CellOverlayDeps<TData>) {
    this.container = deps.container;
    this.gridApi = deps.gridApi;
    this.viewContainerRef = deps.viewContainerRef;
    this.getColDef = deps.getColDef;
  }

  /**
   * Reconcile the overlay with a freshly painted frame. Cheap when nothing
   * changed (reposition only); creates/recycles components on demand.
   */
  sync(layout: OverlayLayout): void {
    // Determine which columns route through the overlay (component renderers).
    const overlayColumns = layout.columns
      .map((pos) => {
        const column = this.gridApi.getColumn(pos.colId);
        if (!column) return null;
        const colDef = this.getColDef(column);
        if (!colDef || !usesComponentRenderer(colDef)) return null;
        return { pos, column, colDef };
      })
      .filter((c): c is NonNullable<typeof c> => c !== null);

    const stillNeeded = new Set<string>();

    if (overlayColumns.length > 0) {
      for (let rowIndex = layout.startRow; rowIndex < layout.endRow; rowIndex++) {
        const node = this.gridApi.getDisplayedRowAtIndex(rowIndex);
        // Skip group and master-detail rows — component cells render against
        // leaf data; a detail/group node has no real cell value here.
        if (!node || (node as any).group || (node as any).detail) continue;

        const y = this.rowY(rowIndex, layout);
        // Honor variable row heights; the canvas sizes each row to node.rowHeight.
        const height = (node as any).rowHeight || layout.rowHeight;

        for (const { pos, column, colDef } of overlayColumns) {
          const value = getCellValue(column, colDef, node, this.gridApi);
          const params = this.buildParams(value, colDef, column, node, rowIndex);
          const componentType = resolveCellComponent(colDef, params);
          if (!componentType) continue;

          const key = `${rowIndex}::${pos.colId}`;
          stillNeeded.add(key);
          this.placeCell(
            key,
            componentType,
            params,
            pos.x,
            y,
            pos.width,
            height,
            layout.dataChanged
          );
        }
      }
    }

    // Recycle cells that are no longer visible.
    for (const [key, entry] of this.active) {
      if (!stillNeeded.has(key)) {
        this.active.delete(key);
        this.release(entry);
      }
    }
  }

  /** Tear everything down. */
  destroy(): void {
    for (const entry of this.active.values()) entry.componentRef.destroy();
    this.active.clear();
    for (const entries of this.free.values()) {
      for (const entry of entries) entry.componentRef.destroy();
    }
    this.free.clear();
  }

  /**
   * Force-hide the overlay cell at `rowIndex::colId` (e.g. while its inline
   * editor is open). Stays hidden across re-syncs until {@link showAll}. A no-op
   * for cells without an overlay (plain canvas cells).
   */
  hideCell(rowIndex: number, colId: string): void {
    this.hiddenKey = `${rowIndex}::${colId}`;
    const entry = this.active.get(this.hiddenKey);
    if (entry) entry.hostEl.style.display = 'none';
  }

  /** Reveal whatever {@link hideCell} hid. */
  showAll(): void {
    if (this.hiddenKey === null) return;
    this.hiddenKey = null;
    for (const entry of this.active.values()) entry.hostEl.style.display = '';
  }

  // --------------------------------------------------------------------------

  private buildParams(
    value: any,
    colDef: ColDef<TData>,
    column: Column,
    node: any,
    rowIndex: number
  ): ICellRendererParams<TData> {
    const valueFormatted = getFormattedValue(value, colDef, node.data, node, this.gridApi);
    const extra = colDef.cellRendererParams || {};
    return {
      ...extra,
      value,
      valueFormatted,
      data: node.data,
      node,
      rowIndex,
      colDef,
      column,
      api: this.gridApi,
    };
  }

  private rowY(rowIndex: number, layout: OverlayLayout): number {
    // Respect variable row heights when the API exposes them.
    if (typeof this.gridApi.getRowY === 'function') {
      return this.gridApi.getRowY(rowIndex) - layout.scrollTop;
    }
    return rowIndex * layout.rowHeight - layout.scrollTop;
  }

  /** Create, reuse, reposition and (re)bind the cell for `key`. */
  private placeCell(
    key: string,
    componentType: Type<any>,
    params: ICellRendererParams<TData>,
    x: number,
    y: number,
    width: number,
    height: number,
    dataChanged: boolean
  ): void {
    const bindingKey = this.bindingKey(params);
    let entry = this.active.get(key);

    if (entry && entry.componentType !== componentType) {
      // Cell now wants a different component — recycle the old one.
      this.active.delete(key);
      this.release(entry);
      entry = undefined;
    }

    if (!entry) {
      entry = this.acquire(componentType);
      this.bind(entry, params, /* isNew */ entry.bindingKey === '');
      entry.bindingKey = bindingKey;
      this.active.set(key, entry);
    } else if (dataChanged || entry.bindingKey !== bindingKey) {
      // Data may have changed (sort/filter/edit/transaction) even when the
      // keyed `value` is unchanged — e.g. the component reads other fields of
      // `data`. On a data frame always re-bind; on a scroll frame the bindingKey
      // guard keeps it a cheap reposition. Recreate if it can't refresh.
      if (!this.refresh(entry, params)) {
        this.active.delete(key);
        this.release(entry);
        entry = this.acquire(componentType);
        this.bind(entry, params, true);
        this.active.set(key, entry);
      }
      entry.bindingKey = bindingKey;
    }

    this.position(entry.hostEl, x, y, width, height);
    // Respect an active hide (e.g. this cell is being edited) across re-syncs.
    entry.hostEl.style.display = key === this.hiddenKey ? 'none' : '';
  }

  /** A pooled or fresh instance of `componentType`. */
  private acquire(componentType: Type<any>): CellEntry {
    const pool = this.free.get(componentType);
    const reused = pool?.pop();
    if (reused) {
      reused.hostEl.style.display = '';
      return reused;
    }
    return this.create(componentType);
  }

  private create(componentType: Type<any>): CellEntry {
    const componentRef = this.viewContainerRef.createComponent(componentType);
    const hostEl = componentRef.location.nativeElement as HTMLElement;
    hostEl.classList.add('argent-grid-cell-overlay-host');
    // These MUST be inline: the host is created dynamically and never carries
    // the grid component's view-encapsulation attribute, so component-scoped
    // CSS would not match it. pointer-events:auto re-enables hit-testing over
    // the (pointer-events:none) layer so clicks reach the component, not the
    // canvas underneath.
    const s = hostEl.style;
    s.position = 'absolute';
    s.top = '0';
    s.left = '0';
    s.boxSizing = 'border-box';
    s.overflow = 'hidden';
    s.pointerEvents = 'auto';
    s.willChange = 'transform';
    // Move it out of the anchor location into our sticky overlay layer.
    this.container.appendChild(hostEl);
    return { componentRef, hostEl, componentType, bindingKey: '' };
  }

  private release(entry: CellEntry): void {
    const pool = this.free.get(entry.componentType) ?? [];
    if (pool.length >= CellOverlayManager.MAX_FREE_PER_TYPE) {
      entry.componentRef.destroy();
      return;
    }
    entry.hostEl.style.display = 'none';
    pool.push(entry);
    this.free.set(entry.componentType, pool);
  }

  /** Initial bind: call agInit (AG Grid convention) and/or set `params`. */
  private bind(entry: CellEntry, params: ICellRendererParams<TData>, isNew: boolean): void {
    const instance = entry.componentRef.instance as any;
    if (!isNew && typeof instance.refresh === 'function') {
      // A reused instance that supports refresh — prefer it over re-init.
      instance.params = params;
      instance.refresh(params);
    } else {
      instance.params = params;
      if (typeof instance.agInit === 'function') instance.agInit(params);
    }
    entry.componentRef.changeDetectorRef.detectChanges();
  }

  /** Rebind a pooled instance; returns false if it cannot refresh in place. */
  private refresh(entry: CellEntry, params: ICellRendererParams<TData>): boolean {
    const instance = entry.componentRef.instance as any;
    instance.params = params;
    if (typeof instance.refresh === 'function') {
      const ok = instance.refresh(params);
      entry.componentRef.changeDetectorRef.detectChanges();
      return ok !== false;
    }
    // No refresh hook but no agInit either → just a params-driven view: re-detect.
    if (typeof instance.agInit !== 'function') {
      entry.componentRef.changeDetectorRef.detectChanges();
      return true;
    }
    return false;
  }

  private position(el: HTMLElement, x: number, y: number, width: number, height: number): void {
    el.style.transform = `translate(${Math.floor(x)}px, ${Math.floor(y)}px)`;
    el.style.width = `${Math.floor(width)}px`;
    el.style.height = `${Math.floor(height)}px`;
  }

  /** Identity for skipping no-op rebinds (value + row identity). */
  private bindingKey(params: ICellRendererParams<TData>): string {
    const nodeId = (params.node as any)?.id ?? params.rowIndex;
    return `${nodeId}|${params.value}`;
  }
}
