# Quickstart: Performance Testing Guide

**Feature**: React Pages Performance Optimization
**Date**: 2025-10-29
**Phase**: 1 (Design)

## Overview

This guide provides step-by-step instructions for testing the performance optimizations in the React Pages library. It covers render performance profiling, bundle size analysis, and verification of all success criteria (SC-001 through SC-010).

---

## Prerequisites

Before testing, ensure you have:

```bash
# Install dependencies
npm install

# Install development tools
npm install --save-dev @testing-library/react @testing-library/react-hooks vitest

# Optional: Bundle analyzer
npm install --save-dev rollup-plugin-visualizer rollup-plugin-filesize
```

---

## Test 1: Verify Stable References (User Story 2)

**Goal**: Confirm that hooks return stable references (callbacks, objects) across re-renders.

### Setup

```typescript
// tests/performance/stable-references.test.tsx
import { renderHook, act } from '@testing-library/react-hooks';
import { usePageConfig } from '../../hooks/usePageConfig';

describe('Stable References', () => {
  it('should maintain stable setValue callback', () => {
    const config = {
      queries: [],
      form: { data: [{ name: 'username', type: 'text' }] },
      ns: 'test',
    };

    const { result, rerender } = renderHook(() => usePageConfig(config));
    const setValueRef1 = result.current.setValue;

    // Trigger unrelated re-render
    act(() => {
      rerender();
    });

    const setValueRef2 = result.current.setValue;

    // Verify reference stability
    expect(setValueRef1).toBe(setValueRef2); // ✅ Same reference
  });

  it('should maintain stable allQuery object when data unchanged', () => {
    const config = {
      queries: [
        { type: 'query', key: 'users', queryConfig: { queryKey: ['users'], queryFn: () => Promise.resolve([]) } },
      ],
      ns: 'test',
    };

    const { result, rerender } = renderHook(() => usePageConfig(config));
    const allQueryRef1 = result.current.allQuery;

    rerender();

    const allQueryRef2 = result.current.allQuery;

    expect(allQueryRef1).toBe(allQueryRef2); // ✅ Same reference
  });
});
```

### Expected Outcome

- ✅ All tests pass
- ✅ setValue, allQuery, allMutation references are stable
- ❌ If any test fails, check useMemo/useCallback wrappers in hooks

---

## Test 2: Measure Render Count (User Story 1, SC-002)

**Goal**: Verify that query updates trigger ≤ 3 component re-renders (SC-002).

### Setup with React DevTools Profiler

```typescript
// tests/performance/render-count.test.tsx
import { render, screen } from '@testing-library/react';
import { Profiler, ProfilerOnRenderCallback } from 'react';
import { PageGenerator } from '../../components';

describe('Render Count', () => {
  it('should re-render ≤ 3 times when a query updates', async () => {
    let renderCount = 0;

    const onRender: ProfilerOnRenderCallback = () => {
      renderCount++;
    };

    const { rerender } = render(
      <Profiler id="PageGenerator" onRender={onRender}>
        <PageGenerator
          id="test-page"
          queries={[
            { type: 'query', key: 'users', queryConfig: { queryKey: ['users'], queryFn: fetchUsers } },
          ]}
          contents={[{ type: 'custom', component: <div>Content</div>, index: 0 }]}
        />
      </Profiler>
    );

    // Initial render
    expect(renderCount).toBe(1);

    // Simulate query update
    await act(async () => {
      queryClient.setQueryData(['users'], [{ id: 1, name: 'Alice' }]);
      await waitFor(() => screen.getByText('Content'));
    });

    // Verify re-render count
    expect(renderCount).toBeLessThanOrEqual(3); // ✅ SC-002: Max 3 re-renders
  });
});
```

### Manual Testing with React DevTools

1. Open your test app in browser
2. Open React DevTools → Profiler tab
3. Click "Start Profiling"
4. Trigger a query update (e.g., refetch button)
5. Click "Stop Profiling"
6. Inspect flamegraph:
   - Count how many times `PageGenerator` appears
   - Verify ≤ 3 commits
   - Check which components re-rendered unnecessarily

### Expected Outcome

- ✅ PageGenerator re-renders ≤ 3 times per query update
- ✅ Unrelated components don't re-render
- ❌ If > 3 re-renders, check memoization and prop stability

---

## Test 3: Measure Render Duration (SC-001, SC-005)

**Goal**: Verify that form interactions maintain 60 FPS (< 16ms per render).

### Setup with Performance API

