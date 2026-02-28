# Cell Renderer Guide

## Overview

ArgentGrid supports custom cell renderers that return **plain text strings**. The renderer function receives cell data and returns a string that is rendered on the Canvas.

---

## ⚠️ Important Limitations

**Canvas rendering only supports plain text.** HTML/CSS styling is **NOT** supported.

### ✅ Supported

```typescript
// Plain text - works perfectly
cellRenderer: (params) => {
  return params.value;
}

// HTML tags are stripped, text is rendered
cellRenderer: (params) => {
  return `<span>${params.value}</span>`;  // Renders as plain text
}
```

### ❌ NOT Supported

```typescript
// Colors, backgrounds, borders are IGNORED
cellRenderer: (params) => {
  return `<span style="color: red; background: yellow">
    ${params.value}
  </span>`;
  // Only text is rendered - no color, no background
}

// Complex HTML layouts are NOT supported
cellRenderer: (params) => {
  return `<div><strong>${params.value}</strong></div>`;
  // Only text content is rendered
}
```

---

## Usage

### Basic Cell Renderer

```typescript
columnDefs: [
  {
    field: 'status',
    cellRenderer: (params) => {
      return params.value;  // Plain text
    }
  }
]
```

### Conditional Text

```typescript
columnDefs: [
  {
    field: 'status',
    cellRenderer: (params) => {
      return params.value === 'active' ? '✓ Active' : '✗ Inactive';
    }
  }
]
```

### Formatted Values

```typescript
columnDefs: [
  {
    field: 'salary',
    cellRenderer: (params) => {
      return `$${params.value.toLocaleString()}`;
    }
  }
]
```

### With HTML Tags (stripped)

```typescript
columnDefs: [
  {
    field: 'name',
    cellRenderer: (params) => {
      // HTML tags are stripped, but you can use them for semantic purposes
      return `<strong>${params.value}</strong>`;  // Renders as plain text
    }
  }
]
```

---

## Async Cell Renderers (Future)

Async renderers (returning `Promise<string>`) are **not yet supported**. The renderer must return a string synchronously.

```typescript
// NOT YET SUPPORTED
cellRenderer: async (params) => {
  const data = await fetch(`/api/format/${params.value}`);
  return data.text();
}
```

---

## Alternatives for Styled Cells

If you need colored backgrounds, borders, or other styling, use **valueFormatter** instead:

```typescript
// Note: valueFormatter also returns plain text
// For styled cells, we recommend:
// 1. Use different columns for different statuses
// 2. Use row styling based on data
// 3. Future: Consider DOM overlay for complex cells (performance trade-off)
```

---

## Examples

### Status Badge (Text Only)

```typescript
{
  field: 'status',
  cellRenderer: (params) => {
    const icon = params.value === 'active' ? '✓' : '✗';
    return `${icon} ${params.value}`;
  }
}
```

### Currency Formatting

```typescript
{
  field: 'price',
  cellRenderer: (params) => {
    return `$${params.value.toFixed(2)}`;
  }
}
```

### Percentage

```typescript
{
  field: 'completion',
  cellRenderer: (params) => {
    return `${params.value}%`;
  }
}
```

### Date Formatting

```typescript
{
  field: 'startDate',
  cellRenderer: (params) => {
    return new Date(params.value).toLocaleDateString();
  }
}
```

### Truncated Text

```typescript
{
  field: 'description',
  cellRenderer: (params) => {
    const maxLen = 50;
    return params.value.length > maxLen
      ? params.value.substring(0, maxLen) + '...'
      : params.value;
  }
}
```

---

## Performance Notes

- Cell renderers are called **for every visible cell** on each render frame
- Keep renderers **fast and simple**
- Avoid expensive operations (DOM manipulation, network requests, etc.)
- Use **valueFormatter** for simple formatting (slightly faster)

---

## Migration from AG Grid

AG Grid Community supports the same pattern:

```typescript
// AG Grid
{
  field: 'status',
  cellRenderer: (params) => params.value
}

// ArgentGrid (same API)
{
  field: 'status',
  cellRenderer: (params) => params.value
}
```

**Key Difference:** AG Grid DOM-based rendering supports HTML/CSS. ArgentGrid Canvas-based rendering only supports plain text.

---

## Future Enhancements

Planned features (not yet implemented):

- [ ] Async cell renderers (`Promise<string>`)
- [ ] Registered renderer names (`cellRenderer: 'myRenderer'`)
- [ ] cellRendererSelector (choose renderer based on data)
- [ ] Basic style extraction (color, font-weight)

---

## See Also

- [Value Formatter Guide](./VALUE-FORMATTER-GUIDE.md)
- [Column Definitions](./COLUMN-DEFS.md)
- [Canvas Renderer Architecture](./CANVAS-RENDERER.md)
