import type { DeepKeys, DeepValue } from '@tanstack/react-form'
import type { ComponentProps } from 'react'
import type {
  AllMutation,
  ExtractQuery,
  MultipleQueryResponse,
  MutationConfig,
  QueriesArray,
  QueryAtIndex,
  QueryDefinition,
  QueryProps,
} from '@gaddario98/react-queries'
import type {
  FieldValues,
  FormManager,
  FormManagerConfig,
  SetValueFunction,
  Submit,
} from '@gaddario98/react-form'
import type { LazyLoadingConfig, MetadataConfig } from './config/types'
import type { DefaultContainerProps, PageConfigProps } from './config'

/* ======================================================
   MAPPABLE PROPS E FUNZIONI DI MAPPING
====================================================== */

type StringKey<T> = Extract<keyof T, string>

type VariableTopKey<V> = StringKey<V>
type VariableValue<V, K extends VariableTopKey<V>> = V[K]

// Helper types for GetFunction
type QueryTopKey<Q extends QueriesArray> = StringKey<MultipleQueryResponse<Q>>
type QuerySubKey<Q extends QueriesArray, K extends QueryTopKey<Q>> = StringKey<
  MultipleQueryResponse<Q>[K]
>
type QueryCompositeKey<Q extends QueriesArray> = {
  [K in QueryTopKey<Q>]: K | `${K}.${QuerySubKey<Q, K>}`
}[QueryTopKey<Q>]
type QueryValue<
  Q extends QueriesArray,
  K extends QueryCompositeKey<Q>,
> = K extends `${infer Top}.${infer Sub}`
  ? Top extends QueryTopKey<Q>
    ? Sub extends QuerySubKey<Q, Top>
      ? MultipleQueryResponse<Q>[Top][Sub]
      : never
    : never
  : K extends QueryTopKey<Q>
    ? MultipleQueryResponse<Q>[K]
    : never

type MutationTopKey<Q extends QueriesArray> = StringKey<AllMutation<Q>>
type MutationSubKey<
  Q extends QueriesArray,
  K extends MutationTopKey<Q>,
> = StringKey<AllMutation<Q>[K]>
type MutationCompositeKey<Q extends QueriesArray> = {
  [K in MutationTopKey<Q>]: K | `${K}.${MutationSubKey<Q, K>}`
}[MutationTopKey<Q>]
type MutationValue<
  Q extends QueriesArray,
  K extends MutationCompositeKey<Q>,
> = K extends `${infer Top}.${infer Sub}`
  ? Top extends MutationTopKey<Q>
    ? Sub extends MutationSubKey<Q, Top>
      ? AllMutation<Q>[Top][Sub]
      : never
    : never
  : K extends MutationTopKey<Q>
    ? AllMutation<Q>[K]
    : never

export type GetFunction<
  F extends FieldValues,
  Q extends QueriesArray,
  V extends Record<string, unknown> = Record<string, unknown>,
> = {
  // Queries (from GetApiValuesFunction)
  <K extends QueryTopKey<Q>>(type: 'query', key: K): MultipleQueryResponse<Q>[K]
  <K extends QueryCompositeKey<Q>>(type: 'query', key: K): QueryValue<Q, K>
  <K extends QueryCompositeKey<Q>>(
    type: 'query',
    key: K,
    defaultValue: unknown,
  ): NonNullable<QueryValue<Q, K>>
  <K extends QueryTopKey<Q>>(
    type: 'query',
    key: K,
    defaultValue: MultipleQueryResponse<Q>[K]['data'],
  ): MultipleQueryResponse<Q>[K]['data']
  <K extends QueryCompositeKey<Q>>(
    type: 'query',
    key: K,
    defaultValue: QueryValue<Q, K>,
  ): NonNullable<QueryValue<Q, K>>

  // Mutations (from GetApiValuesFunction)
  <K extends MutationTopKey<Q>>(type: 'mutation', key: K): AllMutation<Q>[K]
  <K extends MutationCompositeKey<Q>>(
    type: 'mutation',
    key: K,
  ): MutationValue<Q, K>
  <K extends MutationCompositeKey<Q>>(
    type: 'mutation',
    key: K,
    defaultValue: unknown,
  ): NonNullable<MutationValue<Q, K>>
  <K extends MutationTopKey<Q>>(
    type: 'mutation',
    key: K,
    defaultValue: AllMutation<Q>[K]['data'],
  ): AllMutation<Q>[K]['data']
  <K extends MutationCompositeKey<Q>>(
    type: 'mutation',
    key: K,
    defaultValue: MutationValue<Q, K>,
  ): NonNullable<MutationValue<Q, K>>

  // State
  <K extends VariableTopKey<V>>(type: 'state', key: K): VariableValue<V, K>
  <K extends VariableTopKey<V>>(
    type: 'state',
    key: K,
    defaultValue: VariableValue<V, K>,
  ): NonNullable<VariableValue<V, K>>

  // Form values
  <TField extends DeepKeys<F>>(
    type: 'form',
    key: TField,
  ): DeepValue<F, TField> | undefined
  <TField extends DeepKeys<F>>(
    type: 'form',
    key: TField,
    defaultValue: DeepValue<F, TField>,
  ): NonNullable<DeepValue<F, TField>>
}

