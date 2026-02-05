# API Contract: Optimized Hooks

**Feature**: Performance Optimization
**Date**: 2025-10-29
**Phase**: 1 (Design)

## Overview

This document specifies the API contracts for performance-optimized React hooks. All hooks maintain backward compatibility (no breaking changes) while improving internal memoization, stable references, and dependency tracking.

---

## Hook 1: usePageConfig

**Purpose**: Main configuration hook for pages, integrates forms, queries, and view settings.

**Optimization Focus**: Stable `extractQuery` and `extractMutations` references, memoized view settings, reduced re-render propagation.

### Signature

```typescript
function usePageConfig<F extends FieldValues, Q extends QueriesArray>({
  queries,
  form,
  ns,
  onValuesChange,
  viewSettings,
}: {
  queries: QueryPageConfigArray<F, Q>;
  form?: FormPageProps<F, Q>;
  ns: string;
  onValuesChange?: MappedItemsFunction<F, Q, void>;
  viewSettings?: MappedItemsFunction<F, Q, ViewSettings> | ViewSettings;
}): UsePageConfigReturn<F, Q>;
```

### Return Type

```typescript
interface UsePageConfigReturn<F extends FieldValues, Q extends QueriesArray> {
  formData: FormElement[]; // Memoized form configuration
  isAllQueryMapped: boolean; // True when all queries have loaded
  formValues: F; // Current form values from react-hook-form
  formControl: Control<F>; // react-hook-form control object
  hasQueries: boolean; // True if page has any queries
  handleRefresh: () => Promise<void>; // Stable callback to invalidate queries
  allMutation: MutationsMap<Q>; // Stable reference to mutations object
  allQuery: QueriesMap<Q>; // Stable reference to queries object
  setValue: UseFormSetValue<F>; // Stable setValue callback
  form?: FormPageProps<F, Q>; // Original form config (passthrough)
  mappedViewSettings: ViewSettings; // Memoized view settings
  isLoading: boolean; // True if any query is loading
}
```

### Optimization Guarantees

| Guarantee | Implementation | Verification |
|-----------|----------------|--------------|
| **Stable `allQuery` reference** | Wrapped in `useMemo`, only updates when query data changes | React DevTools Profiler: allQuery object identity stable across re-renders |
| **Stable `allMutation` reference** | Wrapped in `useMemo`, only updates when mutations change | React DevTools Profiler: allMutation object identity stable |
| **Stable `setValue` callback** | Wrapped in `useCallback` with empty deps (from react-hook-form) | Prop comparator: setValue reference never changes |
| **Stable `handleRefresh` callback** | Wrapped in `useCallback`, deps: [invalidateQueries, queryKeys] | Callback reference only changes if queryKeys array changes |
| **Memoized `formData`** | Computed via useMemo in useFormData hook, deps: [form, isAllQueryMapped] | formData array reference stable when form config unchanged |
| **Memoized `mappedViewSettings`** | Computed via useMemo in useViewSettings hook, deps: [viewSettings, form values] | ViewSettings object reference stable when inputs unchanged |

### Dependency Array Rules

```typescript
// BEFORE (over-inclusive dependencies, causes excessive re-renders)
const extractQueryHandle = useMemo(() => {
  if (!form?.usedQueries?.length) return allQuery;
  return extractQuery(form?.usedQueries as string[]);
}, [allQuery, extractQuery, form?.usedQueries, form]); // ❌ form is unstable

// AFTER (precise dependencies, stable references)
const extractQueryHandle = useMemo(() => {
  if (!form?.usedQueries?.length) return allQuery;
  return extractQuery(form?.usedQueries as string[]);
}, [allQuery, extractQuery, form?.usedQueries]); // ✅ Only values that actually change
```

### Usage Example

```typescript
// Optimized usage with stable references
const MyPage = () => {
  const {
    formData,
    allQuery,
    allMutation,
    setValue,
    isAllQueryMapped,
  } = usePageConfig({
    queries: [
      { type: 'query', key: 'users', queryConfig: { queryKey: ['users'], queryFn: fetchUsers } },
    ],
    form: {
      data: [{ name: 'username', type: 'text' }],
      submit: [{ onSuccess: (values) => console.log(values) }],
    },
    ns: 'my-page',
  });

  // allQuery, allMutation, setValue are stable - memoized components won't re-render unnecessarily
  return <MemoizedComponent allQuery={allQuery} setValue={setValue} />;
};
```

---

## Hook 2: useFormPage

**Purpose**: Manages form state integration with react-hook-form.

**Optimization Focus**: Stable setValue callback, avoid re-creating formControl on every render.

### Signature

