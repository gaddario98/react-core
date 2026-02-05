# API Contract: Custom Metadata Configuration

**Feature**: Performance Optimization
**Date**: 2025-10-29
**Phase**: 1 (Design)

## Overview

This document specifies the API contract for custom metadata configuration, which replaces react-helmet-async. The new system reduces bundle size by ~10 KB gzipped while maintaining full metadata functionality for both web and React Native platforms.

---

## API: setMetadata

**Purpose**: Applies page metadata (title, description, meta tags) in a platform-agnostic way.

**Signature**:

```typescript
function setMetadata(config: MetadataConfig): void;
```

### Parameters

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
  author?: string;
  viewport?: string;
  themeColor?: string;
  customMeta?: MetaTag[];
}

interface MetaTag {
  name?: string; // For <meta name="..." content="..." />
  property?: string; // For <meta property="og:..." content="..." />
  httpEquiv?: string; // For <meta http-equiv="..." content="..." />
  content: string;
  id?: string; // Unique identifier for updating existing tags
}
```

### Behavior

| Platform | Implementation |
|----------|----------------|
| **Web (Browser)** | Updates `document.title`, creates/updates `<meta>` tags in `<head>` |
| **React Native** | No-op or stores in context for native navigation integration |
| **SSR (Server)** | Collects metadata for server-rendered HTML `<head>` |

### Platform Detection

```typescript
// Internal implementation
const isWeb = typeof document !== 'undefined';
const isReactNative = typeof navigator !== 'undefined' && navigator.product === 'ReactNative';
```

### Web Implementation

```typescript
export const setMetadata = (config: MetadataConfig): void => {
  if (typeof document === 'undefined') return; // SSR or React Native

  // Set document title
  if (config.title) {
    document.title = config.title;
  }

  // Set/update meta tags
  const updateOrCreateMeta = (selector: string, content: string, attributes: Record<string, string> = {}) => {
    let element = document.querySelector(selector) as HTMLMetaElement;
    if (!element) {
      element = document.createElement('meta');
      Object.entries(attributes).forEach(([key, value]) => {
        element.setAttribute(key, value);
      });
      document.head.appendChild(element);
    }
    element.setAttribute('content', content);
  };

  if (config.description) {
    updateOrCreateMeta('meta[name="description"]', config.description, { name: 'description' });
  }

  if (config.keywords) {
    updateOrCreateMeta('meta[name="keywords"]', config.keywords.join(', '), { name: 'keywords' });
  }

  if (config.ogImage) {
    updateOrCreateMeta('meta[property="og:image"]', config.ogImage, { property: 'og:image' });
  }

  if (config.ogTitle) {
    updateOrCreateMeta('meta[property="og:title"]', config.ogTitle, { property: 'og:title' });
  }

  if (config.ogDescription) {
    updateOrCreateMeta('meta[property="og:description"]', config.ogDescription, { property: 'og:description' });
  }

  if (config.canonical) {
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
    }
    link.href = config.canonical;
  }

  if (config.robots) {
    updateOrCreateMeta('meta[name="robots"]', config.robots, { name: 'robots' });
  }

  if (config.lang) {
    document.documentElement.lang = config.lang;
  }

  // Custom meta tags
  config.customMeta?.forEach((tag) => {
    const selector = tag.id ? `meta[id="${tag.id}"]` :
                     tag.name ? `meta[name="${tag.name}"]` :
                     tag.property ? `meta[property="${tag.property}"]` :
                     `meta[http-equiv="${tag.httpEquiv}"]`;

    const attributes = tag.name ? { name: tag.name } :
                       tag.property ? { property: tag.property } :
                       tag.httpEquiv ? { 'http-equiv': tag.httpEquiv } : {};

    if (tag.id) attributes.id = tag.id;

    updateOrCreateMeta(selector, tag.content, attributes);
  });
};
```

### React Native Implementation

```typescript
// config/metadata.native.ts (platform-specific file)
import { NativeModules } from 'react-native';

