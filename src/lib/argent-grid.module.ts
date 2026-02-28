import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { ArgentGridComponent } from './components/argent-grid.component';
import { AgGridCompatibilityDirective } from './directives/ag-grid-compatibility.directive';
import { SetFilterComponent } from './components/set-filter/set-filter.component';
import { ClickOutsideDirective } from './directives/click-outside.directive';

@NgModule({
  declarations: [
    ArgentGridComponent,
    AgGridCompatibilityDirective
  ],
  imports: [
    CommonModule,
    DragDropModule,
    SetFilterComponent,
    ClickOutsideDirective
  ],
  exports: [
    ArgentGridComponent,
    AgGridCompatibilityDirective,
    SetFilterComponent,
    ClickOutsideDirective
  ]
})
export class ArgentGridModule {}
