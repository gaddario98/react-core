# Data Model: Performance Optimization

**Feature**: React Pages Performance Optimization
**Date**: 2025-10-29
**Phase**: 1 (Design)

## Overview

This document defines the data structures, type definitions, and state models for the performance optimization feature. It covers performance metrics, dependency tracking, metadata configuration, and memoization-related types.

---

## Entity 1: Performance Metric

**Description**: Measurements collected in development mode to track component rendering performance and identify optimization opportunities.

**Purpose**: Implements FR-018 (measure and report render performance metrics) and supports SC-008 (catch 80%+ of anti-patterns).

### Fields

| Field | Type | Description | Validation Rules |
|-------|------|-------------|------------------|
| `componentName` | `string` | Unique identifier for the component being measured (e.g., "ContentRenderer", "usePageConfig") | Required, non-empty string |
| `renderCount` | `number` | Number of times the component has rendered since last reset | Non-negative integer, resets per session |
| `lastRenderDuration` | `number` | Duration of the most recent render in milliseconds | Non-negative float, measured via performance.now() |
| `averageRenderDuration` | `number` | Rolling average of render durations over last 10 renders | Non-negative float, calculated from history |
| `timestamp` | `number` | Unix timestamp (ms) of the metric collection | Date.now() value |
| `warnings` | `PerformanceWarning[]` | Array of warnings triggered by this metric | Empty array if no issues detected |

### Type Definition

```typescript
interface PerformanceMetric {
  componentName: string;
  renderCount: number;
  lastRenderDuration: number;
  averageRenderDuration: number;
  timestamp: number;
  warnings: PerformanceWarning[];
}

interface PerformanceWarning {
  type: 'excessive-renders' | 'slow-render' | 'unstable-props' | 'dependency-thrash';
  message: string;
  severity: 'warn' | 'error';
  suggestedFix?: string;
}
```

### State Transitions

```
[Initial State]
  ↓
renderCount = 0, warnings = []
  ↓
[Component Renders]
  ↓
renderCount++, update durations
  ↓
[Check Thresholds]
  ├─→ renderCount > 10 in 1s → Add 'excessive-renders' warning
  ├─→ duration > 16ms → Add 'slow-render' warning
  └─→ props changed every render → Add 'unstable-props' warning
  ↓
[Report to Console] (dev mode only)
  ↓
[Session Reset] (on page navigation or manual reset)
  ↓
Clear metrics, start fresh
```

### Relationships

- **One-to-many**: A component (e.g., ContentRenderer) can have multiple metrics over time (one per render)
- **Aggregation**: Metrics are aggregated into component-level summaries for dashboard/logging
- **No persistence**: Metrics exist only in memory during development; never sent to server or persisted

---

## Entity 2: Dependency Graph

**Description**: A mapping of which components depend on which queries, mutations, and form values. Used to determine minimal re-render scope when data changes (addresses User Story 1 acceptance scenario 2).

**Purpose**: Enables selective re-rendering by tracking data dependencies at component level (FR-005).

### Fields

| Field | Type | Description | Validation Rules |
|-------|------|-------------|------------------|
| `componentId` | `string` | Unique identifier for the component (e.g., "content-section-1") | Required, must be unique within page |
| `usedQueries` | `string[]` | Array of query keys this component depends on (e.g., ["users", "posts"]) | Optional, empty array if no query dependencies |
| `usedFormValues` | `string[]` | Array of form field names this component depends on (e.g., ["username", "email"]) | Optional, empty array if no form dependencies |
| `usedMutations` | `string[]` | Array of mutation keys this component depends on (e.g., ["createPost"]) | Optional, empty array if no mutation dependencies |
| `parentComponent` | `string \| null` | ID of the parent component in the render tree | Null for root components |
| `childComponents` | `string[]` | IDs of child components | Empty array for leaf components |

### Type Definition

