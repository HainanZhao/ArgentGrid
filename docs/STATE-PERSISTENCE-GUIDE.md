# State Persistence Guide

## Overview

ArgentGrid supports saving and restoring grid state to/from LocalStorage. This allows users to preserve their column configuration, filters, sorting, and grouping across page reloads.

---

## What Gets Saved

| State | Description | Example |
|-------|-------------|---------|
| **Column Order** | Column sequence and configuration | `[{ colId: 'id', width: 100, hide: false }]` |
| **Column Width** | Individual column widths | `{ id: 150, name: 200 }` |
| **Column Visibility** | Hidden/shown columns | `{ salary: false }` |
| **Column Pinning** | Left/right pinned columns | `{ left: ['id'], right: [] }` |
| **Sorting** | Active sort columns | `[{ colId: 'name', sort: 'asc' }]` |
| **Filtering** | Active filters | `{ department: { filter: 'Eng' } }` |
| **Row Grouping** | Grouped columns | `{ rowGroupCols: ['department'] }` |

---

## Basic Usage

### Save State

```typescript
// Save to default key ('argent-grid-state')
gridApi.saveState();

// Save to custom key
gridApi.saveState('my-grid-state');
```

### Restore State

```typescript
// Restore from default key
const restored = gridApi.restoreState();
if (restored) {
  console.log('State restored!');
}

// Restore from custom key
gridApi.restoreState('my-grid-state');
```

### Check if State Exists

```typescript
if (gridApi.hasState('my-grid-state')) {
  console.log('Saved state found!');
}
```

### Clear State

```typescript
// Clear default key
gridApi.clearState();

// Clear custom key
gridApi.clearState('my-grid-state');
```

---

## Advanced Usage

### Get State Object (Without Saving)

```typescript
const state = gridApi.getState();
console.log('Current state:', state);

// State structure:
{
  columnOrder: [
    { colId: 'id', width: 150, hide: false, pinned: false, sort: null }
  ],
  filter: {
    department: { filterType: 'text', type: 'contains', filter: 'Eng' }
  },
  sort: {
    sortModel: [{ colId: 'name', sort: 'asc' }]
  },
  rowGrouping: {
    rowGroupCols: ['department'],
    valueCols: [],
    pivotCols: [],
    isPivotMode: false
  }
}
```

### Set State Directly (Without LocalStorage)

```typescript
const state: GridState = {
  columnOrder: [
    { colId: 'id', width: 150, hide: false, pinned: false }
  ],
  sort: { sortModel: [{ colId: 'name', sort: 'asc' }] }
};

gridApi.setState(state);
```

### Auto-Save on State Changes

```typescript
// Subscribe to state changes
gridApi.gridStateChanged$.subscribe(event => {
  console.log('State changed:', event.type);
  
  // Auto-save on any change
  if (event.type === 'column-resized' || 
      event.type === 'column-moved' || 
      event.type === 'filter-changed' ||
      event.type === 'sort-changed') {
    gridApi.saveState();
  }
});
```

---

## Integration with GridComponent

### Save/Restore on Component Init

```typescript
@Component({
  selector: 'app-my-grid',
  template: `<argent-grid [gridOptions]="gridOptions" #grid></argent-grid>`
})
export class MyGridComponent implements AfterViewInit {
  @ViewChild('grid') gridComponent!: ArgentGridComponent;
  
  ngAfterViewInit() {
    const api = this.gridComponent.getApi();
    
    // Auto-restore on init
    api.restoreState('my-grid-state');
  }
  
  saveState() {
    const api = this.gridComponent.getApi();
    api.saveState('my-grid-state');
  }
}
```

### Save Before Navigation

```typescript
@Component({
  selector: 'app-my-grid',
  template: `
    <argent-grid [gridOptions]="gridOptions" #grid></argent-grid>
    <button (click)="saveAndNavigate()">Save & Exit</button>
  `
})
export class MyGridComponent {
  @ViewChild('grid') gridComponent!: ArgentGridComponent;
  