export type SetFunction<
  F extends FieldValues,
  V extends Record<string, unknown> = Record<string, unknown>,
> = {
  (type: 'form'): SetValueFunction<F>
  (
    type: 'state',
  ): <K extends VariableTopKey<V>>(key: K, value: VariableValue<V, K>) => void
}

export type FunctionProps<
  F extends FieldValues,
  Q extends QueriesArray,
  V extends Record<string, unknown> = Record<string, unknown>,
> = {
  /**
   * Read the current query/mutation value by key.
   * Example: get('query', 'bookings')
   */
  get: GetFunction<F, Q, V>
  /**
   * Generic setter accessor.
   * - set('form') returns `setValue`
   * - set('state') returns state setter
   */
  set: SetFunction<F, V>
}

type MappedItemsFunction<
  F extends FieldValues,
  Q extends QueriesArray,
  ComponentType,
  V extends Record<string, unknown> = Record<string, unknown>,
> = (props: FunctionProps<F, Q, V>) => ComponentType

/**
 * Context passed to lifecycle callbacks
 * Provides access to form, queries, mutations, and utilities
 */
type LifecycleContext<
  F extends FieldValues = FieldValues,
  Q extends QueriesArray = QueriesArray,
  V extends Record<string, unknown> = Record<string, unknown>,
> = FunctionProps<F, Q, V> & {
  ns?: string
  pageId?: string
  pageConfig?: PageProps<F, Q, V>
}

/* ======================================================
   CONTENT ITEMS & CONTAINER ITEMS
====================================================== */
type Items<
  F extends FieldValues,
  Q extends QueriesArray,
  V extends Record<string, unknown> = Record<string, unknown>,
> = {
  type: 'custom'
  component:
    | React.JSX.Element
    | ((props: FunctionProps<F, Q, V>) => React.JSX.Element)

  // Layout & positioning
  index?: number
  usedBoxes?: number
  renderInFooter?: boolean
  renderInHeader?: boolean
  hidden?: boolean | MappedItemsFunction<F, Q, boolean, V>

  // Interaction & behavior
  isDraggable?: boolean
  isInDraggableView?: boolean

  // React optimization
  key?: string

  // NEW IN 2.0: Lazy loading support
  lazy?: boolean
  lazyTrigger?: 'viewport' | 'interaction' | 'conditional'
  lazyCondition?: MappedItemsFunction<F, Q, boolean, V>
}

type ContainerItem<
  F extends FieldValues,
  Q extends QueriesArray,
  V extends Record<string, unknown> = Record<string, unknown>,
> = {
  type: 'container'
  component?: PageConfigProps['ItemsContainer']
  items: ContentItemsType<F, Q, V>

  // Layout & positioning
  index?: number
  usedBoxes?: number
  renderInFooter?: boolean
  renderInHeader?: boolean
  hidden?: boolean | MappedItemsFunction<F, Q, boolean, V>

  // Interaction & behavior
  isDraggable?: boolean
  isInDraggableView?: boolean

  // React optimization
  key?: string

  // NEW IN 2.0: Lazy loading support
  lazy?: boolean
  lazyTrigger?: 'viewport' | 'interaction' | 'conditional'
  lazyCondition?: MappedItemsFunction<F, Q, boolean, V>
}