```typescript
interface DependencyNode {
  componentId: string;
  usedQueries: string[];
  usedFormValues: string[];
  usedMutations: string[];
  parentComponent: string | null;
  childComponents: string[];
}

interface DependencyGraph {
  nodes: Map<string, DependencyNode>;
  querySubscribers: Map<string, Set<string>>; // queryKey → Set of componentIds
  formFieldSubscribers: Map<string, Set<string>>; // fieldName → Set of componentIds
}
```

### State Transitions

```
[Component Mounts]
  ↓
Extract dependencies from props (usedQueries, usedFormValues)
  ↓
[Register in Graph]
  ↓
Add node to graph, update subscriber maps
  ↓
[Data Change Event] (query updates, form field changes)
  ↓
Lookup affected components via subscriber maps
  ↓
[Selective Re-render]
  ↓
Only trigger updates for dependent components
  ↓
[Component Unmounts]
  ↓
Remove from graph, clean up subscriber entries
```

### Relationships

- **Tree structure**: Parent-child relationships form the component render tree
- **Many-to-many**: One component can depend on multiple queries; one query can be used by multiple components
- **Dynamic**: Graph updates on mount/unmount, not static

---

## Entity 3: Metadata Configuration

**Description**: Configuration object for page metadata (title, description, meta tags), replacing react-helmet-async with custom implementation.

**Purpose**: Implements research decision to remove react-helmet-async (Research Item 3), reducing bundle size by ~10 KB.

### Fields

| Field | Type | Description | Validation Rules |
|-------|------|-------------|------------------|
| `title` | `string \| undefined` | Page title (sets document.title) | Optional, plain text only (no HTML) |
| `description` | `string \| undefined` | Meta description for SEO | Optional, recommended < 160 characters |
| `keywords` | `string[] \| undefined` | Meta keywords array | Optional, array of strings |
| `ogImage` | `string \| undefined` | Open Graph image URL | Optional, must be absolute URL |
| `ogTitle` | `string \| undefined` | Open Graph title (defaults to title if not set) | Optional, plain text |
| `ogDescription` | `string \| undefined` | Open Graph description (defaults to description) | Optional, plain text |
| `canonical` | `string \| undefined` | Canonical URL for SEO | Optional, must be absolute URL |
| `robots` | `string \| undefined` | Robots meta tag (e.g., "index, follow") | Optional, must be valid robots directive |
| `lang` | `string \| undefined` | Language code (e.g., "en", "it") | Optional, ISO 639-1 code |
| `customMeta` | `MetaTag[] \| undefined` | Additional custom meta tags | Optional array of name/content pairs |

### Type Definition

```typescript
interface MetadataConfig {
  title?: string;
  description?: string;
  keywords?: string[];
  ogImage?: string;
  ogTitle?: string;
  ogDescription?: string;
  canonical?: string;
  robots?: string;
  lang?: string;
  customMeta?: MetaTag[];
}

interface MetaTag {
  name?: string; // For <meta name="..." content="..." />
  property?: string; // For <meta property="og:..." content="..." />
  content: string;
}

// Metadata provider API
interface MetadataProvider {
  setMetadata: (config: MetadataConfig) => void;
  getMetadata: () => MetadataConfig;
  resetMetadata: () => void;
}
```

### State Transitions

```
[Page Loads]
  ↓
Apply defaultMetadata from pageConfig
  ↓
[Component Sets Metadata] (via PageGenerator meta prop)
  ↓
Call setMetadata(config)
  ↓
[Platform Check]
  ├─→ Web: Update document.title, append/update <meta> tags in <head>
  └─→ React Native: Store in memory (no DOM manipulation)
  ↓
[Metadata Active]
  ↓
[Page Unmounts or New Metadata Set]
  ↓
Clean up old meta tags (remove if no longer in config)
  ↓
Apply new metadata
```

### Relationships

- **One-to-one**: Each page has one active MetadataConfig at a time
- **Hierarchical**: Child pages can override parent metadata (e.g., global default + page-specific title)
- **Platform-agnostic**: Same data model for web and React Native, only provider implementation differs

