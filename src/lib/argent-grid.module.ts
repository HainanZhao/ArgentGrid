import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ArgentGridComponent } from './components/argent-grid.component';
import { AgGridCompatibilityDirective } from './directives/ag-grid-compatibility.directive';

@NgModule({
  declarations: [
    ArgentGridComponent,
    AgGridCompatibilityDirective
  ],
  imports: [
    CommonModule
  ],
  exports: [
    ArgentGridComponent,
    AgGridCompatibilityDirective
  ]
})
export class ArgentGridModule {}
