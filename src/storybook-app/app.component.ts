import { Component } from '@angular/core';
import { ArgentGridModule } from '../public-api';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ArgentGridModule],
  template: `<argent-grid></argent-grid>`
})
export class AppComponent {}