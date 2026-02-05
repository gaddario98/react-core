# Data Model: Universal Page System Redesign

**Feature**: 002-page-system-redesign
**Date**: 2025-10-30
**Purpose**: Complete TypeScript type system, entity relationships, and state transitions

This document defines all core entities, their relationships, validation rules, and lifecycle state machines for the redesigned page system.

---

## 1. Core Entities

### 1.1 PageProps<F, Q>

**Central Configuration Object** - Defines all aspects of a page including queries, forms, content, metadata, and view settings.

```typescript
interface PageProps<
  F extends FieldValues = FieldValues,
  Q extends QueriesArray = QueriesArray
> {
  // Core Identification
  id: string;                                     // Required: Unique page identifier
  ns?: string;                                    // Optional: i18n namespace for translations

  // Data Management
  queries?: QueryPageConfigArray<F, Q>;           // Query and mutation definitions
  form?: FormPageProps<F, Q>;                     // Form configuration and submission

  // Content & Layout
  contents?: ContentItemsType<F, Q>;              // Content items (array or mapping function)
  viewSettings?: ViewSettings | MappedItemsFunction<F, Q, ViewSettings>;

  // Metadata & SEO (NEW in 2.x)
  meta?: MetadataConfig<F, Q>;                    // SEO, Open Graph, structured data, AI hints

  // Lazy Loading (NEW in 2.x)
  lazyLoading?: LazyLoadingConfig;                // Code splitting and lazy loading config

  // Platform Overrides (NEW in 2.x)
  platformOverrides?: PlatformOverrides<F, Q>;    // Platform-specific configurations

  // Lifecycle Hooks
  onValuesChange?: MappedItemsFunction<F, Q, void>; // Callback when form values change

  // Feature Flags
  enableAuthControl?: boolean;                    // Enable authentication control
}
```

#### Generic Type Parameters

- **F extends FieldValues**: Form field types from React Hook Form
  - Provides full type safety for form values throughout the system
  - Example: `{ username: string; email: string; age: number }`

- **Q extends QueriesArray**: Array of query/mutation definitions
  - Enables type inference for query keys, parameters, and responses
  - Example: `[QueryDefinition<"getUser", "query", void, User, any>, ...]`

#### Validation Rules

1. **id must be non-empty string**: Used for React keys, error tracking, analytics
2. **At least one content source**: Warn if all of `contents`, `form`, `queries` are undefined (empty page)
3. **Query key consistency**: `usedQueries` in content items must reference keys from `queries` array
4. **Circular dependency detection**: Detect content item A depending on form value B, which depends on query C from item A

#### Relationships

- **Contains**: FormPageProps, ContentItems, ViewSettings, MetadataConfig, LazyLoadingConfig
- **Consumed by**: PageGenerator component (main orchestrator)
- **Type-safe references**: Content items reference query keys via `Q[number]["key"]` type

---

### 1.2 ContentItem<F, Q>

**Individual Renderable Units** - Discriminated union of content types that make up page content.

```typescript
// Base metadata fields (shared by all content types)
interface ContentItemMetadata<F extends FieldValues, Q extends QueriesArray> {
  // Dependency Tracking (for selective re-rendering)
  usedQueries?: Array<Q[number]["key"]>;          // Which queries this item depends on
  usedFormValues?: Array<keyof F>;                // Which form fields this item depends on

  // Layout & Positioning
  index?: number;                                 // Render order (sort by ascending index)
  usedBoxes?: number;                             // Grid layout hint (e.g., 12-column system)
  renderInFooter?: boolean;                       // Slot positioning: page footer
  renderInHeader?: boolean;                       // Slot positioning: page header

  // Interaction & Behavior
  isDraggable?: boolean;                          // Enable drag-and-drop for this item
  isInDraggableView?: boolean;                    // Context flag: is parent a draggable container
  hidden?: boolean;                               // Conditional visibility (can be dynamic)

  // React Optimization
  key?: string;                                   // Override React key (default: index-based)

  // Lazy Loading (NEW in 2.x)
  lazy?: boolean;                                 // Mark this item for lazy loading
  lazyTrigger?: "viewport" | "interaction" | "conditional"; // Lazy loading trigger type
}

// Custom Component Item
interface CustomContentItem<F extends FieldValues, Q extends QueriesArray>
  extends ContentItemMetadata<F, Q> {
  type: "custom";
  component:
    | React.JSX.Element                           // Static JSX element
    | MappedItemsFunction<F, Q, React.JSX.Element>; // Dynamic component with mapped props
}

// Container Item (nested content)
interface ContainerContentItem<F extends FieldValues, Q extends QueriesArray>
  extends ContentItemMetadata<F, Q> {
  type: "container";
  items: ContentItemsType<F, Q>;                  // Nested content items (recursive)
  component?: typeof pageConfig.ItemsContainer;   // Custom container component
}

// Discriminated Union
type ContentItem<F extends FieldValues, Q extends QueriesArray> =
  | CustomContentItem<F, Q>
  | ContainerContentItem<F, Q>;

// Content can be static array or dynamic mapping function
type ContentItemsType<F extends FieldValues, Q extends QueriesArray> =
  | ContentItem<F, Q>[]
  | MappedItemsFunction<F, Q, ContentItem<F, Q>[]>;
```

