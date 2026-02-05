# Research: React Pages Performance Optimization

**Feature**: Performance Optimization
**Date**: 2025-10-29
**Phase**: 0 (Technology Research)

## Overview

This document consolidates research findings for optimizing the React Pages library's performance. Research covers React Compiler integration, memoization patterns, custom metadata configuration (replacing react-helmet-async), tree-shaking best practices, and development-mode performance instrumentation.

---

## Research Item 1: React Compiler Integration

**Decision**: Integrate `babel-plugin-react-compiler@1` for automatic memoization

**Rationale**:
- **Automatic optimization**: React Compiler analyzes component code and automatically inserts React.memo(), useMemo(), and useCallback() where beneficial, reducing manual memoization burden
- **Zero runtime overhead**: Babel plugin transforms code at build time; no runtime cost
- **React 19 compatibility**: Compiler is designed for React 19+ and leverages automatic batching, improved memo comparison
- **User requirement**: Explicitly requested by user ("Cerca di usare anche react compiler")
- **Constitution alignment**: Exceeds Principle IV (Performance & Bundle Optimization) by automating best practices

**Alternatives Considered**:
1. **Manual memoization only** (React.memo, useMemo, useCallback everywhere)
   - **Rejected**: Error-prone, requires constant vigilance, easy to miss optimization opportunities
   - **Why**: React Compiler catches 90%+ of cases automatically, reducing maintainer burden
2. **Preact Signals or other state primitives**
   - **Rejected**: Breaking change, incompatible with React 19's paradigm, requires rewriting all state logic
   - **Why**: React Compiler works with existing React code, no refactoring required
3. **Million.js (React optimization library)**
   - **Rejected**: Adds runtime overhead, conflicts with React 19's internal optimizations
   - **Why**: React Compiler is official, zero-runtime, designed by React core team

**Implementation Notes**:
- Add to `.babelrc.json`: `{ "plugins": ["babel-plugin-react-compiler"] }`
- Configure compiler options in `babel.config.js` if advanced tuning needed (e.g., skip specific components)
- Verify output in Rollup build: no circular dependencies, tree-shaking still works
- Document in migration guide: consumers may need to update their babel config if importing source files directly (rare)

**References**:
- React Compiler RFC: https://github.com/reactjs/rfcs/blob/main/text/0000-react-compiler.md
- babel-plugin-react-compiler npm: https://www.npmjs.com/package/babel-plugin-react-compiler
- React 19 release notes (automatic batching + compiler synergy)

---

## Research Item 2: Memoization Patterns for Hooks

**Decision**: Implement stable reference patterns using useMemo/useCallback with precise dependency arrays

**Rationale**:
- **Current problem**: Hooks like `usePageConfig` create new `extractQuery` and `extractMutations` functions on every render, causing downstream components to re-render unnecessarily
- **Solution**: Wrap function references in `useCallback`, computed objects in `useMemo`, with minimal dependency arrays
- **Constitution alignment**: Addresses Principle IV requirement "Hooks MUST not cause cascade re-renders"
- **Measurable impact**: Reduces component re-renders from ~10 to ~3 per query update (SC-002)

**Alternatives Considered**:
1. **useRef for stable references**
   - **Rejected for callbacks**: useCallback is clearer intent, better type inference
   - **Accepted for constants**: Use `const EMPTY_ARRAY: [] = []` pattern for stable empty values (already present in `usePageConfig.tsx:18`)
2. **React Context for shared values**
   - **Rejected**: Adds architectural complexity, forces provider nesting, harder to tree-shake
   - **Why**: Direct hook composition with memoization is simpler and more performant
3. **Zustand or other state management**
   - **Rejected**: Breaking change, requires consumer code updates, adds dependency
   - **Why**: Performance issue is memoization, not state management

**Patterns to Implement**:

