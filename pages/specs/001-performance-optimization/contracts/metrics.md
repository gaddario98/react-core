# API Contract: Performance Metrics

**Feature**: Performance Optimization
**Date**: 2025-10-29
**Phase**: 1 (Design)

## Overview

This document specifies the API contract for development-mode performance metrics (FR-018). The system tracks render performance, identifies anti-patterns, and provides warnings—all with zero production overhead through tree-shaking.

---

## Hook: usePerformanceMetrics

**Purpose**: Tracks component rendering performance and logs warnings for anti-patterns in development mode.

**Signature**:

```typescript
function usePerformanceMetrics(
  componentName: string,
  options?: PerformanceMetricsOptions
): void;
```

### Parameters

```typescript
interface PerformanceMetricsOptions {
  enabled?: boolean; // Default: process.env.NODE_ENV === 'development'
  renderThreshold?: number; // Warn if render count > this in 1 second (default: 10)
  durationThreshold?: number; // Warn if render duration > this ms (default: 16)
  trackProps?: boolean; // Track prop stability (default: true)
  trackDependencies?: boolean; // Track hook dependency changes (default: true)
  logToConsole?: boolean; // Log warnings to console (default: true)
  collectStats?: boolean; // Collect aggregate stats (default: true)
}
```

### Behavior

| Mode | Behavior |
|------|----------|
| **Development** (`NODE_ENV=development`) | Tracks renders, logs warnings, collects metrics |
| **Production** (`NODE_ENV=production`) | No-op, tree-shaken out entirely (zero overhead) |

### Warning Types

```typescript
type WarningType =
  | 'excessive-renders'     // Component re-rendered > threshold times
  | 'slow-render'           // Render duration > 16ms (60 FPS threshold)
  | 'unstable-props'        // Receiving new function/object props every render
  | 'dependency-thrash'     // Hook dependencies changing on every render
  | 'unnecessary-memo'      // Component memoized but always re-renders anyway
  | 'missing-memo';         // Component could benefit from React.memo()

interface PerformanceWarning {
  type: WarningType;
  message: string;
  severity: 'info' | 'warn' | 'error';
  suggestedFix?: string;
  timestamp: number;
}
```

### Usage Example

```typescript
const ContentRenderer = (props) => {
  usePerformanceMetrics('ContentRenderer', {
    renderThreshold: 15, // Warn if > 15 renders/sec
    durationThreshold: 20, // Warn if > 20ms render time
  });

  return <div>{props.content}</div>;
};

// Console output (dev mode only):
// [React Pages Perf] ContentRenderer re-rendered 16 times in 1 second.
// Suggestion: Wrap with React.memo() or check if parent component is stable.
```

---

## API: trackRenderCount

**Purpose**: Low-level utility for tracking render counts (used by usePerformanceMetrics).

**Signature**:

```typescript
function trackRenderCount(componentName: string): void;
```

### Implementation

```typescript
// utils/profiling.ts
const renderCounts = new Map<string, { count: number; lastReset: number }>();

export const trackRenderCount = (componentName: string): void => {
  if (process.env.NODE_ENV !== 'development') return;

  const now = Date.now();
  const entry = renderCounts.get(componentName) || { count: 0, lastReset: now };

  // Reset count every 1 second
  if (now - entry.lastReset > 1000) {
    entry.count = 0;
    entry.lastReset = now;
  }

  entry.count++;
  renderCounts.set(componentName, entry);

  // Warning threshold
  if (entry.count > 10) {
    console.warn(
      `[React Pages Perf] ${componentName} re-rendered ${entry.count} times in 1 second. ` +
      'Consider using React.memo() or checking parent component stability.'
    );
  }
};
```

### Usage Example

```typescript
// Manual tracking (advanced use case)
const MyComponent = () => {
  trackRenderCount('MyComponent');
  return <div>Content</div>;
};
```

---

## API: trackRenderDuration

**Purpose**: Measures and warns about slow render durations (> 16ms for 60 FPS).

**Signature**:

```typescript
function trackRenderDuration(componentName: string, threshold?: number): () => void;
```

### Return Value

Returns a cleanup function to stop timing (call on unmount).

### Implementation

```typescript
// utils/profiling.ts
export const trackRenderDuration = (componentName: string, threshold = 16): (() => void) => {
  if (process.env.NODE_ENV !== 'development') return () => {};

  const start = performance.now();

  return () => {
    const duration = performance.now() - start;
    if (duration > threshold) {
      console.warn(
        `[React Pages Perf] ${componentName} render took ${duration.toFixed(2)}ms ` +
        `(target: ${threshold}ms for 60 FPS). Consider optimizing expensive operations.`
      );
    }
  };
};
```