  saveAndNavigate() {
    const api = this.gridComponent.getApi();
    api.saveState('my-grid-state');
    this.router.navigate(['/other-page']);
  }
}
```

---

## LocalStorage Considerations

### Storage Limits

- **LocalStorage limit:** ~5-10MB per domain
- **Typical grid state:** ~1-10KB
- **Recommendation:** Safe for most use cases

### Multiple Grids on Same Page

Use unique keys for each grid:

```typescript
// Grid 1
gridApi1.saveState('users-grid-state');

// Grid 2
gridApi2.saveState('products-grid-state');
```

### Clearing State on Logout

```typescript
logout() {
  this.gridApi.clearState('my-grid-state');
  this.authService.logout();
}
```

---

## Event Types

The `gridStateChanged$` subject emits events for:

| Event Type | Description |
|------------|-------------|
| `state-saved` | State saved to LocalStorage |
| `state-restored` | State restored from LocalStorage |
| `state-cleared` | State cleared from LocalStorage |
| `column-resized` | Column width changed |
| `column-moved` | Column order changed |
| `column-hidden` | Column visibility changed |
| `filter-changed` | Filter applied/changed |
| `sort-changed` | Sort applied/changed |
| `group-changed` | Row grouping changed |

---

## Examples

### Example 1: Basic Save/Restore

```typescript
// Save current state
gridApi.saveState();

// Later, restore it
gridApi.restoreState();
```

### Example 2: User Preferences

```typescript
// Save with user-specific key
const userId = this.authService.getUserId();
gridApi.saveState(`user-${userId}-grid-state`);

// Restore for specific user
gridApi.restoreState(`user-${userId}-grid-state`);
```

### Example 3: Multiple Views

```typescript
// Save different views
gridApi.saveState('view-all-records');
gridApi.saveState('view-active-only');
gridApi.saveState('view-my-records');

// Switch between views
gridApi.restoreState('view-active-only');
```

### Example 4: Export/Import State

```typescript
// Export state as JSON
const state = gridApi.getState();
const json = JSON.stringify(state);
// Download or send to server

// Import state from JSON
const importedState: GridState = JSON.parse(json);
gridApi.setState(importedState);
```

---

## Troubleshooting

### State Not Restoring

1. **Check if state exists:**
   ```typescript
   console.log('Has state:', gridApi.hasState());
   ```

2. **Check LocalStorage manually:**
   ```javascript
   console.log(localStorage.getItem('argent-grid-state'));
   ```

3. **Check for errors:**
   ```typescript
   gridApi.gridStateChanged$.subscribe(event => {
     console.log('Event:', event);
   });
   ```

### State Too Large

If state is too large for LocalStorage:

1. **Reduce saved columns:**
   ```typescript
   const state = gridApi.getState();
   state.columnOrder = state.columnOrder.filter(col => !col.hide);
   gridApi.setState(state);
   ```

2. **Use sessionStorage instead:**
   ```typescript
   sessionStorage.setItem('grid-state', JSON.stringify(state));
   ```

3. **Save to server:**
   ```typescript
   this.http.post('/api/user/preferences', state).subscribe();
   ```

---

## API Reference

### GridService Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `getState()` | - | `GridState` | Get current state object |
| `setState(state)` | `state: GridState` | `void` | Apply state to grid |
| `saveState(key?)` | `key?: string` | `void` | Save to LocalStorage |
| `restoreState(key?)` | `key?: string` | `boolean` | Restore from LocalStorage |
| `clearState(key?)` | `key?: string` | `void` | Clear from LocalStorage |
| `hasState(key?)` | `key?: string` | `boolean` | Check if state exists |

### GridState Interface

```typescript
interface GridState {
  columnOrder?: ColumnState[];
  filter?: FilterState;
  sort?: SortState;
  rowGrouping?: RowGroupingState;
}
```

---

## Best Practices

### ✅ Do

- Use unique keys for multiple grids
- Save state after significant changes
- Clear state on logout
- Handle LocalStorage errors gracefully
- Document your state keys

### ❌ Don't

- Save state on every single change (debounce instead)
- Store sensitive data in LocalStorage
- Assume LocalStorage is always available
- Forget to clear state when appropriate

---

## See Also

- [Grid API Reference](./GRID-API.md)
- [Column Definitions](./COLUMN-DEFS.md)
- [Filtering Guide](./FILTERING-GUIDE.md)
- [Sorting Guide](./SORTING-GUIDE.md)