```typescript
// Pattern 1: Stable callback with minimal dependencies
const stableSetValue = useCallback((name, value) => {
  // implementation
}, []); // Empty if function doesn't close over reactive values

// Pattern 2: Memoized derived data
const extractedQueries = useMemo(() => {
  if (!usedQueries?.length) return allQuery;
  return extractQuery(usedQueries);
}, [allQuery, usedQueries]); // Only recompute when inputs change

// Pattern 3: Stable object reference
const config = useMemo(() => ({
  allMutation,
  allQuery,
  formValues
}), [allMutation, allQuery, formValues]); // Prevent object literal recreation

// Pattern 4: Constant references (already used)
const EMPTY_ARRAY: [] = []; // Outside component
```

**Implementation Targets**:
- `hooks/usePageConfig.tsx`: Stabilize `extractQueryHandle`, `extractMutationsHandle`
- `hooks/useFormData.ts`: Memoize `mappedFormData`, `formSubmit`
- `hooks/useDataExtractor.tsx`: Ensure `extractQuery` and `extractMutations` are stable
- `hooks/useViewSettings.ts`: Prevent recalculation when unrelated form fields change

**References**:
- React useMemo docs: https://react.dev/reference/react/useMemo
- React useCallback docs: https://react.dev/reference/react/useCallback
- Kent C. Dodds: "When to useMemo and useCallback" https://kentcdodds.com/blog/usememo-and-usecallback

---

## Research Item 3: Custom Metadata Configuration (Replacing react-helmet-async)

**Decision**: Remove `react-helmet-async` dependency, implement custom metadata configuration via `config/metadata.ts`

**Rationale**:
- **User requirement**: "elimina react-helmet-async e fai gestire a livello di configurazione custom i metadati"
- **Bundle size reduction**: react-helmet-async is ~10 KB gzipped (20% of target 50 KB budget), removing it frees space for core functionality
- **Simpler API**: Custom config allows direct metadata object instead of JSX components (<Helmet><title>...</title></Helmet>)
- **React Native compatibility**: react-helmet-async is web-only (uses document.title); custom config can have no-op RN implementation
- **Constitution alignment**: Principle I (Component Library First) - metadata as configuration, not runtime dependency

**Alternatives Considered**:
1. **Keep react-helmet-async, make it peer dependency**
   - **Rejected**: Still requires consumers to install it, defeats purpose of removal
   - **Why**: User explicitly requested removal, not just peer-dependency-ification
2. **Use react-helmet (original library)**
   - **Rejected**: Unmaintained, lacks async SSR support, same bundle size issue
3. **next/head or other framework-specific solutions**
   - **Rejected**: Library is framework-agnostic, must work in any React app
   - **Why**: Custom solution gives maximum flexibility

**Implementation Approach**:

```typescript
// config/types.ts
export interface MetadataConfig {
  title?: string;
  description?: string;
  keywords?: string[];
  ogImage?: string;
  canonical?: string;
  robots?: string;
  // ... other meta tags
}

// config/metadata.ts
export const setMetadata = (config: MetadataConfig) => {
  if (typeof document !== 'undefined') {
    // Web implementation
    if (config.title) document.title = config.title;
    // Update meta tags via document.querySelector
  }
  // React Native: no-op or native equivalent
};

// config/index.ts (pageConfig singleton)
export const pageConfig = {
  // ... existing config
  defaultMetadata: {} as MetadataConfig,
  setMetadata, // Export helper
};

// Usage in PageGenerator
useEffect(() => {
  pageConfig.setMetadata(meta);
}, [meta]);
```

**Migration Guide**:
```typescript
// Before (react-helmet-async)
<Helmet>
  <title>{meta.title}</title>
  <meta name="description" content={meta.description} />
</Helmet>

// After (custom config)
<PageGenerator meta={{ title: "...", description: "..." }} />
// Metadata applied via useEffect in PageGenerator
```

**Bundle Size Impact**: -10 KB gzipped (removes react-helmet-async + dependencies)

**References**:
- react-helmet-async GitHub: https://github.com/staylor/react-helmet-async (bundle size analysis)
- Document API (web): https://developer.mozilla.org/en-US/docs/Web/API/Document
- React Native alternative: react-native-head (if native metadata needed in future)

---

## Research Item 4: Tree-Shaking Best Practices for Rollup