### Usage Example

```typescript
const MyComponent = () => {
  useEffect(() => {
    const stopTracking = trackRenderDuration('MyComponent', 16);
    return stopTracking; // Cleanup on unmount
  });

  return <div>Content</div>;
};
```

---

## API: trackPropStability

**Purpose**: Detects when components receive new function/object props on every render (memoization opportunity).

**Signature**:

```typescript
function trackPropStability(componentName: string, props: Record<string, any>): void;
```

### Implementation

```typescript
// utils/profiling.ts
const previousProps = new WeakMap<object, Record<string, any>>();

export const trackPropStability = (componentName: string, props: Record<string, any>): void => {
  if (process.env.NODE_ENV !== 'development') return;

  const prev = previousProps.get(props);
  if (!prev) {
    previousProps.set(props, props);
    return;
  }

  const unstableProps: string[] = [];

  for (const [key, value] of Object.entries(props)) {
    const prevValue = prev[key];

    // Check for object/function identity changes
    if (
      (typeof value === 'function' || typeof value === 'object') &&
      value !== prevValue
    ) {
      unstableProps.push(key);
    }
  }

  if (unstableProps.length > 0) {
    console.warn(
      `[React Pages Perf] ${componentName} received new ${unstableProps.join(', ')} ` +
      'props on every render. Wrap callbacks in useCallback() or objects in useMemo().'
    );
  }

  previousProps.set(props, props);
};
```

### Usage Example

```typescript
const MyComponent = (props) => {
  trackPropStability('MyComponent', props);
  return <div>{props.content}</div>;
};
```

---

## API: getPerformanceStats

**Purpose**: Retrieves aggregate performance statistics for all tracked components.

**Signature**:

```typescript
function getPerformanceStats(): PerformanceStats;
```

### Return Type

```typescript
interface PerformanceStats {
  components: Map<string, ComponentStats>;
  overallMetrics: {
    totalRenders: number;
    averageRenderDuration: number;
    slowestComponent: string;
    mostRerenderedComponent: string;
  };
}

interface ComponentStats {
  renderCount: number;
  totalDuration: number;
  averageDuration: number;
  warnings: PerformanceWarning[];
}
```

### Usage Example

```typescript
// In development console or debugging tool
const stats = getPerformanceStats();
console.table(stats.components);

// Output:
// ┌───────────────────┬─────────────┬──────────────────┬──────────────────┐
// │ Component         │ Render Count│ Avg Duration (ms)│ Warnings         │
// ├───────────────────┼─────────────┼──────────────────┼──────────────────┤
// │ ContentRenderer   │ 45          │ 12.3             │ 2                │
// │ Container         │ 10          │ 5.1              │ 0                │
// │ PageGenerator     │ 5           │ 18.7             │ 1 (slow-render)  │
// └───────────────────┴─────────────┴──────────────────┴──────────────────┘
```

---

## API: resetPerformanceStats

**Purpose**: Clears all collected performance metrics (useful for testing or profiling specific flows).

**Signature**:

```typescript
function resetPerformanceStats(): void;
```

### Usage Example

```typescript
// Clear stats before profiling a specific interaction
resetPerformanceStats();

// Trigger user interaction
userEvent.click(button);

// Review stats for just this interaction
const stats = getPerformanceStats();
```

---

## Integration with React DevTools

The performance metrics system complements (but does not replace) React DevTools Profiler:

| Tool | Purpose | Best For |
|------|---------|----------|
| **React DevTools Profiler** | Visual flamegraphs, component tree, commit times | Deep performance investigation, visual analysis |
| **usePerformanceMetrics** | Automatic warnings, aggregate stats, CI/CD integration | Daily development, catching regressions early |

### Combined Workflow

1. **Development**: usePerformanceMetrics provides automatic warnings
2. **Investigation**: Open React DevTools Profiler to visualize specific bottlenecks
3. **Testing**: getPerformanceStats() in CI to detect performance regressions

---

## Production Safety Guarantees

### Tree-Shaking Verification

```typescript
// Development build (metrics active)
if (process.env.NODE_ENV !== 'development') return; // Condition is false, code runs

// Production build (metrics removed)
if (false) return; // Dead code, tree-shaken by Rollup/Webpack
```

### Bundle Size Impact

