# Live Data Streaming Optimizations

**Scenario:** Grid receiving 10+ entries per second (real-time data feeds, stock tickers, logs, etc.)

---

## 🎯 Performance Challenges

### Current Bottlenecks

1. **Full Re-render on Every Update**
   ```typescript
   // Current: Re-renders all visible rows
   rowData.push(newEntry);
   renderer.renderFrame(); // Re-renders everything
   ```

2. **No Update Batching**
   ```typescript
   // Current: Updates immediately on every entry
   data.push(entry1); render();
   data.push(entry2); render();
   data.push(entry3); render();
   // 3 renders for 3 entries
   ```

3. **Linear Row Lookup**
   ```typescript
   // Current: O(n) search to find row to update
   const rowIndex = rowData.findIndex(r => r.id === id);
   ```

4. **Full Canvas Clear**
   ```typescript
   // Current: Clears entire canvas
   ctx.clearRect(0, 0, width, height);
   ```

---

## 🚀 Optimization Strategies

### Phase 1: Quick Wins (1-2 days) ⭐ **RECOMMENDED TO START HERE**

#### 1.1 **Update Batching** (HIGH IMPACT)

**Problem:** Rendering on every single data point is wasteful.

**Solution:** Buffer updates and render in batches.

```typescript
// Batch updates by time (e.g., 100ms)
private updateBuffer: TData[] = [];
private updateBufferTimer: number | null = null;

addRowData(data: TData): void {
  this.updateBuffer.push(data);
  
  // Batch updates every 100ms (~10fps for data updates)
  if (!this.updateBufferTimer) {
    this.updateBufferTimer = window.setTimeout(() => {
      this.flushUpdateBuffer();
    }, 100);
  }
}

private flushUpdateBuffer(): void {
  if (this.updateBuffer.length === 0) return;
  
  // Add all buffered rows at once
  this.rowData.push(...this.updateBuffer);
  this.updateBuffer = [];
  this.updateBufferTimer = null;
  
  // Trigger single render for all updates
  this.renderFrame();
}
```

**Impact:** 
- 10 entries/sec → 1 render/sec instead of 10 renders/sec
- **90% reduction in render calls**
- Smooth visual updates at 10fps (sufficient for data feeds)

---

#### 1.2 **Incremental Row Rendering** (HIGH IMPACT)

**Problem:** Re-rendering all visible rows when only new rows changed.

**Solution:** Only render new/changed rows.

```typescript
// Track which rows need rendering
private dirtyRows: Set<number> = new Set();

markRowDirty(rowIndex: number): void {
  this.dirtyRows.add(rowIndex);
}

private renderDirtyRowsOnly(): void {
  if (this.dirtyRows.size === 0) return;
  
  // Only render dirty rows
  this.dirtyRows.forEach(rowIndex => {
    const rowNode = this.gridApi.getDisplayedRowAtIndex(rowIndex);
    if (rowNode) {
      const y = rowIndex * this.rowHeight - this.scrollTop;
      this.renderRow(rowIndex, y, rowNode, ...);
    }
  });
  
  this.dirtyRows.clear();
}
```

**Impact:**
- 90-95% less rendering work for sparse updates
- Only new/changed rows are rendered

---

#### 1.3 **Row ID Indexing** (MEDIUM IMPACT)

**Problem:** O(n) lookup to find row by ID for updates.

**Solution:** Maintain index for O(1) lookup.

```typescript
// Row index by ID for O(1) updates
private rowIndexById: Map<string, number> = new Map();

addRow(data: TData & { id: string }): void {
  const index = this.rowData.length;
  this.rowData.push(data);
  this.rowIndexById.set(data.id, index);
}

updateRow(id: string, updates: Partial<TData>): void {
  const index = this.rowIndexById.get(id);
  if (index !== undefined) {
    Object.assign(this.rowData[index], updates);
    this.markRowDirty(index);
  }
}

removeRow(id: string): void {
  const index = this.rowIndexById.get(id);
  if (index !== undefined) {
    this.rowData.splice(index, 1);
    this.rowIndexById.delete(id);
    // Rebuild index (or use more sophisticated data structure)
    this.rebuildRowIndex();
  }
}
```