export const setMetadata = (config: MetadataConfig): void => {
  // Option 1: Store in React Context for app-wide access
  // Option 2: Call native module to set navigation bar title (iOS/Android)
  // Option 3: No-op if metadata not relevant to native apps

  // Example: Update native navigation title
  if (config.title && NativeModules.NavigationModule) {
    NativeModules.NavigationModule.setTitle(config.title);
  }

  // Store in memory for potential later use
  currentMetadata = config;
};

let currentMetadata: MetadataConfig = {};
export const getMetadata = (): MetadataConfig => currentMetadata;
```

---

## API: getMetadata

**Purpose**: Retrieves current metadata configuration (for SSR or debugging).

**Signature**:

```typescript
function getMetadata(): MetadataConfig;
```

### Return Value

Returns the currently active metadata configuration. Useful for:
- Server-side rendering (collecting metadata for HTML `<head>`)
- Testing (verifying metadata was applied)
- Debugging (inspecting current page metadata)

### Example

```typescript
const currentMeta = getMetadata();
console.log(currentMeta.title); // "My Page Title"
```

---

## API: resetMetadata

**Purpose**: Clears all metadata, resetting to defaults.

**Signature**:

```typescript
function resetMetadata(): void;
```

### Behavior

- Removes all dynamically-added `<meta>` tags (web)
- Clears stored metadata (React Native)
- Does NOT remove hardcoded `<meta>` tags from initial HTML

### Example

```typescript
resetMetadata(); // Clear all page metadata
setMetadata(defaultMetadata); // Apply global defaults
```

---

## Integration with pageConfig

The metadata system integrates with the existing `pageConfig` singleton:

```typescript
// config/index.ts
export const pageConfig = {
  // ... existing config fields
  PageContainer: undefined as React.ComponentType<any> | undefined,
  BodyContainer: undefined as React.ComponentType<any> | undefined,

  // NEW: Metadata configuration
  defaultMetadata: {} as MetadataConfig,
  setMetadata,
  getMetadata,
  resetMetadata,
};
```

### Usage in PageGenerator

```typescript
// components/PageGenerator.tsx (internal usage)
import { pageConfig } from '../config';

const PageGenerator = ({ meta, ...props }) => {
  useEffect(() => {
    // Merge default metadata with page-specific metadata
    const fullMetadata = {
      ...pageConfig.defaultMetadata,
      ...meta,
    };

    pageConfig.setMetadata(fullMetadata);

    // Cleanup: reset to defaults on unmount
    return () => {
      pageConfig.setMetadata(pageConfig.defaultMetadata);
    };
  }, [meta]);

  return <div>{/* page content */}</div>;
};
```

---

## Migration from react-helmet-async

### Before (react-helmet-async)

```typescript
import { Helmet } from 'react-helmet-async';

const MyPage = () => (
  <>
    <Helmet>
      <title>My Page Title</title>
      <meta name="description" content="Page description" />
      <meta property="og:image" content="https://example.com/image.jpg" />
      <link rel="canonical" href="https://example.com/my-page" />
    </Helmet>
    <div>Page content</div>
  </>
);
```

### After (custom metadata)

```typescript
import { PageGenerator } from '@gaddario98/react-pages';

const MyPage = () => (
  <PageGenerator
    id="my-page"
    meta={{
      title: 'My Page Title',
      description: 'Page description',
      ogImage: 'https://example.com/image.jpg',
      canonical: 'https://example.com/my-page',
    }}
    contents={[/* page contents */]}
  />
);
```

### Migration Benefits

| Aspect | react-helmet-async | Custom Metadata |
|--------|---------------------|-----------------|
| **Bundle Size** | ~10 KB gzipped | ~1 KB (native JS) |
| **API** | JSX components | Configuration object |
| **React Native** | ❌ Not supported | ✅ Platform-agnostic |
| **SSR** | ✅ Supported | ✅ Supported (via getMetadata) |
| **TypeScript** | Partial types | Strict types with MetadataConfig |

---

## Validation Rules

### URL Validation

```typescript
const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// URLs must be absolute
if (config.ogImage && !isValidUrl(config.ogImage)) {
  console.warn('[React Pages] ogImage must be an absolute URL');
}