type ContentItem<
  F extends FieldValues,
  Q extends QueriesArray,
  V extends Record<string, unknown> = Record<string, unknown>,
> = Items<F, Q, V> | ContainerItem<F, Q, V>

type MappedContents<
  F extends FieldValues,
  Q extends QueriesArray,
  V extends Record<string, unknown> = Record<string, unknown>,
> = MappedItemsFunction<F, Q, Array<ContentItem<F, Q, V>>, V>

type ContentItemsType<
  F extends FieldValues,
  Q extends QueriesArray = QueriesArray,
  V extends Record<string, unknown> = Record<string, unknown>,
> = Array<ContentItem<F, Q, V>> | MappedContents<F, Q, V>

/* ======================================================
   FORM PAGE & MODAL TYPES
====================================================== */
type FormPageProps<
  F extends FieldValues,
  Q extends QueriesArray,
  V extends Record<string, unknown> = Record<string, unknown>,
> = Omit<
  ComponentProps<typeof FormManager<F>>,
  'updateFormValues' | 'submit' | 'data'
> & {
  defaultValueQueryKey?: Array<string>
  defaultValueQueryMap?: (
    props: ExtractQuery<Q>['response'],
  ) => DeepValue<F, DeepKeys<F>>
  submit?: Array<Submit<F>> | MappedItemsFunction<F, Q, Array<Submit<F>>, V>
  index?: number
  data?: Array<
    FormManagerConfig<F> | MappedItemsFunction<F, Q, FormManagerConfig<F>, V>
  >
  // NEW IN 2.0: Debounce delay for form value changes (ms, default: 300)
  debounceDelay?: number
  hidden?: boolean | MappedItemsFunction<F, Q, boolean, V>
}

/* ======================================================
   PAGE PROPS & VIEW SETTINGS
====================================================== */

type SingleQueryConfig<
  F extends FieldValues,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Q extends QueryDefinition<any, any, any, any, any>,
  V extends Record<string, unknown> = Record<string, unknown>,
> =
  Q extends QueryDefinition<infer K, infer T, infer P, infer R, infer C>
    ? T extends 'mutation'
      ? {
          type: 'mutation'
          mutationConfig:
            | (<Qa extends QueriesArray>(
                props: FunctionProps<F, Qa, V>,
              ) => MutationConfig<P, R, C>)
            | MutationConfig<P, R, C>
          key: K
        }
      : {
          type: 'query'
          queryConfig?:
            | (<Qa extends QueriesArray>(
                props: FunctionProps<F, Qa, V>,
              ) => Omit<QueryProps<K, R>, 'keyToMap'>)
            | Omit<QueryProps<K, R>, 'keyToMap'>
          key: K
        }
    : never

type QueryPageConfigArray<
  F extends FieldValues,
  Q extends QueriesArray,
  V extends Record<string, unknown> = Record<string, unknown>,
> = {
  [I in keyof Q]: SingleQueryConfig<F, QueryAtIndex<Q, I>, V>
}
interface PageProps<
  F extends FieldValues = FieldValues,
  Q extends QueriesArray = QueriesArray,
  V extends Record<string, unknown> = Record<string, unknown>,
> {
  // Core identification
  id: string
  ns?: string

  // Data management
  contents?: ContentItemsType<F, Q, V>
  queries?: QueryPageConfigArray<F, Q, V>
  form?: FormPageProps<F, Q, V>
  variables?: V

  // Layout and view configuration
  viewSettings?: MappedItemsFunction<F, Q, ViewSettings, V> | ViewSettings

  // NEW IN 2.0: Metadata & SEO (generic over F and Q for dynamic metadata)
  meta?: MetadataConfig<F, Q>

  // NEW IN 2.0: Lazy loading configuration
  lazyLoading?: LazyLoadingConfig

  // NEW IN 2.0: Platform-specific overrides
  platformOverrides?: PlatformOverrides<F, Q, V>

  // NEW IN 2.0: Complete lifecycle callbacks (T074-T078)
  lifecycleCallbacks?: {
    onMountComplete?: (
      context: LifecycleContext<F, Q, V>,
    ) => void | Promise<void>
    onQuerySuccess?: (
      context: LifecycleContext<F, Q, V>,
      queryKey: string,
      data: unknown,
    ) => void | Promise<void>
    onQueryError?: (
      context: LifecycleContext<F, Q, V>,
      queryKey: string,
      error: Error,
    ) => void | Promise<void>
    onFormSubmit?: (
      context: LifecycleContext<F, Q, V>,
      result: unknown,
    ) => void | Promise<void>
    onValuesChange?: MappedItemsFunction<F, Q, void, V>
  }

  // Feature flags
  enableAuthControl?: boolean
}