**Impact:**
- Row lookup: O(n) → O(1)
- Essential for frequent updates by ID

---

#### 1.4 **Smart Damage Tracking** (MEDIUM IMPACT)

**Problem:** Clearing entire canvas when only few rows changed.

**Solution:** Only clear damaged row areas.

```typescript
private renderDirtyRowsOnly(): void {
  const dirtyRowsArray = Array.from(this.dirtyRows);
  
  dirtyRowsArray.forEach(rowIndex => {
    const y = rowIndex * this.rowHeight - this.scrollTop;
    
    // Only clear this row's area, not entire canvas
    this.ctx.clearRect(0, y, this.viewportWidth, this.rowHeight);
    
    // Render only this row
    const rowNode = this.gridApi.getDisplayedRowAtIndex(rowIndex);
    if (rowNode) {
      this.renderRow(rowIndex, y, rowNode, ...);
    }
  });
  
  this.dirtyRows.clear();
}
```

**Impact:**
- 80-90% less canvas clearing
- Faster partial updates

---

### Phase 2: Advanced Optimizations (2-3 days)

#### 2.1 **Web Worker for Data Processing**

Move filtering/sorting off main thread:

```typescript
// Main thread
private worker = new Worker('./data-processor.worker.ts');

processIncomingData(data: TData[]): void {
  this.worker.postMessage({
    type: 'FILTER_AND_SORT',
    data,
    filterModel: this.filterModel,
    sortModel: this.sortModel,
  });
}

// Worker thread
self.onmessage = (e) => {
  const { data, filterModel, sortModel } = e.data;
  
  // Process in worker (doesn't block UI)
  const filtered = applyFilters(data, filterModel);
  const sorted = applySort(filtered, sortModel);
  
  self.postMessage({ type: 'PROCESSED', data: sorted });
};
```

**Impact:**
- UI stays responsive during heavy data processing
- 2-10x faster for large datasets

---

#### 2.2 **Row Object Pooling**

Reuse row objects instead of creating new ones:

```typescript
private rowPool: RowData[] = [];

getRowFromPool(): RowData {
  return this.rowPool.pop() || { id: '', data: {} };
}

returnRowToPool(row: RowData): void {
  row.data = {}; // Clear data
  this.rowPool.push(row);
}
```

**Impact:**
- Reduces garbage collection pressure
- 10-20% better memory efficiency

---

#### 2.3 **Adaptive Render Rate**

Adjust render rate based on update frequency:

```typescript
private updateFrequency = 0;
private lastUpdateTime = 0;
private targetFPS = 60;

updateRow(data: TData): void {
  const now = performance.now();
  const delta = now - this.lastUpdateTime;
  this.updateFrequency = 1000 / delta; // updates per second
  this.lastUpdateTime = now;
  
  // Adapt render rate based on update frequency
  if (this.updateFrequency > 30) {
    // High frequency: batch more aggressively
    this.targetFPS = 10;
    this.batchInterval = 100;
  } else if (this.updateFrequency > 10) {
    // Medium frequency
    this.targetFPS = 30;
    this.batchInterval = 33;
  } else {
    // Low frequency: render normally
    this.targetFPS = 60;
    this.batchInterval = 16;
  }
}
```

**Impact:**
- Automatically optimizes for data rate
- Smooth visuals at all update frequencies

---

## 📊 Expected Performance Gains

### Scenario: 10 entries/second

| Optimization | Before | After | Improvement |
|--------------|--------|-------|-------------|
| **Render Calls/sec** | 10 | 1 | **90% reduction** |
| **Rows Rendered/sec** | 100 (10 rows × 10 updates) | 10 (10 new rows) | **90% reduction** |
| **Canvas Clear Area** | 100% | 10% | **90% reduction** |
| **Row Lookup Time** | O(n) | O(1) | **100x faster** |
| **Main Thread Load** | 50% | 5% | **90% reduction** |

### Scenario: 100 entries/second

| Optimization | Before | After | Improvement |
|--------------|--------|-------|-------------|
| **Render Calls/sec** | 100 | 10 | **90% reduction** |
| **UI Responsiveness** | Laggy | Smooth | **10x better** |
| **Memory Allocations** | High | Low | **80% reduction** |

---