#### Dependency Tracking Fields

**usedQueries**: Declares which query responses this content item needs
- Example: `usedQueries: ["getUser", "getUserPosts"]`
- System uses this for selective re-rendering (only re-render when these queries update)

**usedFormValues**: Declares which form field values this content item needs
- Example: `usedFormValues: ["username", "email"]`
- System uses this for selective re-rendering (only re-render when these fields change)

#### Validation Rules

1. **Query key existence**: All keys in `usedQueries` must exist in parent `PageProps.queries`
2. **Form field existence**: All keys in `usedFormValues` must exist in form field definitions
3. **Circular dependencies**: Warn if detected (e.g., item A → form field B → query C → item A)
4. **Container recursion**: Support nested containers but warn if depth > 5 levels (performance concern)
5. **Lazy loading constraints**: Items marked `lazy: true` cannot have `renderInHeader: true` (headers should load immediately)

#### Relationships

- **Referenced by**: PageProps.contents
- **Can contain**: Other ContentItems (via ContainerItem.items, recursive)
- **Consumed by**: ContentRenderer component (renders each item with dependency tracking)

---

### 1.3 MappedProps<F, Q>

**Dynamic Function Context** - Standardized object passed to all mapping functions and custom components.

```typescript
interface MappedProps<F extends FieldValues, Q extends QueriesArray> {
  // Form State
  formValues: F;                                  // Current form values (all fields)
  setValue: UseFormSetValue<F>;                   // Function to update individual form fields

  // Query State
  allQuery: MultipleQueryResponse<Q>;             // All query responses (keyed by query key)
  allMutation: AllMutation<Q>;                    // All mutation functions (keyed by mutation key)
}

// Mapping Function Type
type MappedItemsFunction<
  F extends FieldValues,
  Q extends QueriesArray,
  ReturnType
> = (props: MappedProps<F, Q>) => ReturnType;
```

#### Usage Examples

```typescript
// Dynamic content based on query data
contents: (mappedProps) => {
  const user = mappedProps.allQuery.getUser?.data;

  return [
    {
      type: "custom",
      component: <WelcomeMessage name={user?.name} />,
    },
    {
      type: "custom",
      component: <ProfileStats stats={user?.stats} />,
      usedQueries: ["getUser"], // This item only needs getUser query
    },
  ];
}

// Dynamic view settings based on form values
viewSettings: (mappedProps) => ({
  withoutPadding: mappedProps.formValues.compactMode === true,
  disableRefreshing: mappedProps.allQuery.getUser?.isLoading,
})

// onValuesChange callback
onValuesChange: (mappedProps) => {
  if (mappedProps.formValues.country === "USA") {
    mappedProps.setValue("stateRequired", true);
  }
}
```

#### Memoization Requirements

**Critical for Performance (FR-009, FR-011)**:
- MappedProps object must be **stable across renders** (use `useMemo`)
- Individual fields (formValues, allQuery) should be memoized
- Prevents unnecessary re-renders of components receiving mapped props

**Implementation Pattern**:
```typescript
const mappedProps = useMemo<MappedProps<F, Q>>(
  () => ({
    formValues,        // From React Hook Form (already stable)
    setValue,          // From React Hook Form (already stable)
    allQuery,          // Memoized by usePageQueries
    allMutation,       // Memoized by usePageQueries
  }),
  [formValues, setValue, allQuery, allMutation]
);
```

#### Relationships

- **Derived from**: PageProps configuration + runtime state (queries, form)
- **Consumed by**: All mapping functions (contents mapper, viewSettings mapper, onValuesChange)
- **Type safety**: Generic over F and Q ensures correct typing throughout

---

### 1.4 DependencyGraph

**Performance Optimization** - Runtime data structure tracking component dependencies for selective re-rendering.

