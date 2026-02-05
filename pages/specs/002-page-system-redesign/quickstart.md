**# Quickstart Guide: Universal Page System 2.0

**Version**: 2.0.0
**Last Updated**: 2025-10-30
**Target Audience**: Developers integrating react-base-pages into web or React Native applications

This guide will help you get started with the Universal Page System redesign in under 15 minutes.

---

## Table of Contents

1. [Installation](#1-installation)
2. [Basic Usage](#2-basic-usage)
3. [Configuration Walkthrough](#3-configuration-walkthrough)
4. [Performance Guidance](#4-performance-guidance)
5. [Metadata Setup](#5-metadata-setup)
6. [Lazy Loading Configuration](#6-lazy-loading-configuration)
7. [Platform Adapters](#7-platform-adapters-web-vs-react-native)
8. [Migration Guide (1.x → 2.x)](#8-migration-guide-1x--2x)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. Installation

### Prerequisites

- **Node.js**: 18+ (20+ recommended)
- **React**: 19.2.0+ (18+ for React Native)
- **TypeScript**: 5.8.3+

### Install Package

```bash
npm install @gaddario98/react-base-pages@2.0.0

# Peer dependencies (if not already installed)
npm install react-hook-form@^7.64.0
npm install @tanstack/react-query@^5.90.2
npm install react-i18next@^16.0.1

# Internal dependencies (if not already installed)
npm install @gaddario98/react-auth@^1.0.16
npm install @gaddario98/react-form@^1.0.21
npm install @gaddario98/react-queries@^1.0.21
npm install @gaddario98/utiles@^1.0.15
```

### Verify Installation

```bash
npm list @gaddario98/react-base-pages
# Should show: @gaddario98/react-base-pages@2.0.0
```

---

## 2. Basic Usage

### Step 1: Define Your Types

```tsx
// types.ts
import { QueryDefinition } from '@gaddario98/react-queries';

// Form fields
export interface UserProfileForm {
  username: string;
  email: string;
  bio: string;
}

// Queries and mutations
export type UserProfileQueries = [
  QueryDefinition<'getUser', 'query', void, { id: string; name: string; email: string }, any>,
  QueryDefinition<'updateUser', 'mutation', Partial<UserProfileForm>, { success: boolean }, any>
];
```

### Step 2: Configure Your Page

```tsx
// page-config.ts
import { PageProps } from '@gaddario98/react-base-pages';
import { UserProfileForm, UserProfileQueries } from './types';

export const userProfileConfig: PageProps<UserProfileForm, UserProfileQueries> = {
  id: 'user-profile-page',

  queries: [
    { type: 'query', key: 'getUser' },
    { type: 'mutation', key: 'updateUser', mutationConfig: {} }
  ],

  form: {
    fields: [
      { name: 'username', type: 'text', label: 'Username', required: true },
      { name: 'email', type: 'email', label: 'Email', required: true },
      { name: 'bio', type: 'textarea', label: 'Bio' }
    ],
    defaultValues: { username: '', email: '', bio: '' }
  },

  contents: (props) => {
    const user = props.allQuery.getUser?.data;

    return [
      {
        type: 'custom',
        component: <h1>Welcome, {user?.name || 'User'}!</h1>,
        usedQueries: ['getUser']
      }
    ];
  },

  meta: {
    title: 'User Profile',
    description: 'Manage your user profile'
  }
};
```

### Step 3: Render Your Page

```tsx
// UserProfilePage.tsx
import { PageGenerator } from '@gaddario98/react-base-pages';
import { userProfileConfig } from './page-config';

export function UserProfilePage() {
  return <PageGenerator {...userProfileConfig} />;
}
```

### Step 4: Add to Your App

```tsx
// App.tsx
import { UserProfilePage } from './pages/UserProfilePage';

function App() {
  return (
    <div>
      <UserProfilePage />
    </div>
  );
}
```

**That's it!** You now have a fully functional page with queries, forms, and dynamic content.

---

## 3. Configuration Walkthrough

### PageProps Structure

```tsx
interface PageProps<F extends FieldValues, Q extends QueriesArray> {
  // REQUIRED
  id: string;                          // Unique identifier

  // DATA MANAGEMENT
  queries?: QueryPageConfigArray<F, Q>; // Queries and mutations
  form?: FormPageProps<F, Q>;          // Form configuration

  // CONTENT & LAYOUT
  contents?: ContentItemsType<F, Q>;   // Page content items
  viewSettings?: ViewSettings | MappedFunction; // Layout config

  // NEW IN 2.0
  meta?: MetadataConfig<F, Q>;         // SEO metadata
  lazyLoading?: LazyLoadingConfig;     // Lazy loading config
  platformOverrides?: PlatformOverrides; // Platform-specific config

  // LIFECYCLE
  onValuesChange?: MappedFunction;     // Form change callback
  enableAuthControl?: boolean;         // Auth integration
}
```

### Query Configuration

```tsx
queries: [
  // Query (data fetching)
  {
    type: 'query',
    key: 'getUser',
    queryConfig: {
      enabled: true,              // Auto-fetch on mount
      staleTime: 5 * 60 * 1000,   // 5 minutes
      refetchOnWindowFocus: false
    }
  },

  // Mutation (data updates)
  {
    type: 'mutation',
    key: 'updateUser',
    mutationConfig: {
      onSuccess: (data) => {
        console.log('Success!', data);
        // Invalidate queries to refetch
        queryClient.invalidateQueries(['getUser']);
      },
      onError: (error) => {
        console.error('Failed:', error);
      }
    }
  }
]
```

### Form Configuration

```tsx
form: {
  fields: [
    {
      name: 'username',
      type: 'text',
      label: 'Username',
      required: true,
      validation: {
        minLength: { value: 3, message: 'Min 3 characters' }
      }
    },
    {
      name: 'email',
      type: 'email',
      label: 'Email',
      required: true
    }
  ],

  defaultValues: {
    username: '',
    email: ''
  },

  // Map query data to form defaults
  defaultValueQueryKey: ['getUser'],
  defaultValueQueryMap: (userData) => ({
    username: userData.name,
    email: userData.email
  })
}
```

### Content Configuration

**Static Content**:
```tsx
contents: [
  {
    type: 'custom',
    component: <h1>Static Header</h1>,
    renderInHeader: true
  },
  {
    type: 'custom',
    component: <div>Static Content</div>
  }
]
```

**Dynamic Content** (recommended):
```tsx
contents: (mappedProps) => {
  const user = mappedProps.allQuery.getUser?.data;

  return [
    {
      type: 'custom',
      component: <UserCard user={user} />,
      usedQueries: ['getUser'],  // Dependency tracking
      key: 'user-card'
    }
  ];
}
```

### View Settings

```tsx
viewSettings: {
  withoutPadding: false,        // Remove page padding
  header: {
    withoutPadding: true        // Remove header padding
  },
  footer: {
    withoutPadding: false
  },
  disableRefreshing: false,     // Disable pull-to-refresh (mobile)
  customPageContainer: MyCustomContainer, // Custom container component
  customLayoutComponent: MyCustomLayout   // Custom layout component
}
```

---

## 4. Performance Guidance

### Dependency Tracking (Critical!)

**❌ BAD** - No dependency tracking:
```tsx
{
  type: 'custom',
  component: (props) => <UserCard user={props.allQuery.getUser?.data} />
  // Missing usedQueries! Re-renders on EVERY change.
}
```

**✅ GOOD** - Explicit dependencies:
```tsx
{
  type: 'custom',
  component: (props) => <UserCard user={props.allQuery.getUser?.data} />,
  usedQueries: ['getUser'],  // Only re-renders when getUser updates
  key: 'user-card'
}
```

### Performance Best Practices

1. **Always declare `usedQueries`** for components using query data
2. **Always declare `usedFormValues`** for components using form values
3. **Use stable keys** for all content items
4. **Be precise** - only declare what you actually use

**Example** - Form with many fields:
```tsx
// User types in "firstName" field
{
  type: 'custom',
  component: (props) => <div>Hello, {props.formValues.firstName}!</div>,
  usedFormValues: ['firstName'], // ONLY firstName, not all fields
  key: 'greeting'
}

// This component WON'T re-render when user types in other fields!
```

### Measuring Performance

Use React DevTools Profiler:

```tsx
// 1. Install React DevTools browser extension
// 2. Open DevTools → Profiler tab
// 3. Start recording
// 4. Type in a form field
// 5. Stop recording
// 6. Check "Ranked" chart - how many components re-rendered?

// Target: ≤ 3 component re-renders per form field change
```

### Common Performance Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Page lags when typing | No `usedFormValues` | Add explicit dependencies |
| All content re-renders on query update | No `usedQueries` | Add explicit dependencies |
| Content flickers/re-renders constantly | Creating new objects in render | Pass primitive values or use memoization |
| Slow initial load | Loading all content eagerly | Use lazy loading (see section 6) |

---

## 5. Metadata Setup

### Basic Metadata

```tsx
meta: {
  title: 'My Page Title',
  description: 'A comprehensive guide to my page',
  documentLang: 'en',
  keywords: ['react', 'pages', 'performance']
}
```

### Dynamic Metadata (from query data)

```tsx
meta: {
  title: (props) => {
    const user = props.allQuery.getUser?.data;
    return user ? `${user.name}'s Profile` : 'User Profile';
  },

  description: (props) => {
    const user = props.allQuery.getUser?.data;
    return user?.bio || 'User profile page';
  }
}
```

### SEO & Social Media (Open Graph)

```tsx
meta: {
  title: 'Amazing Product - Buy Now',
  description: 'The best product you will ever buy',

  openGraph: {
    type: 'product',
    title: 'Amazing Product',
    description: 'The best product you will ever buy',
    image: 'https://example.com/product-image.jpg',
    url: 'https://example.com/products/amazing-product',
    siteName: 'My Store',
    locale: 'en_US'
  },

  robots: {
    noindex: false,           // Allow indexing
    nofollow: false,          // Follow links
    maxImagePreview: 'large'  // Large image previews in search
  }
}
```

### Structured Data (JSON-LD for Rich Results)

```tsx
meta: {
  structuredData: {
    type: 'Product',
    schema: (props) => {
      const product = props.allQuery.getProduct?.data;

      return {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product?.name,
        description: product?.description,
        image: product?.imageUrl,
        offers: {
          '@type': 'Offer',
          price: product?.price,
          priceCurrency: 'USD',
          availability: 'https://schema.org/InStock'
        },
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: product?.rating,
          reviewCount: product?.reviewCount
        }
      };
    }
  }
}
```

### AI Crawler Hints (NEW in 2.0)

```tsx
meta: {
  aiHints: {
    contentClassification: 'technical-documentation',
    modelHints: ['api-reference', 'code-examples', 'tutorial'],
    contextualInfo: 'Complete API documentation for user authentication with OAuth 2.0'
  }
}
```

### Platform-Specific Metadata

```tsx
platformOverrides: {
  web: {
    meta: {
      title: 'My App - Desktop Version',
      structuredData: { ... }  // Full schema
    }
  },
  native: {
    meta: {
      title: 'My App',         // Simplified for native
      // No structuredData (not applicable on native)
    }
  }
}
```

---

## 6. Lazy Loading Configuration

### Global Lazy Loading Config

```tsx
lazyLoading: {
  enabled: true,
  suspenseFallback: <div>Loading component...</div>,
  intersectionThreshold: 0.1,      // Load when 10% visible
  intersectionRootMargin: '100px'  // Preload 100px before visible
}
```

### Item-Level Lazy Loading

**Viewport Trigger** (loads when scrolling into view):
```tsx
{
  type: 'custom',
  component: () => {
    const HeavyChart = React.lazy(() => import('./HeavyChart'));
    return <HeavyChart />;
  },
  lazy: true,
  lazyTrigger: 'viewport',  // Load when entering viewport
  key: 'heavy-chart'
}
```

**Conditional Trigger** (loads when condition becomes true):
```tsx
{
  type: 'custom',
  component: () => {
    const AdminPanel = React.lazy(() => import('./AdminPanel'));
    return <AdminPanel />;
  },
  lazy: true,
  lazyTrigger: 'conditional',
  lazyCondition: (props) => props.formValues.showAdmin === true,
  usedFormValues: ['showAdmin'],
  key: 'admin-panel'
}
```

### When to Use Lazy Loading

**✅ USE lazy loading for**:
- Below-the-fold content (not visible initially)
- Conditionally shown content (tabs, modals, accordions)
- Heavy components (charts, tables, editors)
- Optional features (admin panels, advanced settings)

**❌ DON'T use lazy loading for**:
- Above-the-fold content (visible immediately)
- Header/footer content
- Critical content for SEO
- Small components (< 5 KB)

### Bundle Size Impact

**Before lazy loading**:
- Initial bundle: 120 KB gzipped
- User downloads everything upfront

**After lazy loading**:
- Initial bundle: 40 KB gzipped (66% smaller!)
- Heavy components: Load on demand
- Result: 2-3x faster initial load

---

## 7. Platform Adapters (Web vs. React Native)

### Auto-Detection (Default)

The library automatically detects your platform:

```tsx
// No configuration needed!
<PageGenerator {...config} />

// Web: Uses webAdapter (document.head, IntersectionObserver)
// React Native: Uses nativeAdapter (graceful no-ops)
```

### Manual Platform Override

```tsx
import { PlatformAdapterProvider, webAdapter, nativeAdapter } from '@gaddario98/react-base-pages/config';

// Force web adapter
<PlatformAdapterProvider adapter={webAdapter}>
  <PageGenerator {...config} />
</PlatformAdapterProvider>

// Force native adapter
<PlatformAdapterProvider adapter={nativeAdapter}>
  <PageGenerator {...config} />
</PlatformAdapterProvider>
```

### Custom Platform Adapter

```tsx
import { PlatformAdapter } from '@gaddario98/react-base-pages/contracts/PlatformAdapter';

const myCustomAdapter: PlatformAdapter = {
  name: 'web',

  injectMetadata(metadata) {
    // Custom metadata injection logic
    console.log('Injecting metadata:', metadata);
  },

  renderContainer(children, settings) {
    return <div className="custom-container">{children}</div>;
  },

  renderScrollView(children, settings) {
    return <div className="custom-scroll">{children}</div>;
  },

  supportsFeature(feature) {
    return feature !== 'intersectionObserver';
  }
};

// Use custom adapter
<PlatformAdapterProvider adapter={myCustomAdapter}>
  <PageGenerator {...config} />
</PlatformAdapterProvider>
```

### Platform-Specific Configuration

```tsx
platformOverrides: {
  web: {
    viewSettings: { withoutPadding: false },
    meta: { title: 'Desktop Version' }
  },
  native: {
    viewSettings: { disableRefreshing: false },
    meta: { title: 'Mobile Version' }
  }
}
```

### Feature Detection

```tsx
import { usePlatformAdapter } from '@gaddario98/react-base-pages/config';

function MyComponent() {
  const adapter = usePlatformAdapter();

  if (adapter.supportsFeature('metadata')) {
    // Web-specific code
  } else {
    // React Native fallback
  }
}
```

---

## 8. Migration Guide (1.x → 2.x)

### Breaking Changes

#### 1. `PageMetadataProps` → `MetadataConfig`

**Before (1.x)**:
```tsx
import { PageMetadataProps } from '@gaddario98/react-base-pages';

const meta: PageMetadataProps = {
  title: 'My Page',
  description: 'Page description',
  disableIndexing: true,
  otherMetaTags: [<meta key="..." />]
};
```

**After (2.x)**:
```tsx
import { MetadataConfig } from '@gaddario98/react-base-pages';

const meta: MetadataConfig = {
  title: 'My Page',
  description: 'Page description',
  robots: { noindex: true },  // NEW
  customMeta: [               // NEW
    { name: '...', content: '...' }
  ]
};
```

**Migration**: Use import alias for backward compatibility:
```tsx
import { MetadataConfig as PageMetadataProps } from '@gaddario98/react-base-pages';
```

### New Features (Non-Breaking)

All existing PageProps fields work as before. New optional fields in 2.x:

```tsx
// 1.x (still works in 2.x)
const config: PageProps = {
  id: 'my-page',
  contents: [...],
  queries: [...],
  form: {...}
};

// 2.x (with new features)
const config: PageProps = {
  id: 'my-page',
  contents: [...],
  queries: [...],
  form: {...},

  // NEW: Metadata for SEO
  meta: {
    title: 'My Page',
    openGraph: {...},
    structuredData: {...}
  },

  // NEW: Lazy loading
  lazyLoading: {
    enabled: true
  },

  // NEW: Platform overrides
  platformOverrides: {
    web: {...},
    native: {...}
  }
};
```

### Recommended Upgrades

1. **Add metadata** for improved SEO:
   ```tsx
   meta: {
     title: 'My Page',
     description: 'Page description',
     openGraph: { ... }
   }
   ```

2. **Add dependency tracking** for better performance:
   ```tsx
   contents: [
     {
       type: 'custom',
       component: <UserCard />,
       usedQueries: ['getUser'],  // ADD THIS
       key: 'user-card'           // ADD THIS
     }
   ]
   ```

3. **Use lazy loading** for heavy components:
   ```tsx
   {
     type: 'custom',
     component: () => React.lazy(() => import('./HeavyComponent')),
     lazy: true,                  // ADD THIS
     lazyTrigger: 'viewport'      // ADD THIS
   }
   ```

### Migration Checklist

- [ ] Update imports: `PageMetadataProps` → `MetadataConfig` (or use alias)
- [ ] Replace `disableIndexing` → `robots.noindex`
- [ ] Replace `otherMetaTags` → `customMeta`
- [ ] Add `usedQueries` and `usedFormValues` to all content items
- [ ] Add stable `key` props to all content items
- [ ] Consider adding `meta` configuration for SEO
- [ ] Consider adding lazy loading for heavy components
- [ ] Test on both web and React Native (if applicable)

---

## 9. Troubleshooting

### Page doesn't render / blank screen

**Possible causes**:
1. Missing required prop: `id`
2. Syntax error in `contents` function
3. Query not enabled

**Solution**:
```tsx
// 1. Always provide id
id: 'my-page',

// 2. Check contents function for errors
contents: (props) => {
  console.log('Props:', props); // Debug
  return [{ type: 'custom', component: <div>Test</div> }];
},

// 3. Ensure query is enabled
queries: [
  { type: 'query', key: 'getData', queryConfig: { enabled: true } }
]
```

### Content re-renders too often / performance issues

**Cause**: Missing dependency tracking

**Solution**: Add `usedQueries` and `usedFormValues`:
```tsx
{
  type: 'custom',
  component: (props) => <UserCard user={props.allQuery.getUser?.data} />,
  usedQueries: ['getUser'],  // ADD THIS
  usedFormValues: [],        // ADD THIS (empty if none used)
  key: 'user-card'
}
```

### Metadata not showing in document.head

**Possible causes**:
1. Running on React Native (no document.head)
2. Metadata not resolving (dynamic metadata with missing query data)
3. Platform adapter doesn't support metadata

**Solution**:
```tsx
// 1. Check platform
const adapter = usePlatformAdapter();
if (adapter.supportsFeature('metadata')) {
  // Web: metadata should work
} else {
  // React Native: metadata is no-op
}

// 2. Add fallback for dynamic metadata
meta: {
  title: (props) => props.allQuery.getUser?.data?.name || 'Default Title',
  //                                                      ^^^^^^^^^^^^^^^^ Fallback
}

// 3. Use web adapter explicitly
<PlatformAdapterProvider adapter={webAdapter}>
  <PageGenerator {...config} />
</PlatformAdapterProvider>
```

### Lazy loading not working

**Possible causes**:
1. `lazy: true` not set
2. IntersectionObserver not available (React Native)
3. Content hidden by CSS

**Solution**:
```tsx
// 1. Enable lazy loading
lazyLoading: { enabled: true },

// 2. Use conditional trigger on React Native
{
  lazy: true,
  lazyTrigger: 'conditional',  // Not 'viewport' (no IntersectionObserver)
  lazyCondition: (props) => props.formValues.show === true
}

// 3. Check CSS visibility
// Ensure content is actually in viewport and visible
```

### TypeScript errors with generics

**Cause**: Generic types not inferred correctly

**Solution**: Explicitly provide type parameters:
```tsx
import { PageProps } from '@gaddario98/react-base-pages';

// Explicit types
const config: PageProps<MyFormFields, MyQueries> = {
  //                     ^^^^^^^^^^^^^ Form type
  //                                  ^^^^^^^^^^ Queries type
  id: 'my-page',
  ...
};
```

### Form default values not populating from query

**Cause**: Query not loaded when form initializes

**Solution**:
```tsx
form: {
  fields: [...],
  defaultValues: { username: '', email: '' },
  defaultValueQueryKey: ['getUser'],  // Query to watch
  defaultValueQueryMap: (userData) => ({
    username: userData.name,
    email: userData.email
  })
}

// Ensure query is enabled
queries: [
  {
    type: 'query',
    key: 'getUser',
    queryConfig: { enabled: true }  // Must be true!
  }
]
```

### Mutation not triggering

**Possible causes**:
1. Mutation not called correctly
2. Mutation not defined in queries
3. MutationConfig missing

**Solution**:
```tsx
// 1. Define mutation in queries
queries: [
  {
    type: 'mutation',
    key: 'updateUser',
    mutationConfig: {
      onSuccess: () => console.log('Success!')
    }
  }
],

// 2. Call mutation correctly
contents: [
  {
    type: 'custom',
    component: (props) => {
      const handleClick = () => {
        props.allMutation.updateUser.mutate({ data: ... });
        //                           ^^^^^^ Use .mutate()
      };

      return <button onClick={handleClick}>Save</button>;
    }
  }
]
```

### Platform adapter not applying

**Cause**: PlatformAdapterProvider not wrapping PageGenerator

**Solution**:
```tsx
import { PlatformAdapterProvider } from '@gaddario98/react-base-pages/config';
import { myAdapter } from './my-adapter';

// Wrap PageGenerator with provider
<PlatformAdapterProvider adapter={myAdapter}>
  <PageGenerator {...config} />
</PlatformAdapterProvider>
```

---

## Quick Reference

### Minimal Working Example

```tsx
import { PageProps, PageGenerator } from '@gaddario98/react-base-pages';

const config: PageProps = {
  id: 'my-page',
  contents: [
    { type: 'custom', component: <div>Hello World!</div> }
  ]
};

export function MyPage() {
  return <PageGenerator {...config} />;
}
```

### Complete Example

```tsx
import { PageProps, PageGenerator } from '@gaddario98/react-base-pages';

const config: PageProps<MyForm, MyQueries> = {
  id: 'complete-page',
  ns: 'myNamespace',

  queries: [
    { type: 'query', key: 'getData', queryConfig: { enabled: true } },
    { type: 'mutation', key: 'saveData', mutationConfig: {} }
  ],

  form: {
    fields: [
      { name: 'field1', type: 'text', label: 'Field 1' }
    ],
    defaultValues: { field1: '' }
  },

  contents: (props) => [
    {
      type: 'custom',
      component: <div>{props.allQuery.getData?.data}</div>,
      usedQueries: ['getData'],
      key: 'data-display'
    }
  ],

  viewSettings: { withoutPadding: false },

  meta: {
    title: 'My Page',
    description: 'Page description'
  },

  lazyLoading: { enabled: true },

  onValuesChange: (props) => {
    console.log('Form changed:', props.formValues);
  }
};

export function CompletePage() {
  return <PageGenerator {...config} />;
}
```

---

## Next Steps

- Review [examples](./contracts/examples/) for more patterns
- Read [data-model.md](./data-model.md) for complete type reference
- Check [plan.md](./plan.md) for architecture details
- Explore [research.md](./research.md) for technical decisions

**Need help?** Check the troubleshooting section or file an issue on GitHub.

---

**Version**: 2.0.0 | **Last Updated**: 2025-10-30