```typescript
// tests/performance/render-duration.test.tsx
import { render, fireEvent } from '@testing-library/react';
import { PageGenerator } from '../../components';

describe('Render Duration', () => {
  it('should render form field updates in < 16ms (60 FPS)', async () => {
    const durations: number[] = [];

    const { getByLabelText } = render(
      <PageGenerator
        id="form-page"
        form={{
          data: Array.from({ length: 20 }, (_, i) => ({
            name: `field${i}`,
            type: 'text',
            placeholder: `Field ${i}`,
          })),
        }}
        contents={[]}
      />
    );

    const input = getByLabelText('Field 0');

    // Measure typing performance
    for (let i = 0; i < 10; i++) {
      const start = performance.now();

      fireEvent.change(input, { target: { value: `Test ${i}` } });

      const duration = performance.now() - start;
      durations.push(duration);
    }

    const averageDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;

    expect(averageDuration).toBeLessThan(16); // ✅ SC-005: 60 FPS
    console.log(`Average render duration: ${averageDuration.toFixed(2)}ms`);
  });
});
```

### Manual Testing with Chrome DevTools

1. Open test app in Chrome
2. Open DevTools → Performance tab
3. Click "Record"
4. Type in a form field rapidly
5. Stop recording
6. Inspect timeline:
   - Look for "Task" blocks (yellow bars)
   - Each block should be < 16ms (60 FPS line)
   - Red blocks = dropped frames (bad)

### Expected Outcome

- ✅ Average render duration < 16ms
- ✅ No red (dropped frame) indicators in timeline
- ❌ If > 16ms, profile with React DevTools to find bottlenecks

---

## Test 4: Bundle Size Analysis (SC-003, SC-006)

**Goal**: Verify tree-shaking works and bundle sizes meet targets.

### Setup Test Apps

Create three test apps to verify tree-shaking:

#### App 1: Full Library Import

```typescript
// test-apps/full-import/src/index.ts
import * as ReactPages from '@gaddario98/react-pages';

console.log(ReactPages);
```

#### App 2: Hooks Only

```typescript
// test-apps/hooks-only/src/index.ts
import { usePageConfig } from '@gaddario98/react-pages/hooks';

console.log(usePageConfig);
```

#### App 3: Components Only

```typescript
// test-apps/components-only/src/index.ts
import { PageGenerator } from '@gaddario98/react-pages/components';

console.log(PageGenerator);
```

### Build and Analyze

```bash
# Build library
npm run build

# Build test apps
cd test-apps/full-import && npm run build
cd ../hooks-only && npm run build
cd ../components-only && npm run build

# Analyze bundle sizes
npx rollup-plugin-filesize dist/index.mjs
npx rollup-plugin-filesize dist/hooks/index.mjs
npx rollup-plugin-filesize dist/components/index.mjs

# Generate bundle visualization
npx rollup-plugin-visualizer dist/bundle-stats.html --open
```

### Expected Outcome

| Import Type | Bundle Size (gzipped) | Pass/Fail |
|-------------|----------------------|-----------|
| **Full library** | < 50 KB | ✅ SC-006 |
| **Hooks only** | < 20 KB | ✅ SC-006 |
| **Components only** | < 20 KB | ✅ SC-006 |
| **Hooks only vs Full** | At least 40% smaller | ✅ SC-003 |

**Manual Verification**:
1. Open `dist/bundle-stats.html` in browser
2. Verify that importing only hooks excludes component code
3. Check for circular dependencies (should be none)

---

## Test 5: Lazy Loading Performance (SC-004)

**Goal**: Verify lazy-loaded pages load 30% faster (time to interactive).

### Setup

```typescript
// tests/performance/lazy-loading.test.tsx
import { render, waitFor } from '@testing-library/react';
import { PageGenerator } from '../../components';
import { lazyWithPreload } from '../../utils/lazy';

describe('Lazy Loading', () => {
  it('should reduce initial load time by 30%', async () => {
    // Test 1: Eager loading (all content loaded upfront)
    const eagerStart = performance.now();
    const { unmount: unmountEager } = render(
      <PageGenerator
        id="eager-page"
        contents={[
          { type: 'custom', component: <HeavyComponent1 />, index: 0 },
          { type: 'custom', component: <HeavyComponent2 />, index: 1 },
          { type: 'custom', component: <HeavyComponent3 />, index: 2 },
        ]}
      />
    );
    await waitFor(() => screen.getByText('Heavy Component 3'));
    const eagerDuration = performance.now() - eagerStart;
    unmountEager();

    // Test 2: Lazy loading (only visible content loaded)
    const HeavyComponent2Lazy = lazyWithPreload(() => import('./HeavyComponent2'));
    const HeavyComponent3Lazy = lazyWithPreload(() => import('./HeavyComponent3'));

    const lazyStart = performance.now();
    const { unmount: unmountLazy } = render(
      <PageGenerator
        id="lazy-page"
        contents={[
          { type: 'custom', component: <HeavyComponent1 />, index: 0 },
          { type: 'custom', component: <Suspense fallback={<div>Loading...</div>}><HeavyComponent2Lazy /></Suspense>, index: 1, hidden: true },
          { type: 'custom', component: <Suspense fallback={<div>Loading...</div>}><HeavyComponent3Lazy /></Suspense>, index: 2, hidden: true },
        ]}
      />
    );
    await waitFor(() => screen.getByText('Heavy Component 1')); // Only first component loaded
    const lazyDuration = performance.now() - lazyStart;
    unmountLazy();

    const improvement = ((eagerDuration - lazyDuration) / eagerDuration) * 100;

    expect(improvement).toBeGreaterThanOrEqual(30); // ✅ SC-004: 30% faster
    console.log(`Lazy loading improvement: ${improvement.toFixed(1)}%`);
  });
});
```

