import {
  type ComponentRef,
  Directive,
  Input,
  inject,
  type OnChanges,
  type OnDestroy,
  type SimpleChanges,
  type Type,
  ViewContainerRef,
} from '@angular/core';
import type { IHeaderAngularComp, IHeaderParams } from '../types/ag-grid-types';

/**
 * Hosts a custom header Angular component (`colDef.headerComponent`) inside a
 * DOM header cell. Unlike cell renderers, header cells are not pooled/recycled
 * (they live in the header `*ngFor`), so this directive simply creates the
 * component once via {@link ViewContainerRef}, calls `agInit`, and calls
 * `refresh` whenever the `version` input changes (bumped by the grid on
 * sort/filter/column state changes). It re-creates the component if the
 * component class itself changes, and destroys it on teardown.
 */
@Directive({
  selector: '[argentHeaderOutlet]',
  standalone: true,
})
export class ArgentHeaderOutletDirective implements OnChanges, OnDestroy {
  /** The header component class to mount (null = nothing). */
  @Input('argentHeaderOutlet') component: Type<IHeaderAngularComp> | null = null;
  /** Params passed to `agInit` / `refresh`. Should be a stable reference. */
  @Input('argentHeaderOutletParams') params!: IHeaderParams;
  /** Bumped by the grid to trigger `refresh` without re-mounting. */
  @Input('argentHeaderOutletVersion') version = 0;

  private ref: ComponentRef<IHeaderAngularComp> | null = null;
  private readonly viewContainerRef = inject(ViewContainerRef);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.component) {
      this.mount();
    } else if (changes.version && this.ref) {
      // State changed (sort/filter/columns) — let the component re-read it.
      this.ref.instance.refresh?.(this.params);
      this.ref.changeDetectorRef.detectChanges();
    }
  }

  private mount(): void {
    this.destroyRef();
    this.viewContainerRef.clear();
    if (!this.component) {
      return;
    }
    this.ref = this.viewContainerRef.createComponent(this.component);
    this.ref.instance.agInit(this.params);
    this.ref.changeDetectorRef.detectChanges();
  }

  private destroyRef(): void {
    this.ref?.destroy();
    this.ref = null;
  }

  ngOnDestroy(): void {
    this.destroyRef();
  }
}