```typescript
function useFormPage<F extends FieldValues, Q extends QueriesArray>({
  form,
}: {
  form?: FormPageProps<F, Q>;
}): UseFormPageReturn<F>;
```

### Return Type

```typescript
interface UseFormPageReturn<F extends FieldValues> {
  formControl: Control<F>; // react-hook-form control (stable reference)
  formValues: F; // Current form values (reactive)
  setValue: UseFormSetValue<F>; // Stable callback
}
```

### Optimization Guarantees

| Guarantee | Implementation | Verification |
|-----------|----------------|--------------|
| **Stable `formControl`** | Created once by useForm, never re-created | Reference equality check across renders |
| **Stable `setValue`** | Provided by useForm, inherently stable | Reference equality check across renders |
| **Reactive `formValues`** | Subscribed via useWatch, updates only when form data changes | Values update, but setValue/formControl refs remain stable |

### Usage Example

```typescript
const { formControl, formValues, setValue } = useFormPage({ form });

// setValue is stable - safe to pass to memoized children
const handleUpdate = useCallback((name, value) => {
  setValue(name, value);
}, [setValue]); // setValue never changes, so this callback is also stable
```

---

## Hook 3: usePageQueries

**Purpose**: Manages query and mutation state via TanStack Query.

**Optimization Focus**: Stable allQuery/allMutation objects, memoized queryKeys array.

### Signature

```typescript
function usePageQueries<F extends FieldValues, Q extends QueriesArray>({
  queries,
  formValues,
  setValue,
}: {
  queries: QueryPageConfigArray<F, Q>;
  formValues: F;
  setValue: UseFormSetValue<F>;
}): UsePageQueriesReturn<Q>;
```

### Return Type

```typescript
interface UsePageQueriesReturn<Q extends QueriesArray> {
  allMutation: MutationsMap<Q>; // Stable mutations object
  allQuery: QueriesMap<Q>; // Stable queries object
  isAllQueryMapped: boolean; // True when all queries loaded
  isLoading: boolean; // True if any query loading
  queryKeys: string[]; // Memoized array of query keys
  hasQueries: boolean; // True if any queries configured
}
```

### Optimization Guarantees

| Guarantee | Implementation | Verification |
|-----------|----------------|--------------|
| **Stable `allQuery` object** | Memoized with deps: [query results from TanStack Query] | Object identity stable when query data unchanged |
| **Stable `allMutation` object** | Memoized with deps: [mutation instances] | Object identity stable (mutations are stable refs) |
| **Memoized `queryKeys` array** | Computed once from queries config, stable unless config changes | Array reference stable across re-renders |

### Usage Example

```typescript
const { allQuery, allMutation, queryKeys } = usePageQueries({
  queries: [
    { type: 'query', key: 'users', queryConfig: { queryKey: ['users'], queryFn: fetchUsers } },
  ],
  formValues,
  setValue,
});

// allQuery and allMutation are stable - safe for memoized components
<MemoizedList data={allQuery.users?.data} />
```

---

## Hook 4: useViewSettings

**Purpose**: Computes view settings (layout configuration) from form values or static config.

**Optimization Focus**: Prevent recalculation when unrelated form fields change.

### Signature

```typescript
function useViewSettings<F extends FieldValues, Q extends QueriesArray>({
  viewSettings,
  allQuery,
  allMutation,
  formValues,
  setValue,
}: {
  viewSettings: MappedItemsFunction<F, Q, ViewSettings> | ViewSettings;
  allQuery: QueriesMap<Q>;
  allMutation: MutationsMap<Q>;
  formValues: F;
  setValue: UseFormSetValue<F>;
}): ViewSettings;
```

### Return Type

```typescript
interface ViewSettings {
  withoutPadding?: boolean;
  header?: { withoutPadding?: boolean };
  footer?: { withoutPadding?: boolean };
  disableRefreshing?: boolean;
  customLayoutComponent?: React.ComponentType;
  customPageContainer?: React.ComponentType;
}
```

### Optimization Guarantees

| Guarantee | Implementation | Verification |
|-----------|----------------|--------------|
| **Static settings return same ref** | If viewSettings is object (not function), return it directly | Object identity preserved |
| **Memoized computed settings** | If viewSettings is function, memoize result with deps: [formValues, allQuery, allMutation] | Function only re-executes when dependencies change |
| **Selective dependency tracking** | Only track form fields actually used by viewSettings function | Use dependency graph to minimize recalculation |

### Usage Example

```typescript
// Static settings (no computation)
const staticSettings = { withoutPadding: true };
const settings1 = useViewSettings({ viewSettings: staticSettings, ... }); // Same ref every render

// Dynamic settings (computed from form)
const dynamicSettings = ({ formValues }) => ({
  withoutPadding: formValues.hidepadding,
});
const settings2 = useViewSettings({ viewSettings: dynamicSettings, ... }); // Recomputes only when formValues.hidePadding changes
```