### Expected Outcome

- ✅ Lazy-loaded page is ≥ 30% faster (time to first paint)
- ✅ Hidden components are not in initial bundle
- ❌ If < 30% improvement, verify components are actually lazy-loaded (check Network tab)

---

## Test 6: React Strict Mode Validation (SC-010)

**Goal**: Verify zero warnings about unstable references or improper hook usage.

### Setup

```typescript
// tests/performance/strict-mode.test.tsx
import { StrictMode } from 'react';
import { render } from '@testing-library/react';
import { PageGenerator } from '../../components';

describe('React Strict Mode', () => {
  it('should have zero console warnings in StrictMode', () => {
    const warnSpy = jest.spyOn(console, 'warn');
    const errorSpy = jest.spyOn(console, 'error');

    render(
      <StrictMode>
        <PageGenerator
          id="strict-test"
          queries={[
            { type: 'query', key: 'users', queryConfig: { queryKey: ['users'], queryFn: fetchUsers } },
          ]}
          form={{ data: [{ name: 'username', type: 'text' }] }}
          contents={[{ type: 'custom', component: <div>Test</div>, index: 0 }]}
        />
      </StrictMode>
    );

    // Verify no warnings about unstable references
    expect(warnSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('unstable')
    );
    expect(errorSpy).not.toHaveBeenCalled();

    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });
});
```

### Expected Outcome

- ✅ Zero console warnings/errors in StrictMode
- ✅ Components render twice (StrictMode behavior) without issues
- ❌ If warnings appear, check for unstable refs or incorrect hook usage

---

## Test 7: Development-Mode Performance Warnings (SC-008)

**Goal**: Verify that performance metrics catch 80%+ of common anti-patterns.

### Setup

```typescript
// tests/performance/dev-warnings.test.tsx
import { render } from '@testing-library/react';
import { usePerformanceMetrics } from '../../hooks/usePerformanceMetrics';

describe('Performance Warnings', () => {
  beforeAll(() => {
    process.env.NODE_ENV = 'development';
  });

  it('should warn about excessive renders', () => {
    const warnSpy = jest.spyOn(console, 'warn');

    const BadComponent = () => {
      usePerformanceMetrics('BadComponent');
      const [, forceUpdate] = useState(0);

      // Cause 15 rapid re-renders
      useEffect(() => {
        for (let i = 0; i < 15; i++) {
          forceUpdate(i);
        }
      }, []);

      return <div>Bad</div>;
    };

    render(<BadComponent />);

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('re-rendered 15 times')
    );

    warnSpy.mockRestore();
  });

  it('should warn about slow renders', () => {
    const warnSpy = jest.spyOn(console, 'warn');

    const SlowComponent = () => {
      usePerformanceMetrics('SlowComponent', { durationThreshold: 10 });

      // Simulate expensive computation (> 10ms)
      const expensiveValue = Array.from({ length: 1000000 }, (_, i) => i).reduce((sum, n) => sum + n, 0);

      return <div>{expensiveValue}</div>;
    };

    render(<SlowComponent />);

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('render took')
    );

    warnSpy.mockRestore();
  });
});
```

### Expected Outcome

- ✅ Warnings logged for excessive renders (> 10/sec)
- ✅ Warnings logged for slow renders (> 16ms)
- ✅ Warnings logged for unstable props
- ✅ At least 80% of anti-patterns detected (SC-008)

---

## Test 8: Zero Production Overhead

**Goal**: Verify that performance metrics are tree-shaken in production builds.

### Setup

```bash
# Build production bundle
NODE_ENV=production npm run build

# Search for dev-only code
grep -r "trackRenderCount" dist/
grep -r "\[React Pages Perf\]" dist/
grep -r "usePerformanceMetrics" dist/
```

### Expected Outcome

```bash
# All greps should return no results (code tree-shaken)
$ grep -r "trackRenderCount" dist/
# (no output)

$ grep -r "\[React Pages Perf\]" dist/
# (no output)
```

