import {
  ApplicationRef,
  ComponentRef,
  createComponent,
  EnvironmentInjector,
  Injector,
  Type,
} from '@angular/core';
import type {
  CellOverlayInstance,
  CellOverlayPosition,
  ColDef,
  Column,
  GridApi,
  ICellRendererAngularComp,
  ICellRendererParams,
} from '../types/ag-grid-types';
import { getCellValue, getFormattedValue } from './render';

export class CellOverlayManager<TData = any> {
  private overlays: Map<string, CellOverlayInstance> = new Map();
  private container: HTMLElement | null = null;
  private environmentInjector: EnvironmentInjector | null = null;
  private applicationRef: ApplicationRef | null = null;
  private rendererComponentTypes: Map<string, Type<ICellRendererAngularComp>> = new Map();
  private rowHeight = 32;
  private rowBuffer = 5;
  private gridApi: GridApi<TData> | null = null;

  private getOverlayKey(rowIndex: number, colId: string): string {
    return `${rowIndex}:${colId}`;
  }

  initialize(
    container: HTMLElement,
    environmentInjector: EnvironmentInjector,
    applicationRef: ApplicationRef,
    gridApi: GridApi<TData>,
    rowHeight: number
  ): void {
    this.container = container;
    this.environmentInjector = environmentInjector;
    this.applicationRef = applicationRef;
    this.gridApi = gridApi;
    this.rowHeight = rowHeight;
  }

  registerRendererColumn(colId: string, componentType: Type<ICellRendererAngularComp>): void {
    this.rendererComponentTypes.set(colId, componentType);
  }

  unregisterRendererColumn(colId: string): void {
    this.rendererComponentTypes.delete(colId);
    const toRemove: string[] = [];
    for (const [key] of this.overlays) {
      if (key.endsWith(`:${colId}`)) {
        toRemove.push(key);
      }
    }
    for (const key of toRemove) {
      this.destroyOverlay(key);
    }
  }

  getOverlayColumns(): Set<string> {
    return new Set(this.rendererComponentTypes.keys());
  }

  hasOverlayColumn(colId: string): boolean {
    return this.rendererComponentTypes.has(colId);
  }

  updateScroll(_scrollTop: number, _scrollLeft: number): void {
    // Scroll state is passed directly to computeVisibleOverlayPositions
  }

  updatePositions(positions: CellOverlayPosition[]): void {
    if (!this.container || !this.gridApi || !this.environmentInjector || !this.applicationRef)
      return;

    const visibleKeys = new Set<string>();

    for (const pos of positions) {
      const key = this.getOverlayKey(pos.rowIndex, pos.colId);
      visibleKeys.add(key);

      const existing = this.overlays.get(key);
      if (existing) {
        this.positionElement(existing.element, pos);
        this.refreshOverlay(existing, pos);
      } else {
        this.createOverlay(key, pos);
      }
    }

    for (const [key] of this.overlays) {
      if (!visibleKeys.has(key)) {
        this.destroyOverlay(key);
      }
    }
  }

  hideAllOverlays(): void {
    for (const [, instance] of this.overlays) {
      instance.element.style.display = 'none';
    }
  }

  showAllOverlays(): void {
    for (const [, instance] of this.overlays) {
      instance.element.style.display = '';
    }
  }

  hideOverlayAt(rowIndex: number, colId: string): void {
    const key = this.getOverlayKey(rowIndex, colId);
    const overlay = this.overlays.get(key);
    if (overlay) {
      overlay.element.style.display = 'none';
    }
  }

  showOverlayAt(rowIndex: number, colId: string): void {
    const key = this.getOverlayKey(rowIndex, colId);
    const overlay = this.overlays.get(key);
    if (overlay) {
      overlay.element.style.display = '';
    }
  }

  computeVisibleOverlayPositions(
    columns: Column[],
    allVisibleColumns: Column[],
    scrollTop: number,
    scrollLeft: number,
    viewportHeight: number,
    viewportWidth: number,
    leftPinnedWidth: number,
    rightPinnedWidth: number
  ): CellOverlayPosition[] {
    if (!this.gridApi) return [];

    const positions: CellOverlayPosition[] = [];
    const totalRows = this.gridApi.getDisplayedRowCount();
    if (totalRows === 0) return positions;

    const availableWidth = viewportWidth;

    const startRow = Math.max(0, Math.floor(scrollTop / this.rowHeight) - this.rowBuffer);
    const endRow = Math.min(
      totalRows - 1,
      Math.ceil((scrollTop + viewportHeight) / this.rowHeight) + this.rowBuffer
    );

    for (let rowIndex = startRow; rowIndex <= endRow; rowIndex++) {
      const y = rowIndex * this.rowHeight - scrollTop;

      for (const col of columns) {
        if (!this.hasOverlayColumn(col.colId)) continue;

        let x: number;
        if (col.pinned === 'left') {
          x = this.getColumnX(col, allVisibleColumns, 'left');
        } else if (col.pinned === 'right') {
          const rightCols = allVisibleColumns.filter((c) => c.pinned === 'right');
          let rx = availableWidth;
          for (const rc of rightCols) {
            if (rc.colId === col.colId) break;
            rx -= rc.width || 150;
          }
          x = rx - (col.width || 150);
        } else {
          x = leftPinnedWidth + this.getColumnX(col, allVisibleColumns, 'none') - scrollLeft;
        }

        const width = col.width || 150;

        if (x + width < 0 || x > availableWidth) continue;

        positions.push({
          rowIndex,
          colId: col.colId,
          x,
          y,
          width,
          height: this.rowHeight,
        });
      }
    }

    return positions;
  }

