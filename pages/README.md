# React Pages v2 - Universal Page System

A powerful, performance-optimized React component library for creating dynamic pages that work seamlessly across web (React DOM) and React Native with integrated form management, query handling, SEO metadata, lazy loading, and content rendering.

**Latest Release**: v2.0.0 | **Upgrade from v1.x?** See [MIGRATION.md](./MIGRATION.md)

## 📋 Table of Contents

- [Features](#-features)
- [Installation](#-installation)
- [Quick Start](#-quick-start)
- [Core Components](#-core-components)
- [Features & Functionality](#-features--functionality)
- [API Reference](#-api-reference)
- [Advanced Usage](#-advanced-usage)
- [TypeScript Support](#-typescript-support)
- [Performance](#-performance)
- [Troubleshooting](#-troubleshooting)

## 🚀 Features

### Core Capabilities
- **🌐 Universal Cross-Platform**: Single `PageProps` configuration works on web (React DOM) and React Native
- **⚡ Performance Optimized**: Dependency graph for selective re-rendering, debounced form inputs, 90% fewer re-renders
- **🔍 SEO & AI Metadata**: Dynamic metadata with Open Graph, JSON-LD, and AI hints for search engines
- **📦 Lazy Loading & Code Splitting**: Viewport-triggered lazy loading and conditional content loading
- **🔧 Fully Extensible**: Custom components, lifecycle callbacks, and platform adapters
- **📱 React Native Support**: Official cross-platform support alongside web
- **🚨 Deprecation Warnings**: v1.x API migration guidance with built-in deprecation notices

### Developer Experience
- **TypeScript First**: Full generic type support with strict mode enabled
- **Form Integration**: Built-in form management with validation and React Hook Form integration
- **Query Management**: Seamless integration with TanStack React Query
- **Internationalization**: Built-in i18n support with react-i18next
- **Tree-Shakeable**: 5 optimized entry points for minimal bundle footprint
- **React Compiler**: Automatic memoization and optimization via babel-plugin-react-compiler

## 📦 Installation

```bash
npm install @gaddario98/react-pages
```

### Peer Dependencies

Ensure you have the required peer dependencies installed:

```bash
npm install react@^19.2.0 react-dom@^19.2.0 react-hook-form@^7.64.0 @tanstack/react-query@^5.90.2 react-i18next@^16.0.1 i18next
```

> **Note**: `react-helmet-async` is optional in v2.x. Metadata injection is handled automatically by the library on web platforms.

## ⚡ Quick Start

Get started in 5 minutes:

```tsx
import { PageGenerator } from '@gaddario98/react-pages';

export function MyPage() {
  return (
    <PageGenerator
      id="my-page"
      meta={{
        title: "My Page",
        description: "My awesome page"
      }}
      contents={[
        {
          type: "custom",
          component: <h1>Welcome!</h1>
        }
      ]}
    />
  );
}
```

## 🏗️ Core Components

### PageGenerator

The main orchestrator component that manages page lifecycle, rendering, and data flow.

**What it does:**
- Orchestrates entire page lifecycle and state management
- Integrates form management with React Hook Form
- Manages queries and mutations with React Query
- Handles metadata injection (SEO, Open Graph, JSON-LD, AI hints)
- Supports lazy loading and code splitting
- Manages internationalization context
- Handles authentication and access control
- Applies lifecycle callbacks (mount, query success/error, form submit)
- Manages dependency graphs for selective re-rendering

**When to use:**
- Creating any dynamic page with forms, queries, or dynamic content
- Pages requiring SEO metadata
- Pages with complex data dependencies
- Multi-step forms or workflows

### ContentRenderer

Renders individual content items with dependency tracking and performance optimization.

**What it does:**
- Renders different content item types (custom, container, mapped)
- Tracks content dependencies on queries and form values
- Enables selective re-rendering based on actual data usage
- Provides refresh functionality for content items
- Handles content error boundaries and lazy loading
- Supports custom component injection

**When to use:**
- When you need selective re-rendering of page sections
- Complex pages with many independent content sections
- Performance-critical applications with frequent updates

### Container

Layout container that organizes content hierarchically.

**What it does:**
- Provides flexible layout for organizing content items
- Manages header/footer sections
- Handles responsive layout on web and React Native
- Applies padding/spacing configuration
- Supports custom layout components
- Manages platform-specific rendering

**When to use:**
- Creating multi-section layouts (header, body, footer)
- Organizing complex page structures
- Building responsive designs

### LazyContent

Component for lazy-loading content with Suspense and fallbacks.

**What it does:**
- Lazy-loads components on demand (viewport, interaction, conditional)
- Uses React Suspense for loading states
- Provides error boundaries for failed loads
- Supports intersection observer for viewport detection
- Configurable loading placeholders
- Performance metrics tracking in development

**When to use:**
- Loading heavy components only when needed
- Reducing initial bundle size
- Improving time-to-interactive (TTI)
- Building infinite scroll or pagination

### MetadataManager

Manages all metadata injection and SEO optimization.

**What it does:**
- Injects metadata into document head (web platforms)
- Supports dynamic metadata evaluation based on page state
- Handles Open Graph tags for social sharing
- Injects JSON-LD structured data for search engines
- Supports AI hints and crawler-specific metadata
- Applies robots meta tags (noindex, nofollow, etc.)
- Supports custom meta tags
- Platform-aware injection (web: document head, native: no-op)

**When to use:**
- Pages requiring search engine optimization
- Social media sharing (Open Graph)
- Structured data for rich snippets
- Controlling indexing behavior

### ErrorBoundary

Error boundary for graceful error handling in lazy-loaded content.

**What it does:**
- Catches errors in lazy-loaded components
- Provides fallback UI for error states
- Logs errors for debugging
- Prevents entire page crash from component failures
- Optional error reporting integration

**When to use:**
- Wrapping lazy-loaded content
- Preventing cascade failures in complex pages
- Development debugging of async components

## 🎯 Features & Functionality

### 1. Universal Cross-Platform Support

**What it does:**
- Single PageProps configuration generates web and React Native pages
- Platform adapters abstract platform-specific implementations
- Feature detection with graceful degradation
- Platform-specific component overrides

**Example:**
```tsx
<PageGenerator
  id="universal-page"
  platformOverrides={{
    web: {
      viewSettings: { withHeader: true }
    },
    native: {
      viewSettings: { withHeader: false }
    }
  }}
  // Single content configuration for both platforms
  contents={[...]}
/>
```

### 2. Performance Optimization (80-90% fewer re-renders)

**What it does:**
- **Dependency Graph**: Tracks which content items depend on which queries/form values
- **Selective Re-rendering**: Only updates components whose dependencies changed
- **Memoization**: React.memo + fast-deep-equal for stable props
- **Form Debouncing**: Reduces keystroke re-renders by 80% with configurable debounce delays
- **React Compiler Integration**: Automatic optimization at compile time
- **Stable References**: useMemoizedProps hook for stable object/function references

**Example:**
```tsx
<PageGenerator
  id="optimized-page"
  form={{
    data: [{ name: "search", debounceDelay: 300 }],
  }}
  contents={[
    {
      type: "custom",
      component: <SearchResults />,
      usedFormValues: ["search"],  // Re-renders only when search changes
      usedQueries: ["results"]      // Re-renders only when results query changes
    }
  ]}
/>
```

**Performance Metrics:**
- Without optimization: Full page re-render on any query/form change
- With optimization: Only affected sections re-render
- Result: 80-90% reduction in re-renders for complex pages

### 3. SEO & Metadata Management

**What it does:**
- **Page Title**: Dynamic or static page titles
- **Meta Description**: SEO description tags
- **Keywords**: Searchable keywords for SEO
- **Open Graph Tags**: Social media sharing (title, description, image, URL, type)
- **JSON-LD Structured Data**: Rich snippets for search engines
- **AI Hints**: Custom metadata for AI crawlers and models
- **Robots Meta Tags**: Control indexing (noindex, nofollow, noarchive, etc.)
- **Custom Meta Tags**: Arbitrary meta tag support
- **i18n Support**: Automatic translation of metadata
- **Dynamic Evaluation**: Metadata based on page state

**Example:**
```tsx
<PageGenerator
  id="seo-page"
  meta={{
    title: "Product Details",
    description: "High-quality product with amazing features",
    keywords: ["product", "quality"],
    openGraph: {
      title: "Check out this product!",
      description: "Amazing features included",
      image: "https://example.com/og-image.png",
      url: "https://example.com/product",
      type: "product"
    },
    structuredData: {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": "Product Name",
      "price": "99.99"
    },
    aiHints: {
      summary: "Product information page",
      excludeFromIndexing: false
    },
    robots: {
      noindex: false,
      nofollow: false,
      noarchive: false
    }
  }}
  contents={[...]}
/>
```

### 4. Form Management & Validation

**What it does:**
- **Field Configuration**: Text, email, password, textarea, select, checkbox, radio, date, etc.
- **Built-in Validation**: Required, pattern, min/max length, email format, custom validators
- **React Hook Form Integration**: Full form state management
- **Default Values**: From queries or manual configuration
- **Form State**: Tracks form values, errors, touched fields, submission state
- **Submission Handling**: Success/error callbacks with access to mutations
- **Debouncing**: Configurable keystroke debouncing (80% reduction in re-renders)
- **Custom Submit**: Full control over submission logic

**Example:**
```tsx
<PageGenerator
  id="form-page"
  form={{
    data: [
      {
        name: "email",
        type: "email",
        placeholder: "your@email.com",
        validation: {
          required: "Email is required",
          pattern: { value: /^[^@]+@[^@]+$/, message: "Invalid email" }
        }
      },
      {
        name: "message",
        type: "textarea",
        placeholder: "Your message"
      }
    ],
    submit: [
      {
        onSuccess: (values, { allMutation }) => {
          allMutation.sendEmail.mutate(values);
        },
        onError: (error) => console.error(error),
        component: ({ onClick, isLoading }) => (
          <button onClick={onClick} disabled={isLoading}>
            {isLoading ? "Sending..." : "Send"}
          </button>
        )
      }
    ]
  }}
  contents={[...]}
/>
```

### 5. Query & Mutation Management

**What it does:**
- **React Query Integration**: Seamless query and mutation handling
- **Query Definitions**: Type-safe query configurations
- **Mutation Support**: Data mutation with success/error handling
- **Automatic Caching**: React Query's built-in caching
- **Refetching**: Manual and automatic refetch triggers
- **Dependent Queries**: Queries that depend on other query results
- **Query Status**: Loading, error, success state tracking
- **Invalidation**: Automatic query invalidation on mutations
- **Polling**: Automatic periodic refetch support

**Example:**
```tsx
<PageGenerator
  id="data-page"
  queries={[
    {
      type: "query",
      key: "products",
      queryConfig: {
        queryKey: ["products"],
        queryFn: () => fetch("/api/products").then(r => r.json()),
        staleTime: 1000 * 60 * 5  // 5 minutes
      }
    },
    {
      type: "mutation",
      key: "addProduct",
      mutationConfig: {
        mutationFn: (newProduct) =>
          fetch("/api/products", { method: "POST", body: JSON.stringify(newProduct) })
      }
    }
  ]}
  contents={({ allQuery, allMutation }) => [
    {
      type: "custom",
      component: (
        <div>
          {allQuery.products.isLoading ? (
            <p>Loading...</p>
          ) : (
            <ul>
              {allQuery.products.data?.map(p => (
                <li key={p.id}>{p.name}</li>
              ))}
            </ul>
          )}
        </div>
      ),
      usedQueries: ["products"]
    }
  ]}
/>
```

### 6. Lazy Loading & Code Splitting

**What it does:**
- **Viewport Detection**: Uses Intersection Observer to detect when content enters viewport
- **On-Demand Loading**: Load components only when needed
- **Suspense Integration**: Native React 18+ Suspense support with fallbacks
- **Error Boundaries**: Handles failed lazy loads gracefully
- **Configurable Triggers**: Viewport, interaction, or conditional triggers
- **Custom Placeholders**: Custom UI while loading
- **Performance Tracking**: Metrics for lazy load timing
- **Preloading**: Optional preload hints for optimization

**Example:**
```tsx
<PageGenerator
  id="lazy-page"
  contents={[
    {
      type: "custom",
      component: <HeavyChart />,
      lazy: true,
      lazyTrigger: "viewport",
      lazyCondition: ({ formValues }) => formValues.showChart === true,
      lazyConfig: {
        threshold: 0.1,
        rootMargin: "100px",
        placeholder: {
          content: <div>Loading chart...</div>,
          style: { height: "400px", background: "#f0f0f0" }
        }
      }
    }
  ]}
/>
```

### 7. Extensibility & Customization

**What it does:**
- **Custom Components**: Override default containers and layouts
- **Lifecycle Callbacks**: Hooks into component lifecycle
  - `onMountComplete`: After component mounts and queries load
  - `onQuerySuccess`: When a query succeeds
  - `onQueryError`: When a query fails
  - `onFormSubmit`: When form is submitted
- **Platform Adapters**: Custom implementations per platform
- **Configuration Deep Merge**: Extend global pageConfig without overwrites
- **View Settings Overrides**: Control layout per page
- **Custom Metadata Evaluation**: Dynamic metadata from page state

**Example:**
```tsx
<PageGenerator
  id="extensible-page"
  lifecycleCallbacks={{
    onMountComplete: async (context) => {
      console.log("Page mounted with queries:", context.allQuery);
      // Track analytics, initialize third-party services, etc.
    },
    onQuerySuccess: async (queryKey, data) => {
      console.log(`Query ${queryKey} succeeded:`, data);
    },
    onQueryError: async (queryKey, error) => {
      console.error(`Query ${queryKey} failed:`, error);
    },
    onFormSubmit: async (formValues) => {
      console.log("Form submitted:", formValues);
    }
  }}
  viewSettings={{
    customLayoutComponent: MyCustomLayout,
    customPageContainer: MyCustomPageContainer,
    customHeaderComponent: MyCustomHeader
  }}
  contents={[...]}
/>
```

### 8. Authentication & Access Control

**What it does:**
- **Global Authentication State**: Track if user is logged in
- **Protected Pages**: Redirect to login if not authenticated
- **Role-Based Access**: Custom access control logic
- **Conditional Content**: Show/hide content based on auth state
- **Login Page Configuration**: Custom login page fallback
- **User Context**: Access to user data throughout page

**Example:**
```tsx
// Configure globally
pageConfig.isLogged = (user) => !!user?.token;
pageConfig.authPageProps = {
  id: "login",
  contents: [{ type: "custom", component: <LoginForm /> }]
};

// Use in page
<PageGenerator
  id="protected-page"
  enableAuthControl={true}
  contents={[...]}
/>
```

### 9. Internationalization (i18n)

**What it does:**
- **Built-in i18next Support**: Full internationalization support
- **Namespace Support**: Organize translations by feature
- **Dynamic Keys**: Translate content dynamically
- **Metadata Translation**: Translate SEO metadata
- **Multiple Language Support**: Switch languages at runtime
- **Fallback Languages**: Graceful degradation for missing translations

**Example:**
```tsx
<PageGenerator
  id="i18n-page"
  ns="myPage"  // i18n namespace
  meta={{
    title: t("meta.title"),  // Translated from i18n
    description: t("meta.description")
  }}
  contents={[...]}
/>
```

### 10. Container & Layout Management

**What it does:**
- **Hierarchical Layout**: Organize content in nested containers
- **Header/Footer Support**: Dedicated header and footer sections
- **Responsive Design**: Different layouts for mobile/tablet/desktop
- **Padding Control**: Fine-grained control over spacing
- **Custom Containers**: Use custom layout components
- **Platform-Specific Layouts**: Different layouts for web vs. React Native
- **Refresh Control**: Manual refresh buttons for content

**Example:**
```tsx
<PageGenerator
  id="layout-page"
  viewSettings={{
    header: { component: <Header /> },
    footer: { component: <Footer /> },
    withoutPadding: false,
    disableRefreshing: false
  }}
  contents={[
    {
      type: "container",
      items: [
        { type: "custom", component: <Section1 />, index: 0 },
        { type: "custom", component: <Section2 />, index: 1 }
      ]
    }
  ]}
/>
```

### 11. Deprecation Warnings & Migration Support

**What it does:**
- **v1.x Deprecation Notices**: Clear warnings about deprecated APIs
- **Migration Guidance**: Examples of how to upgrade patterns
- **One-Time Warnings**: Prevents console spam with feature tracking
- **Development-Only**: Warnings don't affect production
- **Detailed Messages**: Links to migration docs

**Deprecated Patterns Tracked:**
1. HelmetProvider wrapper (no longer needed)
2. Inline metadata via viewSettings
3. Manual React.lazy() wrapping
4. Custom form debouncing
5. Implicit query dependencies
6. Direct react-helmet-async imports

**Example (automatic warning):**
```tsx
// Using deprecated pattern triggers warning:
// ⚠️ [react-pages v2] Deprecation Warning
// Feature: react-helmet-async wrapper
// The <HelmetProvider> wrapper is no longer needed...
import { HelmetProvider } from 'react-helmet-async';
<HelmetProvider>
  <PageGenerator {...props} />
</HelmetProvider>
```

## 🔧 API Reference

### PageGenerator Props (Complete)

| Prop | Type | Description |
|------|------|-------------|
| `id` | `string` | Unique page identifier (required) |
| `contents` | `ContentItemsType<F, Q>` | Page content configuration |
| `queries` | `QueryPageConfigArray<F, Q>` | Query and mutation definitions |
| `form` | `FormPageProps<F>` | Form configuration and fields |
| `viewSettings` | `ViewSettings<F, Q>` | Layout, styling, and behavior settings |
| `meta` | `MetadataConfig<F, Q>` | SEO and metadata configuration |
| `ns` | `string` | i18n namespace for translations |
| `enableAuthControl` | `boolean` | Enable authentication checks |
| `onValuesChange` | `(values: Partial<F>) => void` | Form value change handler |
| `lifecycleCallbacks` | `LifecycleCallbacks<F, Q>` | Mount, query, and form callbacks |
| `platformOverrides` | `PlatformOverrides<F, Q>` | Platform-specific prop overrides |
| `customConfig` | `Record<string, any>` | Custom configuration object |

### Content Item Types

#### Custom Content
```tsx
{
  type: "custom",
  component: React.ComponentType | JSX.Element,
  index?: number,
  usedQueries?: string[],           // Track query dependencies
  usedFormValues?: string[],         // Track form value dependencies
  renderInHeader?: boolean,
  renderInFooter?: boolean,
  hidden?: boolean,
  key?: string,
  lazy?: boolean,                    // Enable lazy loading
  lazyTrigger?: "viewport" | "interaction" | "conditional",
  lazyCondition?: (context) => boolean
}
```

#### Container Content
```tsx
{
  type: "container",
  items: ContentItem[],
  component?: React.ComponentType,
  // ... same optional props as custom
}
```

### Metadata Configuration (Complete)

```tsx
{
  title?: string | ((props: any) => string),
  description?: string | ((props: any) => string),
  keywords?: string[] | ((props: any) => string[]),
  robots?: {
    noindex?: boolean,
    nofollow?: boolean,
    noarchive?: boolean,
    nosnippet?: boolean,
    maxImagePreview?: "none" | "standard" | "large",
    maxSnippet?: number
  },
  openGraph?: {
    title?: string | ((props: any) => string),
    description?: string | ((props: any) => string),
    image?: string | ((props: any) => string),
    url?: string | ((props: any) => string),
    type?: "website" | "article" | "product" | string
  },
  structuredData?: Record<string, any> | ((props: any) => Record<string, any>),
  aiHints?: {
    summary?: string,
    excludeFromIndexing?: boolean
  },
  customMeta?: Array<{ name: string; content: string }> | ((props: any) => Array<{ name: string; content: string }>),
  otherMetaTags?: MetaTag[]
}
```

### Form Configuration (Complete)

```tsx
{
  data: FormManagerConfig[],
  submit: Submit[],
  debounceDelay?: number,            // Debounce keystroke changes
  defaultValueQueryKey?: string[],
  defaultValueQueryMap?: (data) => DefaultValues,
  usedQueries?: string[],
  validation?: {
    mode?: "onChange" | "onBlur" | "onSubmit",
    reValidateMode?: "onChange" | "onBlur" | "onSubmit"
  }
}
```

### Query Configuration (Complete)

```tsx
// Query
{
  type: "query",
  key: string,
  queryConfig?: QueryProps | ((props: PageProps<F, Q>) => QueryProps)
}

// Mutation
{
  type: "mutation",
  key: string,
  mutationConfig?: MutationConfig | ((props: PageProps<F, Q>) => MutationConfig)
}
```

## 📚 Advanced Usage

### Dynamic Content Based on Query State

```tsx
<PageGenerator
  id="dynamic-page"
  queries={[...]}
  contents={({ allQuery }) => [
    {
      type: "custom",
      component: (
        <div>
          {allQuery.data.isLoading && <Spinner />}
          {allQuery.data.error && <Error message={allQuery.data.error.message} />}
          {allQuery.data.data && <DataDisplay data={allQuery.data.data} />}
        </div>
      ),
      index: 0
    }
  ]}
/>
```

### Form with Dynamic Content

```tsx
<PageGenerator
  id="form-with-dynamic-content"
  form={{
    data: [
      { name: "type", type: "select", options: ["A", "B", "C"] },
      { name: "details", type: "textarea" }
    ]
  }}
  contents={({ formValues }) => [
    {
      type: "custom",
      component: <TypeSpecificContent type={formValues.type} />,
      usedFormValues: ["type"],  // Only re-render when type changes
      index: 0
    }
  ]}
/>
```

### Multiple Dependent Queries

```tsx
<PageGenerator
  id="dependent-queries"
  queries={[
    {
      type: "query",
      key: "user",
      queryConfig: { ... }
    },
    {
      type: "query",
      key: "posts",
      queryConfig: ({ allQuery }) => ({
        queryKey: ["posts", allQuery.user?.data?.id],
        queryFn: () => fetch(`/api/users/${allQuery.user?.data?.id}/posts`).then(r => r.json()),
        enabled: !!allQuery.user?.data?.id  // Only run when user is loaded
      })
    }
  ]}
  contents={({ allQuery }) => [...]}
/>
```

## 🧪 TypeScript Support

Full generic type support for form data and queries:

```tsx
interface UserFormData {
  username: string;
  email: string;
  age: number;
}

type PageQueries = [
  QueryDefinition<'users', 'query', never, User[]>,
  QueryDefinition<'createUser', 'mutation', UserFormData, User>
];

// Full type safety
<PageGenerator<UserFormData, PageQueries>
  id="typed-page"
  form={{
    data: [
      // Fully typed - autocomplete for field names
      { name: "username", type: "text" },
      { name: "email", type: "email" }
    ]
  }}
  contents={({ formValues, allMutation }) => [
    {
      type: "custom",
      component: (
        <button onClick={() => allMutation.createUser.mutate(formValues)}>
          Create User
        </button>
      )
    }
  ]}
/>
```

## ⚡ Performance

### Bundle Size (All Tree-Shakeable)

| Entry Point | Size | Gzipped |
|------------|------|---------|
| Main | 145 KB | ~35 KB |
| /components | 132 KB | ~31 KB |
| /hooks | 76 KB | ~18 KB |
| /config | 12 KB | ~2 KB |
| /utils | 24 KB | ~5 KB |

### Performance Improvements

- **80% Keystroke Reduction**: Form debouncing eliminates unnecessary re-renders
- **90% Query-Based Re-render Reduction**: Dependency tracking only updates affected sections
- **React Compiler**: Automatic memoization at compile time
- **Lazy Loading**: Code splitting reduces initial bundle by deferring heavy components

### Optimization Tips

1. **Declare Dependencies**: Always specify `usedQueries` and `usedFormValues`
2. **Use Lazy Loading**: For components below the fold
3. **Selective Imports**: Import from `/hooks`, `/config`, `/utils` to reduce bundle
4. **Debounce Forms**: Use `debounceDelay` for search fields
5. **Memoize Custom Components**: Wrap with `React.memo`

## 🏗️ Global Configuration

```tsx
import { pageConfig } from '@gaddario98/react-pages';

// Set default metadata
pageConfig.meta = {
  title: "My App",
  description: "Default description"
};

// Set custom components
pageConfig.PageContainer = MyPageContainer;
pageConfig.BodyContainer = MyBodyContainer;

// Configure authentication
pageConfig.isLogged = (user) => !!user?.token;
pageConfig.authPageProps = { ... };

// Configure lazy loading globally
pageConfig.lazyLoading = {
  enabled: true,
  preloadOnHover: true,
  timeout: 30000
};
```

## 🐛 Troubleshooting

### Form Not Submitting
- Check `submit` array is configured
- Verify form validation passes
- Check `onSuccess` callback doesn't throw

### Queries Not Loading
- Verify `queryFn` is correct
- Check `enabled` flag (defaults to true)
- Verify network requests in DevTools

### Metadata Not Appearing
- Ensure `meta` is provided in PageGenerator
- Check MetadataManager component is rendered
- Verify browser head element exists (web only)

### Re-renders Too Frequent
- Add `usedQueries` and `usedFormValues` props
- Use `debounceDelay` on form fields
- Wrap custom components with `React.memo`

### TypeScript Errors
- Ensure generic types match form/query definitions
- Use `as const` for query key arrays
- Verify peer dependencies are installed

## 📄 License

MIT

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support

For support and questions:
- Check [MIGRATION.md](./MIGRATION.md) for v1.x upgrade help
- Review [examples](./specs/002-page-system-redesign/contracts/examples/)
- Open an issue on GitHub
