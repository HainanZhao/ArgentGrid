import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { ArgentGridComponent } from './components/argent-grid.component';
import { AgGridCompatibilityDirective } from './directives/ag-grid-compatibility.directive';

@NgModule({
  declarations: [
    ArgentGridComponent,
    AgGridCompatibilityDirective
  ],
  imports: [
    CommonModule,
    DragDropModule
  ],
  exports: [
    ArgentGridComponent,
    AgGridCompatibilityDirective
  ]
})
export class ArgentGridModule {}