  private getColumnX(col: Column, allCols: Column[], section: 'left' | 'right' | 'none'): number {
    const filtered =
      section === 'left'
        ? allCols.filter((c) => c.pinned === 'left')
        : section === 'right'
          ? allCols.filter((c) => c.pinned === 'right')
          : allCols.filter((c) => !c.pinned);

    let x = 0;
    for (const c of filtered) {
      if (c.colId === col.colId) break;
      x += c.width || 150;
    }
    return x;
  }

  private createOverlay(key: string, position: CellOverlayPosition): void {
    if (!this.container || !this.environmentInjector || !this.applicationRef || !this.gridApi)
      return;

    const componentType = this.rendererComponentTypes.get(position.colId);
    if (!componentType) return;

    const rowNode = this.gridApi.getDisplayedRowAtIndex(position.rowIndex);
    if (!rowNode) return;

    const column = this.gridApi.getAllColumns().find((c) => c.colId === position.colId);
    if (!column) return;

    const colDef = this.getColDef(column);
    const value = getCellValue(column, colDef, rowNode, this.gridApi);
    const formattedValue = getFormattedValue(value, colDef, rowNode.data, rowNode, this.gridApi);

    const params: ICellRendererParams<TData> = {
      value,
      formattedValue,
      data: rowNode.data,
      node: rowNode,
      colDef: colDef || {},
      column,
      api: this.gridApi,
      context: this.gridApi.getGridOption('context'),
    };

    try {
      const componentRef: ComponentRef<ICellRendererAngularComp> = createComponent(componentType, {
        environmentInjector: this.environmentInjector,
        elementInjector: Injector.create([]),
      });

      componentRef.instance.agInit(params);

      this.applicationRef.attachView(componentRef.hostView);

      const element = componentRef.location.nativeElement as HTMLElement;
      element.classList.add('ag-cell-overlay');
      this.positionElement(element, position);
      this.container.appendChild(element);

      const instance: CellOverlayInstance = {
        rowIndex: position.rowIndex,
        colId: position.colId,
        element,
        componentRef,
        params,
      };

      this.overlays.set(key, instance);
    } catch (e) {
      console.warn('[ArgentGrid] Failed to create cell overlay:', e);
    }
  }

  private refreshOverlay(instance: CellOverlayInstance, position: CellOverlayPosition): void {
    if (!this.gridApi) return;

    const rowNode = this.gridApi.getDisplayedRowAtIndex(position.rowIndex);
    if (!rowNode) return;

    if (
      instance.params.node === rowNode &&
      instance.rowIndex === position.rowIndex &&
      instance.colId === position.colId
    ) {
      const column = this.gridApi.getAllColumns().find((c) => c.colId === position.colId);
      const colDef = column ? this.getColDef(column) : instance.params.colDef;
      const value = column
        ? getCellValue(column, colDef, rowNode, this.gridApi)
        : instance.params.value;
      const formattedValue = column
        ? getFormattedValue(value, colDef, rowNode.data, rowNode, this.gridApi)
        : instance.params.formattedValue;

      const newParams: ICellRendererParams<TData> = {
        value,
        formattedValue,
        data: rowNode.data,
        node: rowNode,
        colDef: colDef || instance.params.colDef,
        column: column || instance.params.column,
        api: this.gridApi,
        context: this.gridApi.getGridOption('context'),
      };

      if (componentRefSupportsRefresh(instance.componentRef)) {
        const shouldRecreate = instance.componentRef.instance.refresh?.(newParams);
        if (shouldRecreate === false) {
          instance.params = newParams;
          return;
        }
      }

      instance.params = newParams;
    }
  }

  private positionElement(element: HTMLElement, position: CellOverlayPosition): void {
    element.style.position = 'absolute';
    element.style.left = `${Math.floor(position.x)}px`;
    element.style.top = `${Math.floor(position.y)}px`;
    element.style.width = `${Math.floor(position.width)}px`;
    element.style.height = `${Math.floor(position.height)}px`;
    element.style.overflow = 'hidden';
    element.style.pointerEvents = 'auto';
  }

  private destroyOverlay(key: string): void {
    const instance = this.overlays.get(key);
    if (!instance) return;

    if (instance.element.parentNode) {
      instance.element.parentNode.removeChild(instance.element);
    }

    if (instance.componentRef) {
      this.applicationRef?.detachView(instance.componentRef.hostView);
      instance.componentRef.destroy();
    }

    this.overlays.delete(key);
  }

  private getColDef(column: Column): ColDef<TData> | null {
    if (!this.gridApi) return null;
    const options = this.gridApi.getGridOption('columnDefs');
    if (!options) return null;

    for (const def of options) {
      if ('children' in def) continue;
      const defId = (def as any).colId || (def as any).field;
      if (defId === column.colId || defId === column.field) {
        const defaultColDef = this.gridApi.getGridOption('defaultColDef');
        return defaultColDef ? { ...defaultColDef, ...def } : (def as ColDef<TData>);
      }
    }
    return null;
  }

  getOverlays(): ReadonlyMap<string, CellOverlayInstance> {
    return this.overlays;
  }

  getOverlayCount(): number {
    return this.overlays.size;
  }

  destroy(): void {
    for (const [key] of this.overlays) {
      this.destroyOverlay(key);
    }
    this.overlays.clear();
    this.rendererComponentTypes.clear();
    this.container = null;
    this.environmentInjector = null;
    this.applicationRef = null;
    this.gridApi = null;
  }
}

function componentRefSupportsRefresh(ref: any): ref is ComponentRef<ICellRendererAngularComp> {
  return ref?.instance && typeof ref.instance.refresh === 'function';
}
