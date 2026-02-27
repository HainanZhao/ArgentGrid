import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ArgentGridComponent } from './components/argent-grid.component';
import { AgGridCompatibilityDirective } from './directives/ag-grid-compatibility.directive';
import { GridService } from './services/grid.service';

@NgModule({
  declarations: [
    ArgentGridComponent,
    AgGridCompatibilityDirective
  ],
  imports: [
    CommonModule
  ],
  providers: [
    GridService
  ],
  exports: [
    ArgentGridComponent,
    AgGridCompatibilityDirective
  ]
})
export class ArgentGridModule {}