```typescript
interface DependencyNode {
  // Identity
  componentId: string;                            // Unique identifier for this component

  // Dependencies
  usedQueries: string[];                          // Query keys this component depends on
  usedFormValues: string[];                       // Form field keys this component depends on
  usedMutations: string[];                        // Mutation keys this component uses

  // Tree Structure
  parentComponent: string | null;                 // Parent component ID (null for root)
  childComponents: string[];                      // Child component IDs
}

class DependencyGraph {
  private nodes: Map<string, DependencyNode>;

  constructor() {
    this.nodes = new Map();
  }

  /**
   * Register a component and its dependencies
   */
  addNode(node: DependencyNode): void {
    this.nodes.set(node.componentId, node);

    // Update parent's children list
    if (node.parentComponent) {
      const parent = this.nodes.get(node.parentComponent);
      if (parent && !parent.childComponents.includes(node.componentId)) {
        parent.childComponents.push(node.componentId);
      }
    }
  }

  /**
   * Retrieve a node by component ID
   */
  getNode(componentId: string): DependencyNode | undefined {
    return this.nodes.get(componentId);
  }

  /**
   * Find all components affected by changed data keys
   * @param changedKeys - Array of changed query keys or form field keys
   * @returns Array of component IDs that need re-rendering
   */
  getAffectedComponents(changedKeys: string[]): string[] {
    const affected: string[] = [];

    for (const [componentId, node] of this.nodes.entries()) {
      const hasAffectedQuery = node.usedQueries.some(q => changedKeys.includes(q));
      const hasAffectedFormValue = node.usedFormValues.some(f => changedKeys.includes(f));

      if (hasAffectedQuery || hasAffectedFormValue) {
        affected.push(componentId);
      }
    }

    return affected;
  }

  /**
   * Detect circular dependencies in the graph
   * @returns Array of circular dependency paths (for debugging)
   */
  detectCircularDependencies(): string[][] {
    const cycles: string[][] = [];
    const visited = new Set<string>();
    const stack = new Set<string>();

    const dfs = (nodeId: string, path: string[]): void => {
      if (stack.has(nodeId)) {
        // Circular dependency found
        const cycleStart = path.indexOf(nodeId);
        cycles.push(path.slice(cycleStart).concat(nodeId));
        return;
      }

      if (visited.has(nodeId)) return;

      visited.add(nodeId);
      stack.add(nodeId);
      path.push(nodeId);

      const node = this.nodes.get(nodeId);
      if (node) {
        for (const childId of node.childComponents) {
          dfs(childId, [...path]);
        }
      }

      stack.delete(nodeId);
    };

    for (const nodeId of this.nodes.keys()) {
      if (!visited.has(nodeId)) {
        dfs(nodeId, []);
      }
    }

    return cycles;
  }
}
```

#### Usage in PageGenerator

```typescript
function PageGenerator<F extends FieldValues, Q extends QueriesArray>(
  props: PageProps<F, Q>
) {
  // Create graph once on mount
  const graphRef = useRef(new DependencyGraph());

  // Build graph from content items
  useEffect(() => {
    const graph = graphRef.current;

    if (props.contents && Array.isArray(props.contents)) {
      props.contents.forEach((item, index) => {
        graph.addNode({
          componentId: item.key || `content-${index}`,
          usedQueries: item.usedQueries || [],
          usedFormValues: item.usedFormValues || [],
          usedMutations: [],
          parentComponent: null,
          childComponents: [],
        });
      });
    }

    // Detect and warn about circular dependencies
    const cycles = graph.detectCircularDependencies();
    if (cycles.length > 0) {
      console.warn("[PageGenerator] Circular dependencies detected:", cycles);
    }
  }, [props.contents]);

  // When query updates, find affected components
  const handleQueryUpdate = useCallback((queryKey: string) => {
    const affected = graphRef.current.getAffectedComponents([queryKey]);
    console.log(`[PageGenerator] Query "${queryKey}" affects:`, affected);
    // Trigger selective re-render logic here
  }, []);
}
```

#### State Transitions

1. **Graph Construction** (on mount):
   - Empty graph → Parse content items → Add nodes → Complete graph

2. **Dependency Registration** (per content item):
   - Create node → Extract dependencies → Add to graph → Link parent/children

3. **Query Update** (runtime):
   - Query changes → Call `getAffectedComponents([queryKey])` → Get affected IDs → Trigger re-renders

4. **Form Update** (runtime):
   - Form field changes → Call `getAffectedComponents([fieldKey])` → Get affected IDs → Trigger re-renders

#### Relationships

- **Built from**: ContentItem dependency declarations (usedQueries, usedFormValues)
- **Used by**: ContentRenderer for selective rendering decisions
- **Stored in**: `useRef` in PageGenerator (persists across renders without causing re-renders)

---

### 1.5 MetadataConfig<F, Q>

**SEO and AI Metadata** - Configuration for page metadata, SEO tags, and AI crawler hints.