## 🛠️ Implementation Priority

### Start Here (Phase 1 - 1-2 days):

1. **Update Batching** ✅
   - Easiest to implement
   - Biggest immediate impact
   - No API changes needed

2. **Row ID Indexing** ✅
   - Essential for updates
   - Simple Map-based implementation
   - Enables O(1) updates

3. **Dirty Row Tracking** ✅
   - Works with batching
   - Incremental rendering
   - Smart damage tracking

### Next (Phase 2 - 2-3 days):

4. **Web Worker Processing**
   - For heavy filtering/sorting
   - Keeps UI responsive
   - More complex implementation

5. **Adaptive Render Rate**
   - Automatic optimization
   - Handles varying data rates
   - Nice-to-have feature

---

## 💡 Usage Example

### Before (Current)

```typescript
// User's code
dataFeed.onData((entry) => {
  gridApi.applyTransaction({ add: [entry] });
  // Triggers immediate re-render
  // 10 entries = 10 renders
});
```

### After (Optimized)

```typescript
// User's code (same API!)
dataFeed.onData((entry) => {
  gridApi.applyTransaction({ add: [entry] });
  // Automatically batched
  // 10 entries = 1 render
});

// Optional: Configure batching
gridApi.setGridOption('batchUpdates', true);
gridApi.setGridOption('batchInterval', 100); // ms
```

---

## 🎯 Recommended Implementation Plan

### Day 1: Core Optimizations

- [ ] Add update batching (100ms default)
- [ ] Add row ID indexing
- [ ] Add dirty row tracking
- [ ] Test with 10 entries/sec
- [ ] Test with 100 entries/sec

### Day 2: Refinement

- [ ] Add smart damage tracking
- [ ] Add configuration options
- [ ] Performance benchmarks
- [ ] Documentation

### Day 3-4: Advanced (Optional)

- [ ] Web Worker implementation
- [ ] Row object pooling
- [ ] Adaptive render rate

---

## 📈 Success Metrics

### Target Performance

| Metric | Target | Measurement |
|--------|--------|-------------|
| **10 entries/sec** | <5% CPU | Chrome DevTools |
| **100 entries/sec** | <20% CPU | Chrome DevTools |
| **UI Responsiveness** | 60fps | requestAnimationFrame |
| **Memory Growth** | <1MB/min | Chrome Memory tab |
| **Update Latency** | <200ms | Custom timing |

### Benchmark Test

```typescript
// Test with 1000 entries at 10/sec
const entries = generateEntries(1000);
let index = 0;

const interval = setInterval(() => {
  gridApi.applyTransaction({ add: [entries[index++]] });
  
  if (index >= entries.length) {
    clearInterval(interval);
    console.log('Test complete');
    console.log('Avg FPS:', getAverageFPS());
    console.log('CPU Usage:', getCPUUsage());
  }
}, 100); // 10 entries/sec
```

---

## ⚠️ Trade-offs

### Update Batching

**Pros:**
- 90% fewer renders
- Smoother visuals
- Lower CPU usage

**Cons:**
- Up to 100ms update latency
- Not suitable for real-time trading (<10ms required)

**Mitigation:**
- Make batch interval configurable
- Provide `flushUpdates()` method for immediate render

---

### Dirty Row Tracking

**Pros:**
- 90% less rendering work
- Lower GPU usage

**Cons:**
- Slightly more complex state management
- Need to track dirty rows

**Mitigation:**
- Fallback to full render if dirty rows > threshold
- Auto-clear dirty rows after render

---

## ✅ Recommendation

**For 10 entries/second scenario:**

1. **Start with Phase 1 optimizations** (1-2 days)
   - Update batching (100ms interval)
   - Row ID indexing
   - Dirty row tracking
   
2. **Measure performance**
   - Should achieve <5% CPU usage
   - Smooth 60fps scrolling
   - <200ms update latency

3. **Add Phase 2 if needed** (2-3 days)
   - Web Workers for heavy processing
   - Adaptive render rate

**Expected Result:** Handle 100+ entries/second with smooth 60fps rendering and <10% CPU usage.

---

**Status:** Ready to implement  
**Priority:** HIGH for live data scenarios  
**Estimated Time:** 1-2 days for Phase 1
