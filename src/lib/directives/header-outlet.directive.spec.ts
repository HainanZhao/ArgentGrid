import {
  Component,
  type OnDestroy,
  provideExperimentalZonelessChangeDetection,
  SimpleChange,
  ViewChild,
} from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import type { IHeaderAngularComp, IHeaderParams } from '../types/ag-grid-types';
import { ArgentHeaderOutletDirective } from './header-outlet.directive';

let agInitCount = 0;
let refreshCount = 0;
let destroyCount = 0;
let lastAgInitParams: IHeaderParams | null = null;

@Component({ standalone: true, template: `<span class="hdr">{{ label }}</span>` })
class TestHeader implements IHeaderAngularComp, OnDestroy {
  label = '';
  agInit(p: IHeaderParams): void {
    agInitCount++;
    lastAgInitParams = p;
    this.label = p.displayName;
  }
  refresh(p: IHeaderParams): void {
    refreshCount++;
    this.label = `${p.displayName}*`;
  }
  ngOnDestroy(): void {
    destroyCount++;
  }
}

/** A second component class to exercise re-mounting on a component swap. */
@Component({ standalone: true, template: `<span class="hdr2">other</span>` })
class OtherHeader implements IHeaderAngularComp {
  agInit(): void {
    agInitCount++;
  }
}

@Component({
  standalone: true,
  imports: [ArgentHeaderOutletDirective],
  template: `<ng-container
    [argentHeaderOutlet]="comp"
    [argentHeaderOutletParams]="params"
    [argentHeaderOutletVersion]="version"
  ></ng-container>`,
})
class HostComponent {
  @ViewChild(ArgentHeaderOutletDirective) dir!: ArgentHeaderOutletDirective;
  comp: any = null;
  params: IHeaderParams = { displayName: 'Name' } as IHeaderParams;
  version = 0;
}

function makeParams(displayName: string): IHeaderParams {
  return { displayName } as IHeaderParams;
}

describe('ArgentHeaderOutletDirective', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  beforeEach(() => {
    agInitCount = 0;
    refreshCount = 0;
    destroyCount = 0;
    lastAgInitParams = null;
    TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideExperimentalZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
  });

  /** Mount via one real CD pass (wires the directive + its ViewContainerRef),
   * then drive further lifecycle manually for determinism under zoneless CD. */
  function mount(component: any, params: IHeaderParams): void {
    host.comp = component;
    host.params = params;
    fixture.detectChanges();
  }

  it('mounts the component and calls agInit once with params', () => {
    mount(TestHeader, makeParams('Priority'));
    expect(agInitCount).toBe(1);
    expect(refreshCount).toBe(0);
    expect(lastAgInitParams?.displayName).toBe('Priority');
    expect(fixture.nativeElement.querySelector('.hdr')?.textContent).toBe('Priority');
  });

  it('calls refresh (not agInit) when the version bumps', () => {
    mount(TestHeader, makeParams('Priority'));
    host.dir.version = 1;
    host.dir.ngOnChanges({ version: new SimpleChange(0, 1, false) });
    expect(agInitCount).toBe(1); // not re-mounted
    expect(refreshCount).toBe(1);
  });

  it('does not mount anything when component is null', () => {
    mount(null, makeParams('Name'));
    expect(agInitCount).toBe(0);
    expect(fixture.nativeElement.querySelector('.hdr')).toBeNull();
  });

  it('re-mounts (destroy old + agInit new) when the component class changes', () => {
    mount(TestHeader, makeParams('Name'));
    expect(agInitCount).toBe(1);
    expect(destroyCount).toBe(0);

    host.dir.component = OtherHeader;
    host.dir.ngOnChanges({ component: new SimpleChange(TestHeader, OtherHeader, false) });
    expect(destroyCount).toBe(1); // old TestHeader torn down
    expect(agInitCount).toBe(2); // OtherHeader's agInit ran
  });

  it('tears down the hosted component on destroy', () => {
    mount(TestHeader, makeParams('Name'));
    expect(destroyCount).toBe(0);
    fixture.destroy();
    expect(destroyCount).toBe(1);
  });
});