/**
 * Platform-specific configuration overrides (proper type with PageProps reference)
 * Allows different behavior on web vs React Native
 */
export type PlatformOverrides<
  F extends FieldValues = FieldValues,
  Q extends QueriesArray = QueriesArray,
  V extends Record<string, unknown> = Record<string, unknown>,
> = {
  /** Web-specific overrides (React DOM) */
  web?: Partial<PageProps<F, Q, V>>
  /** React Native-specific overrides */
  native?: Partial<PageProps<F, Q, V>>
}

type ViewSettings = {
  withoutPadding?: boolean
  header?: {
    withoutPadding?: boolean
  }
  footer?: {
    withoutPadding?: boolean
  }
  disableRefreshing?: boolean

  // New optimized props
  layoutComponent?: <
    F extends FieldValues = FieldValues,
    Q extends QueriesArray = QueriesArray,
    V extends Record<string, unknown> = Record<string, unknown>,
  >(
    props: DefaultContainerProps<F, Q, V> & Record<string, unknown>,
  ) => React.ReactNode

  layoutProps?: Record<string, unknown>
  pageContainerComponent?: React.ComponentType<
    { children: React.ReactNode; id: string } & Record<string, unknown>
  >
  pageContainerProps?: Record<string, unknown>
  /** @deprecated Use layoutComponent instead */
  customLayoutComponent?: PageConfigProps['BodyContainer']
  /** @deprecated Use pageContainerComponent instead */
  customPageContainer?: PageConfigProps['PageContainer']
}

// Note: PageMetadataProps is now deprecated in favor of MetadataConfig
// The old interface is kept for reference but not exported (use MetadataConfig instead)
/* ======================================================
   PERFORMANCE OPTIMIZATION TYPES
====================================================== */

/**
 * Dependency Graph Node
 * Tracks which queries, form values, and mutations a component depends on
 */
export interface DependencyNode {
  componentId: string
  parentComponent: string | null
  childComponents: Array<string>
}

/**
 * Dependency Graph
 * Maps component IDs to their dependency nodes for selective re-rendering
 */
export interface DependencyGraph {
  nodes: Map<string, DependencyNode>
  addNode: (node: DependencyNode) => void
  getNode: (componentId: string) => DependencyNode | undefined
  getAffectedComponents: (changedKeys: Array<string>) => Array<string>
}

/**
 * Memoization Cache Types
 * For tracking memoized computations and their cache hits
 */
export interface MemoizationCacheStats {
  hits: number
  misses: number
  size: number
  maxSize: number
}

export interface RenderComponentsProps<
  F extends FieldValues = FieldValues,
  Q extends QueriesArray = QueriesArray,
  V extends Record<string, unknown> = Record<string, unknown>,
> {
  content: ContentItem<F, Q, V>
  ns: string
  pageId: string
  key: string
}

// Backward compatibility: PageMetadataProps is now MetadataConfig
export type { MetadataConfig as PageMetadataProps } from './config/types'

export type {
  MappedItemsFunction,
  Items,
  ContainerItem,
  ContentItem,
  MappedContents,
  ContentItemsType,
  FormPageProps,
  PageProps,
  ViewSettings,
  QueryPageConfigArray,
}

// Re-export all configuration types from config
export type {
  MetadataConfig,
  MetaTag,
  LazyLoadingConfig,
  ResolvedMetadata,
  OpenGraphConfig,
  OpenGraphImage,
  OpenGraphArticle,
  TwitterCardConfig,
  AlternatesConfig,
  IconsConfig,
  IconConfig,
  StructuredDataConfig,
  AIHintsConfig,
  RobotsConfig,
  MetadataStore,
  LlmsTxtConfig,
  LlmsTxtEntry,
} from './config/types'