**Decision**: Enforce `sideEffects: false` in package.json, verify with Rollup plugins, audit all imports

**Rationale**:
- **Current gap**: package.json has `"sideEffects": false` (line 59) but needs verification that modules are actually tree-shakeable
- **Constitution requirement**: Principle IV states "Tree-shaking MUST work: all re-exports tested"
- **User story P3**: Bundle size reduction requires aggressive tree-shaking (40% smaller when importing specific modules)
- **Impact**: Enables consumers to import only `@gaddario98/react-pages/hooks` without pulling in components

**Alternatives Considered**:
1. **Manual chunking with Rollup output.manualChunks**
   - **Rejected**: Doesn't help tree-shaking, only splits bundles (useful for code splitting, not this goal)
2. **Webpack-specific hints (/*#__PURE__*/ comments)**
   - **Rejected**: Rollup handles pure function detection automatically with correct config
3. **Separate npm packages (@gaddario98/react-pages-hooks, @gaddario98/react-pages-components)**
   - **Rejected**: Overkill, maintenance burden, consumers prefer single package with subpaths

**Tree-Shaking Checklist**:

✅ **package.json configuration** (already correct):
```json
{
  "sideEffects": false,
  "exports": {
    ".": { "types": "./dist/index.d.ts", "import": "./dist/index.mjs", ... },
    "./hooks": { "types": "./dist/hooks/index.d.ts", "import": "./dist/hooks/index.mjs", ... },
    // ... other entry points
  }
}
```

⚠️ **Verify no side effects in modules**:
- ❌ **Top-level code execution**: No `console.log()`, `globalThis.foo = ...`, etc. at module scope
- ❌ **Circular imports**: No `components/A → hooks/B → components/A` cycles
- ✅ **Pure re-exports**: `export * from './foo'` is safe IF `./foo` is also side-effect-free

⚠️ **Audit existing code**:
- Check `config/index.ts`: `pageConfig` singleton is initialized at module load (potential side effect)
  - **Solution**: Make it a function (`getPageConfig()`) or document as intentional side effect
- Check `utils/optimization.ts`: Ensure no global state mutations

✅ **Rollup plugins for verification**:
```javascript
// rollup.config.js additions
import { visualizer } from 'rollup-plugin-visualizer'; // Bundle size visualization
import filesize from 'rollup-plugin-filesize'; // Gzip size reporting

export default {
  // ... existing config
  plugins: [
    // ... existing plugins
    filesize({ showGzippedSize: true }),
    visualizer({ filename: 'dist/bundle-stats.html' }),
  ],
};
```

**Testing Procedure**:
1. Create test app: `import { usePageConfig } from '@gaddario98/react-pages/hooks'`
2. Build with Rollup/Webpack
3. Verify `dist` does NOT include component code (ContentRenderer, Container, etc.)
4. Measure bundle size: should be ~20 KB gzipped (vs 50 KB for full library)

**References**:
- Rollup tree-shaking docs: https://rollupjs.org/configuration-options/#treeshake
- package.json exports field: https://nodejs.org/api/packages.html#package-entry-points
- sideEffects field: https://webpack.js.org/guides/tree-shaking/#mark-the-file-as-side-effect-free

---

## Research Item 5: Development-Mode Performance Metrics (FR-018)

**Decision**: Implement `usePerformanceMetrics` hook and `utils/profiling.ts` for render tracking in dev mode only

**Rationale**:
- **Constitution requirement**: FR-018 "System MUST measure and report render performance metrics in development mode"
- **Zero production overhead**: Metrics collection disabled when `process.env.NODE_ENV === 'production'`
- **Measurable success**: SC-008 requires catching 80% of performance anti-patterns
- **Developer experience**: Helps consumers and maintainers identify performance bottlenecks

**Alternatives Considered**:
1. **React DevTools Profiler API only**
   - **Rejected**: Requires manual profiling session, not automatic
   - **Why**: Want automatic warnings in dev console (e.g., "Warning: Component X re-rendered 15 times in 1 second")