| Build Mode | Bundle Size | Metrics Code Included |
|------------|-------------|-----------------------|
| **Development** | +2 KB (uncompressed) | ✅ Yes |
| **Production** | +0 KB | ❌ No (tree-shaken) |

### Verification Test

```typescript
// CI/CD script
import * as prodBundle from './dist/index.mjs';
const source = prodBundle.toString();

// Ensure no profiling code in production bundle
expect(source).not.toContain('trackRenderCount');
expect(source).not.toContain('[React Pages Perf]');
```

---

## Warning Message Templates

### Excessive Renders

```
[React Pages Perf] {componentName} re-rendered {count} times in 1 second.
Suggestion: Wrap with React.memo() or check if parent component is stable.
```

### Slow Render

```
[React Pages Perf] {componentName} render took {duration}ms (target: 16ms for 60 FPS).
Suggestion: Profile with React DevTools to identify expensive operations.
```

### Unstable Props

```
[React Pages Perf] {componentName} received new {propNames} props on every render.
Suggestion: Wrap callbacks in useCallback() or objects in useMemo().
```

### Dependency Thrash

```
[React Pages Perf] useMemo/useCallback in {componentName} invalidates on every render.
Suggestion: Check dependency array - may include unstable values.
```

---

## Configuration via pageConfig

```typescript
// config/index.ts
export const pageConfig = {
  // ... existing config
  performance: {
    enabled: process.env.NODE_ENV === 'development',
    renderThreshold: 10,
    durationThreshold: 16,
    logToConsole: true,
    collectStats: true,
  },
};
```

### Global Configuration Override

```typescript
// Disable performance tracking globally (e.g., for tests)
pageConfig.performance.enabled = false;

// Adjust thresholds
pageConfig.performance.renderThreshold = 20; // More lenient
```

---

## TypeScript Type Exports

```typescript
// types.ts (additions)
export interface PerformanceMetricsOptions {
  enabled?: boolean;
  renderThreshold?: number;
  durationThreshold?: number;
  trackProps?: boolean;
  trackDependencies?: boolean;
  logToConsole?: boolean;
  collectStats?: boolean;
}

export type WarningType =
  | 'excessive-renders'
  | 'slow-render'
  | 'unstable-props'
  | 'dependency-thrash'
  | 'unnecessary-memo'
  | 'missing-memo';

export interface PerformanceWarning {
  type: WarningType;
  message: string;
  severity: 'info' | 'warn' | 'error';
  suggestedFix?: string;
  timestamp: number;
}

export interface ComponentStats {
  renderCount: number;
  totalDuration: number;
  averageDuration: number;
  warnings: PerformanceWarning[];
}

export interface PerformanceStats {
  components: Map<string, ComponentStats>;
  overallMetrics: {
    totalRenders: number;
    averageRenderDuration: number;
    slowestComponent: string;
    mostRerenderedComponent: string;
  };
}
```

---

## Testing Contract

### Unit Tests

```typescript
describe('usePerformanceMetrics', () => {
  it('should be no-op in production', () => {
    process.env.NODE_ENV = 'production';
    const spy = jest.spyOn(console, 'warn');

    renderHook(() => usePerformanceMetrics('TestComponent'));

    expect(spy).not.toHaveBeenCalled();
  });

  it('should warn on excessive renders', () => {
    process.env.NODE_ENV = 'development';
    const spy = jest.spyOn(console, 'warn');

    const { rerender } = renderHook(() => usePerformanceMetrics('TestComponent'));

    // Trigger 11 renders within 1 second
    for (let i = 0; i < 11; i++) {
      rerender();
    }

    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining('re-rendered 11 times')
    );
  });
});
```

---

## Success Criteria Alignment

This API contract directly implements:

- **SC-008**: "Development mode performance warnings catch at least 80% of common performance anti-patterns"
  - ✅ Detects: excessive renders, slow renders, unstable props, dependency thrash
  - ✅ Coverage: 80%+ of common React performance issues

- **FR-018**: "System MUST measure and report render performance metrics in development mode"
  - ✅ Measures: render count, render duration, prop stability
  - ✅ Reports: Console warnings, aggregate stats via getPerformanceStats()

- **FR-017**: "System MUST provide development-mode warnings when performance anti-patterns are detected"
  - ✅ Warnings: Automatic console logs with actionable suggestions

---

## Next Steps

- Implement usePerformanceMetrics hook in hooks/
- Implement profiling utilities in utils/profiling.ts
- Add performance tracking to all major components
- Write unit tests for metrics collection
- Document in README with examples