---

## Entity 4: Memoization Cache

**Description**: Internal caches maintained by useMemo/useCallback hooks, storing computed values and callback references. Invalidated only when dependencies change.

**Purpose**: Implements FR-003 (compute derived values with precise dependency arrays) and FR-004 (stable object references).

### Fields

| Field | Type | Description | Validation Rules |
|-------|------|-------------|------------------|
| `cacheKey` | `string` | Unique identifier for the cached value (e.g., "extractedQueries-[queryIds]") | Generated from hook name + dependencies |
| `cachedValue` | `any` | The memoized value (can be object, array, function, primitive) | Any type, immutable reference |
| `dependencies` | `unknown[]` | Array of dependency values that trigger recalculation | Compared via Object.is() |
| `hitCount` | `number` | Number of times cache was reused (for profiling) | Non-negative integer, dev mode only |
| `missCount` | `number` | Number of times cache was invalidated and recomputed | Non-negative integer, dev mode only |

### Type Definition

```typescript
// Internal React representation (not directly accessible)
interface MemoizationCache {
  cacheKey: string;
  cachedValue: any;
  dependencies: unknown[];
  hitCount: number; // Dev mode only
  missCount: number; // Dev mode only
}

// Profiling API (dev mode only)
interface CacheStats {
  totalCaches: number;
  hitRate: number; // hitCount / (hitCount + missCount)
  mostInvalidated: Array<{ cacheKey: string; missCount: number }>;
}
```

### State Transitions

```
[Hook Invocation] (useMemo or useCallback)
  ↓
Check if cache exists for current dependencies
  ↓
[Cache Hit] (dependencies unchanged via Object.is)
  ├─→ Return cached value (no recomputation)
  └─→ Increment hitCount (dev mode)
  ↓
[Cache Miss] (dependencies changed)
  ├─→ Recompute value
  ├─→ Store new value in cache
  └─→ Increment missCount (dev mode)
  ↓
[Warn if Excessive Misses] (dev mode)
  └─→ If missCount > 50, warn about dependency thrash
```

### Relationships

- **One-to-one**: Each useMemo/useCallback call has one associated cache entry
- **Scoped to component**: Caches destroyed when component unmounts
- **No sharing**: Each component instance has independent caches (no global state)

---

## Entity 5: Bundle Module

**Description**: A discrete output file (e.g., hooks/index.mjs, components/index.mjs) that can be independently imported and tree-shaken by consumer bundlers.

**Purpose**: Implements FR-007 (expose bundle entry points) and FR-008 (sideEffects: false) for User Story 3.

### Fields

| Field | Type | Description | Validation Rules |
|-------|------|-------------|------------------|
| `modulePath` | `string` | Import path for the module (e.g., "@gaddario98/react-pages/hooks") | Must match package.json exports |
| `outputFiles` | `OutputFile[]` | Array of generated files (JS, MJS, DTS) | At least one .mjs and one .d.ts required |
| `dependencies` | `string[]` | Other library modules this module imports | Empty array if standalone |
| `sizeGzipped` | `number` | Gzipped size in bytes | Must be < 20 KB for per-module, < 50 KB for main |
| `exports` | `string[]` | List of exported symbols (functions, types, constants) | Non-empty array |
| `hasSideEffects` | `boolean` | Whether module has side effects (should always be false) | Must be false for tree-shaking |

### Type Definition

```typescript
interface BundleModule {
  modulePath: string;
  outputFiles: OutputFile[];
  dependencies: string[];
  sizeGzipped: number;
  exports: string[];
  hasSideEffects: boolean;
}

interface OutputFile {
  path: string; // e.g., "dist/hooks/index.mjs"
  format: 'esm' | 'cjs' | 'dts'; // ES Modules, CommonJS, TypeScript declarations
  sizeBytes: number;
  sizeGzipped: number;
}

// Build-time analysis
interface BundleAnalysis {
  modules: BundleModule[];
  totalSize: number;
  entryPoints: string[];
  circularDependencies: string[][]; // Array of circular import chains
}
```