2. **why-did-you-render library**
   - **Considered**: Popular library for tracking unnecessary re-renders
   - **Accepted as optional peer dependency**: Document it, but don't require it (adds bundle size)
3. **PerformanceObserver (browser API)**
   - **Accepted for complementary data**: Use for precise timing, but pair with React-specific tracking

**Implementation Approach**:

```typescript
// utils/profiling.ts
export const trackRenderCount = (componentName: string) => {
  if (process.env.NODE_ENV !== 'development') return;

  const renderCounts = new Map<string, number>();
  const current = renderCounts.get(componentName) || 0;
  renderCounts.set(componentName, current + 1);

  if (current > 10) {
    console.warn(`[React Pages Perf] ${componentName} re-rendered ${current} times. Consider memoization.`);
  }
};

// hooks/usePerformanceMetrics.ts
export const usePerformanceMetrics = (componentName: string) => {
  if (process.env.NODE_ENV !== 'development') return;

  useEffect(() => {
    trackRenderCount(componentName);
  });

  // Track render duration using PerformanceObserver
  useEffect(() => {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      if (duration > 16) {
        console.warn(`[React Pages Perf] ${componentName} render took ${duration.toFixed(2)}ms (target: 16ms for 60 FPS)`);
      }
    };
  });
};

// Usage in components
const ContentRenderer = (props) => {
  usePerformanceMetrics('ContentRenderer');
  // ... component logic
};
```

**Metrics to Track**:
- Render count per component (warn if > 10 in short time)
- Render duration per component (warn if > 16ms)
- Prop stability (warn if receiving new function/object props on every render)
- Hook dependency array issues (warn if useMemo/useCallback dependencies change on every render)

**Production Safety**:
- All instrumentation wrapped in `if (process.env.NODE_ENV !== 'development') return;`
- Rollup/Webpack tree-shaking removes dev-only code from production bundles
- Zero runtime overhead in production builds

**References**:
- PerformanceObserver API: https://developer.mozilla.org/en-US/docs/Web/API/PerformanceObserver
- why-did-you-render: https://github.com/welldone-software/why-did-you-render
- React Profiler API: https://react.dev/reference/react/Profiler

---

## Research Item 6: React.memo and Custom Comparators

**Decision**: Apply React.memo to all exported components with custom comparison functions for complex props

**Rationale**:
- **FR-001**: "System MUST memoize component render outputs using React.memo() with custom comparison functions"
- **Current gap**: Components like ContentRenderer, Container, RenderComponent are not memoized
- **Impact**: Prevents re-rendering when props haven't changed (addresses User Story 1)

**Memoization Strategy**:

```typescript
// components/ContentRenderer.tsx (existing uses withMemo from @gaddario98/utiles)
import { withMemo } from "@gaddario98/utiles";

export const ContentRenderer = withMemo((props) => {
  // ... component logic
});

// Verify withMemo is equivalent to React.memo with shallow comparison
// If not, replace with:
export const ContentRenderer = React.memo((props) => {
  // ... component logic
}, (prevProps, nextProps) => {
  // Custom comparison logic
  return shallowEqual(prevProps, nextProps);
});
```

**Custom Comparator Example** (for complex props):
```typescript
const propComparator = (prevProps, nextProps) => {
  // Fast path: reference equality
  if (prevProps === nextProps) return true;

  // Check specific props that change frequently
  if (prevProps.pageId !== nextProps.pageId) return false;
  if (prevProps.content !== nextProps.content) return false;

  // Deep comparison for complex props (only if necessary)
  if (!shallowEqual(prevProps.formValues, nextProps.formValues)) return false;
  if (!shallowEqual(prevProps.allQuery, nextProps.allQuery)) return false;

  return true; // Props are equal, skip re-render
};
```

**When NOT to Use Custom Comparators**:
- Components that render quickly (< 5ms): overhead of comparison > render cost
- Components with many props: comparator complexity outweighs benefit
- **Rule of thumb**: Use React.memo() with default shallow comparison first, add custom comparator only if profiling shows benefit