```typescript
interface MetadataConfig<F extends FieldValues, Q extends QueriesArray> {
  // Basic Metadata
  title?: string | MappedItemsFunction<F, Q, string>;
  description?: string | MappedItemsFunction<F, Q, string>;
  documentLang?: string;                          // HTML lang attribute (e.g., "en", "it")
  keywords?: string[] | MappedItemsFunction<F, Q, string[]>;

  // Open Graph (Social Media)
  openGraph?: OpenGraphConfig<F, Q>;

  // Structured Data (Search Engines)
  structuredData?: StructuredDataConfig<F, Q>;

  // AI Crawler Hints (NEW)
  aiHints?: AIHintsConfig<F, Q>;

  // Robots Meta Tags
  robots?: RobotsConfig;

  // Custom Meta Tags
  customMeta?: MetaTag[] | MappedItemsFunction<F, Q, MetaTag[]>;
}

// Open Graph Configuration (Facebook, LinkedIn, Twitter/X)
interface OpenGraphConfig<F extends FieldValues, Q extends QueriesArray> {
  type?: "website" | "article" | "product" | "profile";
  title?: string | MappedItemsFunction<F, Q, string>;
  description?: string | MappedItemsFunction<F, Q, string>;
  image?: string | MappedItemsFunction<F, Q, string>;  // URL to preview image
  url?: string | MappedItemsFunction<F, Q, string>;    // Canonical URL
  siteName?: string;
  locale?: string;                                // e.g., "en_US", "it_IT"
}

// Structured Data Configuration (schema.org JSON-LD)
interface StructuredDataConfig<F extends FieldValues, Q extends QueriesArray> {
  type: "Article" | "Product" | "WebPage" | "FAQPage" | "Organization" | "Person";
  schema: Record<string, any> | MappedItemsFunction<F, Q, Record<string, any>>;
}

// AI Crawler Hints (for AI search engines and LLMs)
interface AIHintsConfig<F extends FieldValues, Q extends QueriesArray> {
  contentClassification?: string | MappedItemsFunction<F, Q, string>; // e.g., "documentation", "tutorial", "reference"
  modelHints?: string[] | MappedItemsFunction<F, Q, string[]>;        // Hints for AI models (e.g., ["code-heavy", "technical"])
  contextualInfo?: string | MappedItemsFunction<F, Q, string>;        // Additional context for AI understanding
}

// Robots Configuration (indexing directives)
interface RobotsConfig {
  noindex?: boolean;                              // Prevent indexing
  nofollow?: boolean;                             // Don't follow links
  noarchive?: boolean;                            // Don't cache page
  nosnippet?: boolean;                            // Don't show snippets in search results
  maxImagePreview?: "none" | "standard" | "large";
  maxSnippet?: number;                            // Max snippet length in search results
}

// Custom Meta Tag
interface MetaTag {
  name?: string;                                  // <meta name="...">
  property?: string;                              // <meta property="..."> (for Open Graph)
  content: string;                                // <meta content="...">
  id?: string;                                    // For JSON-LD scripts: <script id="...">
}
```

#### Usage Examples

```typescript
// Static metadata
meta: {
  title: "My Page Title",
  description: "A comprehensive guide to using our product",
  keywords: ["react", "pages", "performance"],
  robots: { noindex: false, nofollow: false },
}

// Dynamic metadata from query data
meta: {
  title: (props) => props.allQuery.getProduct?.data?.name || "Product",
  description: (props) => props.allQuery.getProduct?.data?.description,
  openGraph: {
    type: "product",
    title: (props) => props.allQuery.getProduct?.data?.name,
    image: (props) => props.allQuery.getProduct?.data?.imageUrl,
    url: window.location.href,
  },
  structuredData: {
    type: "Product",
    schema: (props) => ({
      "@context": "https://schema.org",
      "@type": "Product",
      name: props.allQuery.getProduct?.data?.name,
      description: props.allQuery.getProduct?.data?.description,
      offers: {
        "@type": "Offer",
        price: props.allQuery.getProduct?.data?.price,
        priceCurrency: "USD",
      },
    }),
  },
}

// AI hints for documentation pages
meta: {
  title: "API Reference - User Authentication",
  aiHints: {
    contentClassification: "technical-documentation",
    modelHints: ["api-reference", "code-examples", "authentication"],
    contextualInfo: "Complete API documentation for user authentication endpoints including examples and error codes",
  },
}
```

#### Validation Rules