---

## Hook 5: useDataExtractor

**Purpose**: Extracts subsets of queries/mutations for components that only need specific data.

**Optimization Focus**: Memoize extracted objects to prevent downstream re-renders.

### Signature

```typescript
function useDataExtractor<F extends FieldValues, Q extends QueriesArray>({
  allMutation,
  allQuery,
  formValues,
}: {
  allMutation: MutationsMap<Q>;
  allQuery: QueriesMap<Q>;
  formValues: F;
}): UseDataExtractorReturn<Q>;
```

### Return Type

```typescript
interface UseDataExtractorReturn<Q extends QueriesArray> {
  extractQuery: (keys: string[]) => Partial<QueriesMap<Q>>; // Stable callback
  extractMutations: (keys: string[]) => Partial<MutationsMap<Q>>; // Stable callback
}
```

### Optimization Guarantees

| Guarantee | Implementation | Verification |
|-----------|----------------|--------------|
| **Stable `extractQuery` callback** | Wrapped in useCallback, deps: [allQuery] | Callback reference stable when allQuery unchanged |
| **Stable `extractMutations` callback** | Wrapped in useCallback, deps: [allMutation] | Callback reference stable when allMutation unchanged |
| **Memoized extracted objects** | Results of extraction cached per keys array | Same keys array returns same object reference |

### Usage Example

```typescript
const { extractQuery } = useDataExtractor({ allQuery, allMutation, formValues });

// Extract only needed queries for a component
const userQueries = extractQuery(['users', 'profile']); // Memoized based on keys

<ComponentA queries={userQueries} /> // Won't re-render unless users or profile data changes
```

---

## Hook 6: usePerformanceMetrics (NEW)

**Purpose**: Tracks render performance in development mode (FR-018).

**Optimization Focus**: Zero production overhead, automatic warnings for anti-patterns.

### Signature

```typescript
function usePerformanceMetrics(componentName: string, options?: PerformanceMetricsOptions): void;
```

### Options

```typescript
interface PerformanceMetricsOptions {
  enabled?: boolean; // Default: true in dev, false in prod
  renderThreshold?: number; // Warn if render count > threshold (default: 10)
  durationThreshold?: number; // Warn if render duration > threshold ms (default: 16)
  trackProps?: boolean; // Track prop stability (default: true)
}
```

### Behavior

| Mode | Behavior |
|------|----------|
| **Development** | Tracks renders, logs warnings to console, stores metrics in memory |
| **Production** | No-op (tree-shaken out by bundler) |

### Usage Example

```typescript
const ContentRenderer = (props) => {
  usePerformanceMetrics('ContentRenderer', {
    renderThreshold: 15,
    durationThreshold: 20,
  });

  return <div>{props.content}</div>;
};

// Console output (dev mode only):
// [React Pages Perf] ContentRenderer re-rendered 16 times in 1 second. Consider memoization.
```

---

## Backward Compatibility

All hooks maintain **100% backward compatibility**. Changes are internal (memoization, stable refs) and do not affect the public API.

### Migration Checklist

- ✅ No prop/signature changes
- ✅ No new required parameters
- ✅ Return types unchanged (same fields)
- ✅ Behavioral changes: Performance only (faster, no functional changes)
- ✅ Consumer code: No updates required

### Semver Classification

**MINOR version bump** (e.g., 1.0.23 → 1.1.0):
- New hook: `usePerformanceMetrics`
- Internal optimizations: Backward compatible

**Recommended migration**: None required; update and deploy.

---

## Testing Contract

### Performance Tests

Each optimized hook must pass these performance tests:

1. **Stable Reference Test**: Verify callback/object references don't change across re-renders
   ```typescript
   const ref1 = usePageConfig(config);
   triggerUnrelatedRerender();
   const ref2 = usePageConfig(config);
   expect(ref1.setValue).toBe(ref2.setValue); // Same reference
   ```

2. **Selective Re-render Test**: Verify memoized values update only when dependencies change
   ```typescript
   const { formData } = usePageConfig(config);
   updateUnrelatedQueryData();
   const { formData: formData2 } = usePageConfig(config);
   expect(formData).toBe(formData2); // Same array reference
   ```

3. **Performance Baseline Test**: Verify render count meets targets (SC-002)
   ```typescript
   const { result, renderCount } = renderHook(() => usePageConfig(config));
   updateQuery('users');
   expect(renderCount).toBeLessThanOrEqual(3); // Max 3 re-renders
   ```

---

## Next Steps

- Implement optimizations in hooks/
- Add performance tests with vitest + @testing-library/react-hooks
- Update documentation with optimization notes