**Existing Memoization Audit**:
- ✅ `ContentRenderer.tsx:7`: Already uses `withMemo` from @gaddario98/utiles
- ❌ `Container.tsx`: No memoization detected (needs audit)
- ❌ `RenderComponent.tsx`: No memoization detected (needs audit)

**References**:
- React.memo docs: https://react.dev/reference/react/memo
- Shallow comparison implementation: https://github.com/facebook/react/blob/main/packages/shared/shallowEqual.js
- When NOT to memoize: https://kentcdodds.com/blog/usememo-and-usecallback#whats-the-point

---

## Research Item 7: Lazy Loading Patterns (User Story 4)

**Decision**: Provide React.lazy wrappers in `utils/lazy.ts` for opt-in code splitting

**Rationale**:
- **FR-010**: "System MUST support React.lazy() and Suspense boundaries for optional/conditional page features"
- **User Story 4**: Lazy loading for 30% faster initial load time (SC-004)
- **Opt-in**: Not all consumers need lazy loading, so provide utilities without forcing it

**Implementation**:

```typescript
// utils/lazy.ts
import { lazy, ComponentType, LazyExoticComponent } from 'react';

export const lazyWithPreload = <T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>
): LazyExoticComponent<T> & { preload: () => void } => {
  const LazyComponent = lazy(factory);
  let factoryPromise: Promise<{ default: T }> | undefined;

  const Component = LazyComponent as LazyExoticComponent<T> & { preload: () => void };
  Component.preload = () => {
    if (!factoryPromise) {
      factoryPromise = factory();
    }
  };

  return Component;
};

// Usage example
const HeavyForm = lazyWithPreload(() => import('./components/HeavyForm'));

// Preload on hover
<button onMouseEnter={() => HeavyForm.preload()}>Show Form</button>

// Render with Suspense
<Suspense fallback={<div>Loading...</div>}>
  {showForm && <HeavyForm />}
</Suspense>
```

**Lazy Loading Decision Tree**:
1. **Always lazy**: Features used by < 20% of pages (e.g., rarely-used form components)
2. **Never lazy**: Core functionality used on every page (e.g., PageGenerator, usePageConfig)
3. **Conditional lazy**: Large features with predictable usage (e.g., multi-step forms only on certain routes)

**Consumer Configuration**:
```typescript
// config/index.ts addition
export const pageConfig = {
  // ... existing config
  lazyLoading: {
    enabled: true, // Global toggle
    preloadOnHover: true, // Preload on link/button hover
    suspenseFallback: <LoadingSpinner />, // Default loading UI
  },
};
```

**Bundling Strategy**:
- Rollup `output.manualChunks` to create separate bundles for lazy-loadable features
- Webpack code splitting happens automatically with dynamic `import()`
- Document in migration guide: consumers may need to configure their bundler for code splitting

**References**:
- React.lazy docs: https://react.dev/reference/react/lazy
- Code splitting guide: https://react.dev/learn/code-splitting
- Preload pattern: https://gist.github.com/gaearon/9a4d54653ae9c50af6c54b4e0e4a7c90

---

## Summary of Decisions

| Research Item | Decision | Impact |
|---------------|----------|--------|
| **React Compiler** | Integrate babel-plugin-react-compiler | Automatic memoization, zero runtime overhead |
| **Hook Memoization** | useMemo/useCallback with precise dependency arrays | Stable references, reduces cascade re-renders |
| **Custom Metadata** | Remove react-helmet-async, implement config-based metadata | -10 KB gzipped bundle, React Native compatible |
| **Tree-Shaking** | Enforce sideEffects: false, verify with Rollup plugins | 40% smaller bundles when importing specific modules |
| **Performance Metrics** | usePerformanceMetrics hook + dev-mode warnings | Catches 80%+ of anti-patterns, zero production overhead |
| **React.memo** | Apply to all exported components with custom comparators | Prevents unnecessary re-renders (User Story 1) |
| **Lazy Loading** | Provide lazyWithPreload utility for opt-in code splitting | 30% faster initial load for conditional features |

**Next Steps**: Proceed to Phase 1 (data-model.md, contracts/, quickstart.md)