1. **At least one field required**: If `meta` prop exists, at least one metadata field should be defined
2. **Valid structured data**: `structuredData.type` must match schema.org vocabulary
3. **URL validation**: `openGraph.image` and `openGraph.url` should be valid URLs (warn if not)
4. **robots consistency**: If `robots.noindex` is true, warn if structured data is also configured (won't be indexed anyway)

#### Relationships

- **Embedded in**: PageProps.meta
- **Consumed by**: MetadataManager component (applies metadata to document head)
- **Platform-dependent**: Full support on web, graceful no-op on React Native

---

### 1.6 PlatformAdapter

**Cross-Platform Abstraction** - Interface for platform-specific rendering implementations.

```typescript
interface PlatformAdapter {
  // Platform Identity
  name: "web" | "native";

  /**
   * Inject metadata into platform-specific head/manifest
   * @param metadata - Resolved metadata configuration
   */
  injectMetadata(metadata: MetadataConfig<any, any>): void;

  /**
   * Render page container with platform-appropriate wrapper
   * @param children - Page content
   * @param settings - View settings configuration
   */
  renderContainer(
    children: React.ReactNode,
    settings: ViewSettings
  ): React.ReactNode;

  /**
   * Render scrollable container
   * @param children - Scrollable content
   * @param settings - View settings configuration
   */
  renderScrollView(
    children: React.ReactNode,
    settings: ViewSettings
  ): React.ReactNode;

  /**
   * Check if platform supports a specific feature
   * @param feature - Feature name to check
   */
  supportsFeature(feature: PlatformFeature): boolean;
}

type PlatformFeature =
  | "metadata"          // Document head manipulation
  | "lazyLoading"       // Code splitting and lazy loading
  | "suspense"          // React Suspense support
  | "documentHead"      // Direct document.head access
  | "intersectionObserver"; // IntersectionObserver API

// Platform Overrides (per-platform configurations)
interface PlatformOverrides<F extends FieldValues, Q extends QueriesArray> {
  web?: Partial<PageProps<F, Q>>;                 // Web-specific overrides
  native?: Partial<PageProps<F, Q>>;              // React Native-specific overrides
}
```

#### Web Platform Adapter

```typescript
// config/platformAdapters/web.ts
export const webAdapter: PlatformAdapter = {
  name: "web",

  injectMetadata(metadata) {
    // Update document.title
    if (metadata.title) {
      document.title = typeof metadata.title === "string"
        ? metadata.title
        : metadata.title.toString();
    }

    // Inject meta tags
    if (metadata.description) {
      updateOrCreateMeta("name", "description", metadata.description);
    }

    // Inject Open Graph tags
    if (metadata.openGraph) {
      updateOrCreateMeta("property", "og:title", metadata.openGraph.title);
      updateOrCreateMeta("property", "og:description", metadata.openGraph.description);
      updateOrCreateMeta("property", "og:image", metadata.openGraph.image);
      // ... more tags
    }

    // Inject JSON-LD structured data
    if (metadata.structuredData) {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.id = "structured-data";
      script.textContent = JSON.stringify(metadata.structuredData.schema);

      const existing = document.getElementById("structured-data");
      if (existing) {
        existing.replaceWith(script);
      } else {
        document.head.appendChild(script);
      }
    }
  },

  renderContainer(children, settings) {
    const Container = settings.customPageContainer || pageConfig.PageContainer;
    return <Container withoutPadding={settings.withoutPadding}>{children}</Container>;
  },

  renderScrollView(children, settings) {
    return (
      <div style={{ overflowY: "auto", height: "100%" }}>
        {children}
      </div>
    );
  },

  supportsFeature(feature) {
    switch (feature) {
      case "metadata":
      case "documentHead":
        return typeof document !== "undefined";
      case "lazyLoading":
      case "suspense":
        return true;
      case "intersectionObserver":
        return typeof IntersectionObserver !== "undefined";
      default:
        return false;
    }
  },
};
```

#### React Native Platform Adapter

```typescript
// config/platformAdapters/native.ts
import { View, ScrollView } from "react-native";

export const nativeAdapter: PlatformAdapter = {
  name: "native",

  injectMetadata(metadata) {
    // No-op: React Native doesn't have document.head
    // Metadata can be stored for SSR or analytics, but not rendered
    console.log("[PlatformAdapter] Metadata (native - no-op):", metadata);
  },

  renderContainer(children, settings) {
    const Container = settings.customPageContainer || View;
    return (
      <Container style={{ padding: settings.withoutPadding ? 0 : 16 }}>
        {children}
      </Container>
    );
  },

  renderScrollView(children, settings) {
    return (
      <ScrollView
        contentContainerStyle={{ padding: settings.withoutPadding ? 0 : 16 }}
        refreshControl={settings.disableRefreshing ? undefined : /* RefreshControl */}
      >
        {children}
      </ScrollView>
    );
  },

  supportsFeature(feature) {
    switch (feature) {
      case "lazyLoading":
      case "suspense":
        return true;
      case "metadata":
      case "documentHead":
      case "intersectionObserver":
        return false;
      default:
        return false;
    }
  },
};
```

#### Relationships

- **Injected via**: PlatformAdapterProvider context or PageProps.platformOverrides
- **Consumed by**: PageGenerator and MetadataManager
- **State**: Stateless, purely functional adapter pattern

---

## 2. Entity Relationships

### 2.1 Entity Relationship Diagram (Textual)

```
PageProps (Root Configuration)
  ├── id: string
  ├── ns?: string
  ├── queries?: QueryPageConfigArray<F, Q>
  │     └── [SingleQueryConfig, ...]
  ├── form?: FormPageProps<F, Q>
  │     ├── defaultValueQueryKey?: string[]
  │     ├── defaultValueQueryMap?: Function
  │     ├── submit?: Array<Submit> | MappedFunction
  │     └── data?: Array<FormManagerConfig> | MappedFunction
  ├── contents?: ContentItemsType<F, Q>
  │     └── ContentItem[] | MappedFunction
  │           ├── CustomContentItem
  │           │     ├── type: "custom"
  │           │     ├── component: JSX.Element | MappedFunction
  │           │     ├── usedQueries?: string[]  ─────┐ (references)
  │           │     └── usedFormValues?: string[] ───┼─────┐
  │           └── ContainerContentItem              │     │
  │                 ├── type: "container"            │     │
  │                 ├── items: ContentItemsType ────┘     │
  │                 └── component?: ContainerComponent    │
  ├── viewSettings?: ViewSettings | MappedFunction        │
  ├── meta?: MetadataConfig<F, Q>                         │
  │     ├── title?: string | MappedFunction               │
  │     ├── description?: string | MappedFunction         │
  │     ├── openGraph?: OpenGraphConfig                   │
  │     ├── structuredData?: StructuredDataConfig         │
  │     ├── aiHints?: AIHintsConfig                       │
  │     └── robots?: RobotsConfig                         │
  ├── lazyLoading?: LazyLoadingConfig                     │
  ├── platformOverrides?: PlatformOverrides<F, Q>         │
  ├── onValuesChange?: MappedFunction                     │
  └── enableAuthControl?: boolean                         │
                                                          │
MappedProps (Runtime Context) ──────────────────────────┘
  ├── formValues: F  ←─── (used by usedFormValues)
  ├── setValue: Function
  ├── allQuery: MultipleQueryResponse<Q>  ←─── (used by usedQueries)
  └── allMutation: AllMutation<Q>

DependencyGraph (Performance Tracking)
  └── nodes: Map<string, DependencyNode>
        └── DependencyNode
              ├── componentId: string
              ├── usedQueries: string[]  ←─── (extracted from ContentItem)
              ├── usedFormValues: string[]  ←─── (extracted from ContentItem)
              ├── usedMutations: string[]
              ├── parentComponent: string | null
              └── childComponents: string[]

PlatformAdapter (Rendering Abstraction)
  ├── name: "web" | "native"
  ├── injectMetadata(metadata: MetadataConfig) → void
  ├── renderContainer(children, settings) → ReactNode
  ├── renderScrollView(children, settings) → ReactNode
  └── supportsFeature(feature: PlatformFeature) → boolean
```

### 2.2 Data Flow

```
1. Configuration Flow (Setup)
   PageProps (user input)
     → PageGenerator (orchestrator)
       → usePageQueries (fetch data)
       → useFormPage (manage form)
       → usePageConfig (combine state)
         → MappedProps (runtime context)

2. Rendering Flow (Initial Render)
   PageProps.contents
     → ContentRenderer (iterates items)
       → DependencyGraph.addNode (register dependencies)
       → RenderComponent (render individual items)
         → MappedProps (passed to custom components)

3. Update Flow (Data Changes)
   Query updates OR Form field changes
     → DependencyGraph.getAffectedComponents([changedKeys])
       → Affected component IDs
         → ContentRenderer (selective re-render)
           → Only affected components re-render

4. Metadata Flow (SEO/AI)
   PageProps.meta
     → MetadataManager (resolve dynamic values)
       → MappedProps (evaluate mapping functions)
         → PlatformAdapter.injectMetadata()
           → Web: document.head updates
           → Native: no-op (graceful degradation)

5. Lazy Loading Flow (Code Splitting)
   ContentItem.lazy = true
     → LazyContent wrapper
       → useIntersectionObserver (detect viewport)
         → inView = true
           → React.lazy() (fetch bundle)
             → Suspense (show fallback during load)
               → Component renders when ready
```

---

## 3. State Transitions

### 3.1 Page Lifecycle

```
┌─────────────┐
│  Unmounted  │
└──────┬──────┘
       │ PageGenerator mounts
       ↓
┌─────────────┐
│Initializing │ ← Queries prepare, form initializes
└──────┬──────┘
       │ All queries start fetching
       ↓
┌─────────────┐
│   Loading   │ ← Waiting for required queries to resolve
└──────┬──────┘
       │ All required queries succeed
       ↓
┌─────────────┐
│    Ready    │ ← User can interact, data is available
└──────┬──────┘
       │
       ├─→ User interaction / Query refetch
       │   ↓
       │ ┌─────────────┐
       │ │  Updating   │ ← State updates in progress
       │ └──────┬──────┘
       │        │ Updates complete
       │        ↓
       └────────┘ (back to Ready)
       │
       │ Mutation failure / Query error
       ↓
┌─────────────┐
│    Error    │ ← Error state (can retry)
└──────┬──────┘
       │ Retry / Recovery
       ↓
   (back to Loading or Ready)
```

**State Descriptions**:

- **Unmounted**: Component not yet mounted, no state initialized
- **Initializing**: Component mounted, queries preparing, form defaults applying
- **Loading**: Queries executing, waiting for required data (show loading indicators)
- **Ready**: All required data loaded, user can interact, page fully functional
- **Updating**: Data refetching or form submitting (optimistic updates possible)
- **Error**: Critical error occurred (show error UI, allow retry)

**Triggers**:
- Unmounted → Initializing: PageGenerator mounts
- Initializing → Loading: Queries start executing
- Loading → Ready: All required queries resolve successfully
- Ready → Updating: User interaction (form change, mutation call, manual refetch)
- Updating → Ready: Updates complete successfully
- Ready/Updating → Error: Query/mutation fails with non-recoverable error
- Error → Loading: User triggers retry

---

### 3.2 Metadata Lifecycle

```
┌──────────────────┐
│ Static Metadata  │ ← Initial metadata from PageProps.meta (if static)
└────────┬─────────┘
         │ MetadataManager evaluates metadata
         ↓
┌──────────────────┐
│  Document Head   │ ← Metadata injected into document.head (Web)
└────────┬─────────┘   or stored (React Native, SSR)
         │
         │ Queries load with data
         ↓
┌──────────────────┐
│ Dynamic Metadata │ ← Metadata re-evaluated with query data
│     Update       │   (if meta uses mapping functions)
└────────┬─────────┘
         │ PlatformAdapter.injectMetadata()
         ↓
┌──────────────────┐
│  Document Head   │ ← Updated metadata in document.head
│     Updated      │
└────────┬─────────┘
         │
         │ Form values change (if metadata depends on form)
         ↓
┌──────────────────┐
│ Dynamic Metadata │ ← Metadata re-evaluated with form values
│     Update       │
└────────┬─────────┘
         │
         ↓
  (cycle continues on data/form changes)

Special Case: React Native
┌──────────────────┐
│ Platform Native  │ ← PlatformAdapter.name === "native"
└────────┬─────────┘
         │ injectMetadata() called
         ↓
┌──────────────────┐
│      No-op       │ ← Metadata not rendered (no document.head)
└──────────────────┘   Metadata stored for SSR or analytics
```

**State Descriptions**:

- **Static Metadata**: Initial metadata defined in PageProps (strings or values)
- **Document Head**: Metadata injected into DOM (web) or stored (native/SSR)
- **Dynamic Metadata Update**: Re-evaluation when dependencies (queries, form) change
- **Document Head Updated**: DOM updated with new metadata values
- **No-op**: React Native gracefully ignores metadata rendering

**Triggers**:
- Static Metadata → Document Head: Initial render, MetadataManager mounts
- Document Head → Dynamic Metadata Update: Query data loads or form values change
- Dynamic Metadata Update → Document Head Updated: PlatformAdapter applies updates

---

### 3.3 Lazy Content Lifecycle

```
┌──────────────┐
│ Not Visible  │ ← Content item marked lazy: true, not in viewport
└──────┬───────┘
       │ IntersectionObserver detects element entering viewport
       │ OR user interaction triggers lazy load
       │ OR conditional logic evaluates to true
       ↓
┌──────────────┐
│ Intersection │ ← Lazy loading trigger fires
│   Detected   │
└──────┬───────┘
       │ React.lazy() initiates dynamic import
       ↓
┌──────────────┐
│   Loading    │ ← Suspense shows fallback UI (loading indicator)
└──────┬───────┘
       │ Bundle downloaded and parsed
       ↓
┌──────────────┐
│   Rendered   │ ← Component code loaded, Suspense resolves, component renders
└──────┬───────┘
       │
       │ Conditional visibility changes (hidden = true)
       ↓
┌──────────────┐
│    Hidden    │ ← Component still in memory but not visible
└──────┬───────┘
       │ Visibility restored OR component unmounts
       ↓
┌──────────────┐
│ Not Visible  │ ← Component unmounted, memory released
└──────────────┘   (React.lazy cache keeps code loaded)

Error Case:
┌──────────────┐
│   Loading    │
└──────┬───────┘
       │ Network error or bundle load failure
       ↓
┌──────────────┐
│ Error Boundary│ ← ErrorBoundary catches error, shows fallback UI
└──────┬───────┘
       │ User triggers retry
       ↓
   (back to Loading)
```

**State Descriptions**:

- **Not Visible**: Lazy content not loaded, waiting for trigger condition
- **Intersection Detected**: Trigger condition met, lazy loading initiated
- **Loading**: Dynamic import in progress, Suspense fallback shown
- **Rendered**: Component code loaded and rendering normally
- **Hidden**: Component exists but conditionally hidden (can be restored quickly)
- **Error Boundary**: Loading failed, error UI shown with retry option

**Triggers**:
- Not Visible → Intersection Detected: Viewport intersection OR user interaction OR conditional true
- Intersection Detected → Loading: React.lazy() dynamic import starts
- Loading → Rendered: Bundle successfully downloaded and parsed
- Rendered → Hidden: `hidden` prop becomes true
- Hidden → Not Visible: Component unmounts completely
- Loading → Error Boundary: Bundle load fails (network error, 404, etc.)
- Error Boundary → Loading: User clicks retry button

---

## 4. Validation Rules Summary

### PageProps Validation

1. **id**: Must be non-empty string
2. **Content presence**: Warn if `contents`, `form`, and `queries` are all undefined
3. **Query key consistency**: All `usedQueries` references must exist in `queries` array
4. **Circular dependencies**: Detect and warn if item A → field B → query C → item A

### ContentItem Validation

1. **Query keys**: All keys in `usedQueries` must exist in parent PageProps.queries
2. **Form fields**: All keys in `usedFormValues` must exist in form field definitions
3. **Container depth**: Warn if nested containers exceed 5 levels
4. **Lazy constraints**: Items with `lazy: true` cannot have `renderInHeader: true`

### MetadataConfig Validation

1. **Non-empty**: If `meta` prop exists, at least one field should be defined
2. **Structured data type**: Must match schema.org vocabulary (Article, Product, etc.)
3. **URL format**: `openGraph.image` and `openGraph.url` should be valid URLs
4. **robots consistency**: Warn if `noindex: true` but structured data configured

### DependencyGraph Validation

1. **Node uniqueness**: Component IDs must be unique
2. **Circular detection**: Detect circular dependencies and log warnings
3. **Orphaned nodes**: Warn if nodes reference non-existent parents

---

## 5. Migration Notes (1.x → 2.x)

### Breaking Changes

1. **MetadataConfig interface**: Old `PageMetadataProps` renamed to `MetadataConfig` with expanded fields
   - **Migration**: Rename `PageMetadataProps` → `MetadataConfig`, add new fields as needed

2. **Lazy loading**: New `lazy` field on ContentItem replaces manual lazy loading patterns
   - **Migration**: Replace manual `React.lazy()` with `lazy: true` on content items

3. **Platform adapters**: New `platformOverrides` and adapter system
   - **Migration**: Platform-specific code should move to `platformOverrides.web` or `platformOverrides.native`

### Backward Compatibility

- Existing `PageProps` fields unchanged (id, ns, contents, queries, form, viewSettings, onValuesChange, enableAuthControl)
- All new fields optional (meta, lazyLoading, platformOverrides)
- Existing dependency tracking fields (usedQueries, usedFormValues) work as before

### Recommended Upgrades

1. **Add metadata**: Configure `meta` field for improved SEO
2. **Use lazy loading**: Mark below-the-fold content as `lazy: true`
3. **Optimize dependencies**: Explicitly declare `usedQueries` and `usedFormValues` for better performance

---

## 6. Summary

This data model defines 6 core entities:

1. **PageProps<F, Q>**: Root configuration with 11 top-level fields (3 new in 2.x)
2. **ContentItem<F, Q>**: Discriminated union with 14 metadata fields (2 new in 2.x)
3. **MappedProps<F, Q>**: 4-field runtime context object
4. **DependencyGraph**: Performance optimization with 3 public methods
5. **MetadataConfig<F, Q>**: 9-field SEO/AI configuration (new in 2.x)
6. **PlatformAdapter**: 4-method cross-platform abstraction (new in 2.x)

All entities have:
- Complete TypeScript definitions with generics
- Validation rules for data integrity
- Clear relationship mappings
- State transition descriptions (where applicable)
- Migration guidance from 1.x to 2.x

This data model serves as the foundation for all Phase 2 implementation tasks.