- ✅ No performance tracking code in production bundle
- ✅ Bundle size same as before adding metrics
- ❌ If code found, check `if (process.env.NODE_ENV !== 'development') return;` guards

---

## Test 9: Rollup Build Warnings (SC-007)

**Goal**: Verify zero Rollup warnings (circular dependencies, side effects).

### Setup

```bash
# Build with verbose output
npm run build -- --silent=false 2>&1 | tee build.log

# Check for warnings
grep -i "warning" build.log
grep -i "circular" build.log
grep -i "side effect" build.log
```

### Expected Outcome

```bash
$ npm run build
✓ built in 1.2s
Bundle sizes:
  dist/index.mjs: 45.2 KB (gzipped)
  dist/hooks/index.mjs: 18.1 KB (gzipped)
  dist/components/index.mjs: 19.3 KB (gzipped)

# No warnings printed
```

- ✅ Zero Rollup warnings (SC-007)
- ✅ No circular dependencies
- ✅ sideEffects: false respected
- ❌ If warnings appear, fix circular imports or side effects

---

## Test 10: Metadata Configuration (Replace react-helmet-async)

**Goal**: Verify custom metadata system works and reduces bundle size.

### Setup

```typescript
// tests/performance/metadata.test.tsx
import { render } from '@testing-library/react';
import { PageGenerator } from '../../components';
import { setMetadata } from '../../config/metadata';

describe('Metadata Configuration', () => {
  it('should set document.title via custom config', () => {
    render(
      <PageGenerator
        id="meta-test"
        meta={{
          title: 'Test Page Title',
          description: 'Test description',
        }}
        contents={[]}
      />
    );

    expect(document.title).toBe('Test Page Title');

    const metaDescription = document.querySelector('meta[name="description"]');
    expect(metaDescription?.getAttribute('content')).toBe('Test description');
  });

  it('should be no-op on React Native', () => {
    // Mock React Native environment
    delete (global as any).document;
    global.navigator = { product: 'ReactNative' } as any;

    // Should not throw
    expect(() => {
      setMetadata({ title: 'Test' });
    }).not.toThrow();
  });
});
```

### Bundle Size Comparison

```bash
# Before (with react-helmet-async)
npm install react-helmet-async
npm run build
# Note bundle size

# After (custom metadata)
npm uninstall react-helmet-async
npm run build
# Compare bundle size

# Expected: ~10 KB gzipped reduction
```

### Expected Outcome

- ✅ Bundle size reduced by ~10 KB gzipped
- ✅ Metadata applied correctly (document.title, <meta> tags)
- ✅ React Native compatible (no-op)
- ❌ If no size reduction, verify react-helmet-async was actually removed from dependencies

---

## Summary Checklist

Use this checklist to verify all success criteria:

- [ ] **SC-001**: Form interactions render in < 16ms (Test 3)
- [ ] **SC-002**: Query updates trigger ≤ 3 re-renders (Test 2)
- [ ] **SC-003**: Selective imports 40% smaller (Test 4)
- [ ] **SC-004**: Lazy loading 30% faster (Test 5)
- [ ] **SC-005**: Typing maintains 60 FPS (Test 3)
- [ ] **SC-006**: Bundle < 50 KB gzipped (Test 4)
- [ ] **SC-007**: Zero Rollup warnings (Test 9)
- [ ] **SC-008**: Catches 80%+ of anti-patterns (Test 7)
- [ ] **SC-009**: Subjective performance improvement (manual user testing)
- [ ] **SC-010**: Zero StrictMode warnings (Test 6)

---

## Troubleshooting

### High Render Count (> 3 re-renders)

**Symptom**: Components re-render more than expected
**Diagnosis**: Check React DevTools Profiler for "why did this update?"
**Fix**: Add useMemo/useCallback wrappers, verify prop stability

### Slow Renders (> 16ms)

**Symptom**: Frame drops, sluggish UI
**Diagnosis**: Profile with Chrome DevTools Performance tab
**Fix**: Optimize expensive computations, defer non-critical work

### Tree-Shaking Not Working

**Symptom**: Bundle size unchanged when importing specific modules
**Diagnosis**: Check for circular imports, side effects at module scope
**Fix**: Remove top-level code execution, verify sideEffects: false

### Metadata Not Applying

**Symptom**: document.title not changing, <meta> tags missing
**Diagnosis**: Check console for errors, verify useEffect runs
**Fix**: Ensure PageGenerator mounts, check platform detection logic

---

## Next Steps

1. Run all tests: `npm test`
2. Fix any failing tests
3. Document performance improvements in CHANGELOG
4. Create migration guide for react-helmet-async removal
5. Proceed to implementation phase (`/speckit.tasks`)
