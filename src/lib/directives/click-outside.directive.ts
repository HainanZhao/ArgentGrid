import { Directive, Output, EventEmitter, HostListener } from '@angular/core';

@Directive({
  selector: '[clickOutside]',
  standalone: true
})
export class ClickOutsideDirective {
  @Output() clickOutside = new EventEmitter<void>();

  @HostListener('document:click', ['$event.target'])
  onClick(target: HTMLElement): void {
    if (!target.closest('.set-filter-popup')) {
      this.clickOutside.emit();
    }
  }
}
