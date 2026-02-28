# Context Menu Guide

## Overview

ArgentGrid supports custom context menus that appear on right-click. You can customize the menu items using the `getContextMenuItems` callback in `GridOptions`.

---

## Basic Usage

### Default Context Menu

By default, right-clicking a cell shows:

- 📋 **Copy Cell** - Copy cell value to clipboard
- 📋 **Copy with Headers** - Copy range with column headers
- 📁 **Export** - Export to CSV or Excel
- ⟲ **Reset Columns** - Restore original column order/widths

```typescript
gridOptions = {
  // No configuration needed - default menu is automatic
};
```

---

## Custom Context Menu

### Using `getContextMenuItems`

```typescript
gridOptions = {
  getContextMenuItems: (params) => {
    return [
      'copy',
      'copyWithHeaders',
      'separator',
      {
        name: 'Custom Action',
        action: () => {
          console.log('Custom action!', params.node.data);
        },
        icon: '⭐'
      },
      'separator',
      'export',
      'resetColumns'
    ];
  }
};
```

### Parameters

The `getContextMenuItems` callback receives:

```typescript
interface GetContextMenuItemsParams<TData> {
  node: IRowNode<TData>;      // Row node that was clicked
  column: Column;              // Column that was clicked
  api: GridApi<TData>;         // Grid API for programmatic control
  type: 'cell' | 'header';     // Where the click occurred
  event: MouseEvent;           // Original mouse event
}
```

---

## Menu Item Types

### 1. Default Items (String)

Use predefined menu items:

| Key | Description |
|-----|-------------|
| `'copy'` | Copy cell value |
| `'copyWithHeaders'` | Copy range with headers |
| `'export'` | Export submenu (CSV/Excel) |
| `'resetColumns'` | Reset column state |
| `'separator'` | Visual separator |

```typescript
getContextMenuItems: (params) => {
  return ['copy', 'separator', 'export'];
}
```

### 2. Custom Items (MenuItemDef)

Define custom menu items:

```typescript
interface MenuItemDef {
  name: string;           // Display name
  action: () => void;     // Click handler
  icon?: string;          // Optional emoji/icon
  disabled?: boolean;     // Disable item
  subMenu?: MenuItemDef[]; // Nested submenu
  separator?: boolean;    // Separator line
  tooltip?: string;       // Hover tooltip
}
```

**Example:**

```typescript
getContextMenuItems: (params) => {
  return [
    'copy',
    {
      name: 'Delete Row',
      action: () => {
        const rowData = params.node.data;
        console.log('Deleting:', rowData);
        // Your delete logic here
      },
      icon: '🗑️',
      disabled: false,
      tooltip: 'Delete this row'
    }
  ];
}
```

### 3. Submenus

Create nested menus:

```typescript
getContextMenuItems: (params) => {
  return [
    'copy',
    {
      name: 'Actions',
      subMenu: [
        {
          name: 'Edit',
          action: () => this.editRow(params.node.data)
        },
        {
          name: 'Delete',
          action: () => this.deleteRow(params.node.data)
        }
      ]
    }
  ];
}
```

---

## Examples

### Conditional Menu Items

Show different items based on row data:

```typescript
getContextMenuItems: (params) => {
  const items: (string | MenuItemDef)[] = ['copy'];
  
  // Only show delete for certain rows
  if (params.node.data.status === 'inactive') {
    items.push({
      name: 'Delete Inactive Row',
      action: () => this.deleteRow(params.node.data),
      icon: '🗑️'
    });
  }
  
  items.push('separator', 'export');
  return items;
}
```

### Column-Specific Menu

Different menu for specific columns:

```typescript
getContextMenuItems: (params) => {
  if (params.column.colId === 'salary') {
    return [
      'copy',
      {
        name: 'Format as Currency',
        action: () => this.formatAsCurrency(params.node.data)
      },
      'separator',
      'export'
    ];
  }
  
  return ['copy', 'export'];
}
```

### Copy with Custom Format

```typescript
getContextMenuItems: (params) => {
  return [
    {
      name: 'Copy Formatted',
      action: () => {
        const value = params.node.data[params.column.field!];
        const formatted = `$${value.toLocaleString()}`;
        navigator.clipboard.writeText(formatted);
      }
    },
    'copy',
    'export'
  ];
}
```

### Disable Items Conditionally

```typescript
getContextMenuItems: (params) => {
  return [
    'copy',
    {
      name: 'Edit',
      action: () => this.editRow(params.node.data),
      disabled: params.node.data.readOnly === true,
      tooltip: params.node.data.readOnly ? 'Row is read-only' : 'Edit this row'
    }
  ];
}
```

---

## Default Menu Items Reference

| Key | Name | Description |
|-----|------|-------------|
| `'copy'` | Copy Cell | Copy cell value to clipboard |
| `'copyWithHeaders'` | Copy with Headers | Copy range with column headers |
| `'export'` | Export | Submenu with CSV/Excel options |
| `'resetColumns'` | Reset Columns | Restore original column state |
| `'separator'` | — | Visual separator line |

---

## Best Practices

### 1. Keep Menus Short

```typescript
// ✅ Good - 4-6 items max
getContextMenuItems: (params) => {
  return ['copy', 'separator', 'export', 'resetColumns'];
}

// ❌ Bad - Too many items
getContextMenuItems: (params) => {
  return [
    'copy', 'copyWithHeaders', 'export', 'resetColumns',
    'action1', 'action2', 'action3', 'action4', 'action5'
  ];
}
```

### 2. Use Separators Wisely

```typescript
// ✅ Good - Logical grouping
getContextMenuItems: (params) => {
  return [
    'copy', 'copyWithHeaders',  // Copy actions
    'separator',
    'export',                    // Export actions
    'separator',
    'resetColumns'               // Reset actions
  ];
}
```

### 3. Provide Visual Feedback

```typescript
// ✅ Good - With icons
getContextMenuItems: (params) => {
  return [
    { name: 'Copy', action: () => {}, icon: '📋' },
    { name: 'Delete', action: () => {}, icon: '🗑️' },
    { name: 'Edit', action: () => {}, icon: '✏️' }
  ];
}
```

### 4. Handle Errors Gracefully

```typescript
getContextMenuItems: (params) => {
  return [
    {
      name: 'Delete Row',
      action: () => {
        try {
          this.deleteRow(params.node.data);
        } catch (error) {
          console.error('Delete failed:', error);
          // Show user-friendly error message
        }
      }
    }
  ];
}
```

---

## Keyboard Shortcuts

Context menu can be triggered by:

- **Right-click** on cell
- **Shift + F10** (Windows keyboard shortcut)

---

## Accessibility

- Context menu items are keyboard navigable
- **Arrow keys** - Navigate menu items
- **Enter** - Select item
- **Escape** - Close menu

---

## Limitations

- Context menu is **DOM-based overlay** (not Canvas)
- Menu items must be defined **synchronously**
- **Async menu items** not yet supported
- **Icons** are emoji/text only (no custom images yet)

---

## Migration from AG Grid

AG Grid uses the same API:

```typescript
// AG Grid
gridOptions = {
  getContextMenuItems: (params) => {
    return ['copy', 'export'];
  }
}

// ArgentGrid (same API)
gridOptions = {
  getContextMenuItems: (params) => {
    return ['copy', 'export'];
  }
}
```

---

## See Also

- [Cell Renderer Guide](./CELL-RENDERER-GUIDE.md)
- [Value Formatter Guide](./VALUE-FORMATTER-GUIDE.md)
- [Grid Options Reference](./GRID-OPTIONS.md)
