import { ComponentRef, Directive, Input, OnDestroy, OnInit, ViewContainerRef } from '@angular/core';
import { ArgentGridComponent } from '../components/argent-grid.component';
import { ColDef, ColGroupDef, GridOptions } from '../types/ag-grid-types';

/**
 * AgGridCompatibilityDirective - Drop-in replacement for AG Grid
 *
 * This directive allows users to migrate from AG Grid to ArgentGrid
 * by simply changing their import statement. It maps AG Grid's
 * [columnDefs] and [rowData] inputs to ArgentGrid's internal format.
 */
@Directive({
  selector: '[argentGrid], ag-grid-angular',
})
export class AgGridCompatibilityDirective<TData = any> implements OnInit, OnDestroy {
  @Input('columnDefs') set columnDefs(value: (ColDef<TData> | ColGroupDef<TData>)[] | null) {
    this._columnDefs = value;
    this.updateGrid();
  }
  get columnDefs(): (ColDef<TData> | ColGroupDef<TData>)[] | null {
    return this._columnDefs;
  }
  private _columnDefs: (ColDef<TData> | ColGroupDef<TData>)[] | null = null;

  @Input('rowData') set rowData(value: TData[] | null) {
    this._rowData = value;
    this.updateGrid();
  }
  get rowData(): TData[] | null {
    return this._rowData;
  }
  private _rowData: TData[] | null = null;

  @Input('gridOptions') set gridOptions(value: GridOptions<TData>) {
    this._gridOptions = value;
    this.updateGrid();
  }
  get gridOptions(): GridOptions<TData> {
    return this._gridOptions;
  }
  private _gridOptions: GridOptions<TData> | null = null;

  private gridComponentRef: ComponentRef<ArgentGridComponent<TData>> | null = null;

  constructor(private viewContainerRef: ViewContainerRef) {}

  ngOnInit(): void {
    this.createGridComponent();
  }

  ngOnDestroy(): void {
    if (this.gridComponentRef) {
      this.gridComponentRef.destroy();
    }
  }

  private createGridComponent(): void {
    // Create ArgentGrid component
    this.gridComponentRef = this.viewContainerRef.createComponent(ArgentGridComponent as any);

    this.updateGrid();
  }

  private updateGrid(): void {
    if (!this.gridComponentRef) {
      return;
    }

    // Map AG Grid inputs to ArgentGrid component
    this.gridComponentRef.instance.columnDefs = this.columnDefs;
    this.gridComponentRef.instance.rowData = this.rowData;
    this.gridComponentRef.instance.gridOptions = this.gridOptions || undefined;
    this.gridComponentRef.instance.refresh();
  }

  /**
   * Get the underlying GridApi for programmatic access
   */
  getApi(): any {
    return this.gridComponentRef?.instance.getApi();
  }
}
