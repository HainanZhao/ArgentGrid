import { Component } from '@angular/core';
import type { ICellRendererAngularComp, ICellRendererParams } from '../lib/types/ag-grid-types';

@Component({
  template: `
    <div [style]="getStyle()">
      <span [style.fontSize]="'11px'" [style.fontWeight]="'600'">{{ formattedValue }}</span>
    </div>
  `,
  styles: [
    `
      :host {
        display: flex;
        align-items: center;
        width: 100%;
        height: 100%;
      }
      div {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
      }
    `,
  ],
  standalone: true,
})
export class StatusCellRendererComponent implements ICellRendererAngularComp {
  value: any;
  formattedValue = '';

  agInit(params: ICellRendererParams): void {
    this.value = params.value;
    this.formattedValue = params.formattedValue || String(params.value ?? '');
  }

  refresh(params: ICellRendererParams): boolean {
    this.value = params.value;
    this.formattedValue = params.formattedValue || String(params.value ?? '');
    return true;
  }

  getStyle(): { [key: string]: string } {
    const colorMap: Record<string, { bg: string; color: string }> = {
      Active: { bg: '#dcfce7', color: '#16a34a' },
      'On Leave': { bg: '#fef3c7', color: '#d97706' },
      Remote: { bg: '#dbeafe', color: '#2563eb' },
      Travel: { bg: '#f3e8ff', color: '#9333ea' },
    };
    const colors = colorMap[this.value] || { bg: '#f3f4f6', color: '#6b7280' };
    return {
      backgroundColor: colors.bg,
      color: colors.color,
    };
  }
}