if (config.canonical && !isValidUrl(config.canonical)) {
  console.warn('[React Pages] canonical must be an absolute URL');
}
```

### Robots Directive Validation

```typescript
const validRobots = ['index, follow', 'noindex, nofollow', 'index, nofollow', 'noindex, follow'];

if (config.robots && !validRobots.includes(config.robots)) {
  console.warn(`[React Pages] Invalid robots directive: ${config.robots}`);
}
```

### Language Code Validation

```typescript
// ISO 639-1 two-letter codes
const validLangPattern = /^[a-z]{2}(-[A-Z]{2})?$/;

if (config.lang && !validLangPattern.test(config.lang)) {
  console.warn(`[React Pages] Invalid language code: ${config.lang}`);
}
```

---

## Performance Characteristics

| Operation | Time Complexity | Notes |
|-----------|-----------------|-------|
| `setMetadata(config)` | O(n) where n = number of meta tags | DOM operations are synchronous |
| `getMetadata()` | O(1) | Returns cached config object |
| `resetMetadata()` | O(n) where n = number of meta tags | Removes dynamically-added tags |

### Optimization Notes

- **Deduplication**: Existing `<meta>` tags are updated, not duplicated
- **Batch updates**: Multiple calls to `setMetadata` within same render are batched via useEffect
- **Platform-specific**: Web-only code tree-shaken from React Native builds
- **Zero runtime overhead in production**: No React component overhead (unlike react-helmet-async)

---

## TypeScript Types Export

```typescript
// types.ts (additions)
export interface MetadataConfig {
  title?: string;
  description?: string;
  keywords?: string[];
  ogImage?: string;
  ogTitle?: string;
  ogDescription?: string;
  canonical?: string;
  robots?: string;
  lang?: string;
  author?: string;
  viewport?: string;
  themeColor?: string;
  customMeta?: MetaTag[];
}

export interface MetaTag {
  name?: string;
  property?: string;
  httpEquiv?: string;
  content: string;
  id?: string;
}

export interface MetadataProvider {
  setMetadata: (config: MetadataConfig) => void;
  getMetadata: () => MetadataConfig;
  resetMetadata: () => void;
}
```

---

## Testing Contract

### Unit Tests

```typescript
describe('setMetadata', () => {
  it('should set document.title on web', () => {
    setMetadata({ title: 'Test Title' });
    expect(document.title).toBe('Test Title');
  });

  it('should create meta description tag', () => {
    setMetadata({ description: 'Test description' });
    const meta = document.querySelector('meta[name="description"]');
    expect(meta?.getAttribute('content')).toBe('Test description');
  });

  it('should update existing meta tags instead of duplicating', () => {
    setMetadata({ description: 'First' });
    setMetadata({ description: 'Second' });
    const metaTags = document.querySelectorAll('meta[name="description"]');
    expect(metaTags.length).toBe(1);
    expect(metaTags[0].getAttribute('content')).toBe('Second');
  });

  it('should be no-op on React Native', () => {
    // Mock React Native environment
    global.navigator = { product: 'ReactNative' } as any;
    delete (global as any).document;

    setMetadata({ title: 'Test' }); // Should not throw
  });
});
```

---

## Backward Compatibility

**Breaking Change**: Removing react-helmet-async is a **MINOR** version bump (not MAJOR) because:
1. react-helmet-async was a **peer dependency** (peerDependenciesMeta optional: true)
2. Not all consumers use metadata features
3. Migration path is straightforward (config object instead of JSX)

### Migration Guide

Included in release notes:
```markdown
## Migrating from react-helmet-async

1. Remove react-helmet-async from your dependencies:
   `npm uninstall react-helmet-async`

2. Replace <Helmet> JSX with PageGenerator meta prop:
   Before: <Helmet><title>...</title></Helmet>
   After: <PageGenerator meta={{ title: '...' }} />

3. For advanced use cases, use pageConfig.setMetadata() directly
```

---

## Next Steps

- Implement setMetadata in config/metadata.ts
- Add platform-specific implementation for React Native
- Write unit tests for metadata operations
- Update PageGenerator to use new metadata system
- Document migration path in README