### State Transitions

```
[Build Process] (Rollup)
  ↓
[Source Files → Bundle Modules]
  ├─→ hooks/*.ts → dist/hooks/index.{js,mjs,d.ts}
  ├─→ components/*.tsx → dist/components/index.{js,mjs,d.ts}
  └─→ ...other modules
  ↓
[Tree-Shaking Analysis]
  ├─→ Verify sideEffects: false
  ├─→ Detect circular imports (error if found)
  └─→ Calculate gzipped sizes
  ↓
[Size Gate Check]
  ├─→ Fail build if main bundle > 50 KB gzipped
  └─→ Fail build if per-module > 20 KB gzipped
  ↓
[Output]
  └─→ Generate bundle stats report (dist/bundle-stats.html)
```

### Relationships

- **One-to-many**: One source directory (e.g., hooks/) produces multiple output files (.js, .mjs, .d.ts)
- **Dependency graph**: Modules can import from other modules, forming a directed acyclic graph (DAG)
- **Entry points**: package.json exports field maps module paths to output files

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Component Render Cycle                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │   Dependency Graph Lookup     │
              │  (which data does component   │
              │   depend on?)                 │
              └───────────────┬───────────────┘
                              │
                ┌─────────────┴─────────────┐
                │                           │
                ▼                           ▼
    ┌────────────────────┐      ┌────────────────────┐
    │ Memoization Cache  │      │ Performance Metric │
    │ (reuse if deps     │      │ (track render count│
    │  unchanged)        │      │  and duration)     │
    └────────┬───────────┘      └─────────┬──────────┘
             │                            │
             └────────┬────────────────────┘
                      │
                      ▼
         ┌─────────────────────────────┐
         │   Render Component          │
         │   (optimized with           │
         │    React.memo)              │
         └────────────┬────────────────┘
                      │
                      ▼
         ┌─────────────────────────────┐
         │   Metadata Configuration    │
         │   (update document.title,   │
         │    meta tags)               │
         └─────────────────────────────┘
```

---

## Validation Rules Summary

### Cross-Entity Constraints

1. **Dependency Graph Integrity**:
   - `componentId` must be unique within a page's dependency graph
   - `parentComponent` must exist in graph (if not null)
   - `usedQueries` must reference valid query keys (from TanStack Query)

2. **Performance Metrics**:
   - `renderCount` resets when `timestamp` gap > 5 minutes (session expiry)
   - `averageRenderDuration` calculated only when `renderCount >= 2`
   - Warnings only generated in development mode (`process.env.NODE_ENV === 'development'`)

3. **Metadata Configuration**:
   - URLs (`ogImage`, `canonical`) must be absolute (start with http:// or https://)
   - `robots` must be one of: "index, follow", "noindex, nofollow", "index, nofollow", "noindex, follow"
   - `lang` must be valid ISO 639-1 two-letter code

4. **Bundle Module**:
   - `hasSideEffects` must be false (enforced in package.json and verified in build)
   - No circular dependencies allowed (`circularDependencies` array must be empty)
   - `sizeGzipped` must be below thresholds (50 KB main, 20 KB per-module)

---

## Implementation Notes

1. **Type Safety**: All entities have strict TypeScript definitions with explicit types (no `any` except in MemoizationCache.cachedValue where necessary)

2. **React Native Compatibility**: Metadata provider has platform-specific implementations; other entities are platform-agnostic

3. **Development vs Production**: Performance metrics and cache stats exist only in development builds; tree-shaken in production

4. **Backward Compatibility**: New types (MetadataConfig, PerformanceMetric) are additive; existing types unchanged to maintain semver compatibility

---

## Next Steps

- **contracts/**: Define API contracts for hooks, configuration, and metrics
- **quickstart.md**: Create performance testing guide using these entities
- **implementation**: Generate TypeScript interfaces in `types.ts` based on this model
