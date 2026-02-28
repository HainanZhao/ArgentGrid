import { Component, Input, Output, EventEmitter, OnInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'argent-set-filter',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="set-filter">
      <!-- Search Box -->
      <div class="set-filter-search">
        <input
          type="text"
          [value]="searchText"
          (input)="onSearchInput($event)"
          placeholder="Search..."
          class="set-filter-input"
        />
      </div>

      <!-- Select All / Clear All -->
      <div class="set-filter-actions">
        <button
          type="button"
          (click)="selectAll()"
          class="set-filter-btn"
        >
          Select All
        </button>
        <button
          type="button"
          (click)="clearAll()"
          class="set-filter-btn"
        >
          Clear All
        </button>
      </div>

      <!-- Checkbox List -->
      <div class="set-filter-list">
        @for (item of filteredValues; track item.value) {
          <label class="set-filter-item">
            <input
              type="checkbox"
              [checked]="item.selected"
              (change)="onValueToggled(item.value, $event)"
            />
            <span class="set-filter-label">{{ item.displayValue }}</span>
            <span class="set-filter-count">({{ item.count }})</span>
          </label>
        } @empty {
          <div class="set-filter-empty">
            No values found
          </div>
        }
      </div>

      <!-- Action Buttons -->
      <div class="set-filter-footer">
        <button
          type="button"
          (click)="applyFilter()"
          class="set-filter-apply"
        >
          Apply
        </button>
        <button
          type="button"
          (click)="resetFilter()"
          class="set-filter-reset"
        >
          Reset
        </button>
      </div>
    </div>
  `,
  styles: [`
    .set-filter {
      display: flex;
      flex-direction: column;
      width: 250px;
      max-height: 400px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 13px;
    }

    .set-filter-search {
      padding: 8px;
      border-bottom: 1px solid #e0e0e0;
    }

    .set-filter-input {
      width: 100%;
      padding: 6px 10px;
      border: 1px solid #d0d0d0;
      border-radius: 4px;
      font-size: 13px;
      box-sizing: border-box;
    }

    .set-filter-input:focus {
      outline: none;
      border-color: #4f46e5;
      box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.2);
    }

    .set-filter-actions {
      display: flex;
      gap: 8px;
      padding: 8px;
      border-bottom: 1px solid #e0e0e0;
    }

    .set-filter-btn {
      flex: 1;
      padding: 4px 8px;
      border: 1px solid #d0d0d0;
      border-radius: 4px;
      background: #fff;
      cursor: pointer;
      font-size: 12px;
    }

    .set-filter-btn:hover {
      background: #f5f5f5;
      border-color: #4f46e5;
    }

    .set-filter-list {
      flex: 1;
      overflow-y: auto;
      padding: 8px 0;
      max-height: 250px;
    }

    .set-filter-item {
      display: flex;
      align-items: center;
      padding: 4px 12px;
      cursor: pointer;
      gap: 8px;
    }

    .set-filter-item:hover {
      background: #f5f5f5;
    }

    .set-filter-item input[type="checkbox"] {
      margin: 0;
      cursor: pointer;
    }

    .set-filter-label {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .set-filter-count {
      color: #999;
      font-size: 11px;
      margin-left: 4px;
    }

    .set-filter-empty {
      padding: 16px;
      text-align: center;
      color: #999;
      font-style: italic;
    }

    .set-filter-footer {
      display: flex;
      gap: 8px;
      padding: 8px;
      border-top: 1px solid #e0e0e0;
    }

    .set-filter-apply,
    .set-filter-reset {
      flex: 1;
      padding: 6px 12px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 13px;
    }

    .set-filter-apply {
      background: #4f46e5;
      color: #fff;
    }

    .set-filter-apply:hover {
      background: #4338ca;
    }

    .set-filter-reset {
      background: #f5f5f5;
      color: #333;
    }

    .set-filter-reset:hover {
      background: #e5e5e5;
    }
  `]
})
export class SetFilterComponent<T = any> implements OnInit {
  @Input() values: T[] = [];
  @Input() valueFormatter?: (value: T) => string;
  @Output() filterChanged = new EventEmitter<T[]>();

  searchText = '';
  selectedValues: T[] = [];
  allValues: Array<{ value: T; displayValue: string; count: number; selected: boolean }> = [];

  get filteredValues() {
    if (!this.searchText) {
      return this.allValues;
    }
    const search = this.searchText.toLowerCase();
    return this.allValues.filter(item => 
      item.displayValue.toLowerCase().includes(search)
    );
  }

  ngOnInit(): void {
    this.initializeValues();
  }

  onSearchInput(event: Event): void {
    this.searchText = (event.target as HTMLInputElement).value;
  }

  private initializeValues(): void {
    // Count occurrences of each value
    const valueCounts = new Map<T, number>();
    this.values.forEach(value => {
      valueCounts.set(value, (valueCounts.get(value) || 0) + 1);
    });

    // Build value list with counts
    this.allValues = Array.from(valueCounts.entries()).map(([value, count]) => ({
      value,
      displayValue: this.valueFormatter ? this.valueFormatter(value) : String(value),
      count,
      selected: true // All selected by default
    }));

    this.selectedValues = this.values.filter((v, i, arr) => arr.indexOf(v) === i);
  }

  onSearchChanged(): void {
    // Trigger change detection through filteredValues getter
  }

  onValueToggled(value: T, event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    const item = this.allValues.find(v => v.value === value);
    if (item) {
      item.selected = checkbox.checked;
    }

    this.updateSelectedValues();
  }

  selectAll(): void {
    this.allValues.forEach(item => item.selected = true);
    this.updateSelectedValues();
  }

  clearAll(): void {
    this.allValues.forEach(item => item.selected = false);
    this.updateSelectedValues();
  }

  private updateSelectedValues(): void {
    this.selectedValues = this.allValues
      .filter(item => item.selected)
      .map(item => item.value);
  }

  applyFilter(): void {
    this.filterChanged.emit(this.selectedValues);
  }

  resetFilter(): void {
    this.searchText = '';
    this.initializeValues();
    this.filterChanged.emit(this.selectedValues);
  }
}
