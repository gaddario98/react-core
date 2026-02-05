/**
 * Example: Custom Platform Adapter
 *
 * Demonstrates how to create a custom platform adapter for specialized
 * rendering behavior or SSR (Server-Side Rendering) integration.
 *
 * @example Use case: Next.js integration with custom metadata handling
 */

import { ReactNode } from "react";
import { PlatformAdapter, PlatformFeature } from "../PlatformAdapter";
import { MetadataConfig } from "../Metadata";
import { ViewSettings } from "../PageProps";

/**
 * Custom Adapter: Next.js SSR Integration
 *
 * This adapter captures metadata for Next.js's `generateMetadata` function
 * instead of directly manipulating document.head.
 */

// Global state to capture metadata (SSR-safe)
let capturedMetadata: MetadataConfig<any, any> | null = null;

export const nextJsAdapter: PlatformAdapter = {
  name: "web",

  /**
   * Capture metadata instead of injecting into DOM
   *
   * In SSR, we can't access document.head, so we capture metadata
   * and provide it to Next.js's generateMetadata function.
   */
  injectMetadata(metadata: MetadataConfig<any, any>): void {
    // Store metadata for getServerMetadata()
    capturedMetadata = metadata;

    // On client side, also inject into DOM
    if (typeof document !== "undefined") {
      // Title
      if (metadata.title) {
        document.title = metadata.title;
      }

      // Description
      if (metadata.description) {
        updateOrCreateMeta("name", "description", metadata.description);
      }

      // Open Graph
      if (metadata.openGraph) {
        if (metadata.openGraph.title) {
          updateOrCreateMeta("property", "og:title", metadata.openGraph.title);
        }
        if (metadata.openGraph.image) {
          updateOrCreateMeta("property", "og:image", metadata.openGraph.image);
        }
      }

      // Add more metadata injection as needed...
    }
  },

  /**
   * Render container with Next.js-specific optimizations
   */
  renderContainer(children: ReactNode, settings: ViewSettings): ReactNode {
    const Container = settings.customPageContainer || "div";

    return (
      <Container
        className="page-container"
        style={{
          padding: settings.withoutPadding ? 0 : "16px",
        }}
      >
        {children}
      </Container>
    );
  },

  /**
   * Render scroll view
   */
  renderScrollView(children: ReactNode, settings: ViewSettings): ReactNode {
    return (
      <div
        style={{
          overflowY: "auto",
          height: "100%",
          padding: settings.withoutPadding ? 0 : "16px",
        }}
      >
        {children}
      </div>
    );
  },

  /**
   * Feature support
   */
  supportsFeature(feature: PlatformFeature): boolean {
    switch (feature) {
      case "metadata":
      case "documentHead":
        return typeof document !== "undefined"; // Client-side only
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

/**
 * Helper function to get captured metadata (for SSR)
 */
export function getServerMetadata(): MetadataConfig<any, any> | null {
  return capturedMetadata;
}

/**
 * Helper function to update or create meta tags
 */
function updateOrCreateMeta(
  attr: "name" | "property",
  key: string,
  content: string
): void {
  if (typeof document === "undefined") return;

  const selector = `meta[${attr}="${key}"]`;
  let meta = document.querySelector(selector) as HTMLMetaElement;

  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute(attr, key);
    document.head.appendChild(meta);
  }

  meta.setAttribute("content", content);
}

/**
 * Usage in Next.js App Router:
 *
 * @example app/products/[id]/page.tsx
 * ```tsx
 * import { PageGenerator, PlatformAdapterProvider } from '@gaddario98/react-pages';
 * import { nextJsAdapter, getServerMetadata } from './custom-adapter';
 * import { productPageConfig } from './product-page-config';
 * import type { Metadata } from 'next';
 *
 * // Server Component: Generate metadata
 * export async function generateMetadata({ params }): Promise<Metadata> {
 *   // Fetch product data
 *   const product = await fetchProduct(params.id);
 *
 *   // Return Next.js metadata
 *   return {
 *     title: `${product.name} - Our Store`,
 *     description: product.description,
 *     openGraph: {
 *       title: product.name,
 *       description: product.description,
 *       images: [product.imageUrl],
 *     },
 *   };
 * }
 *
 * // Server Component: Render page
 * export default async function ProductPage({ params }) {
 *   return (
 *     <PlatformAdapterProvider adapter={nextJsAdapter}>
 *       <PageGenerator {...productPageConfig} />
 *     </PlatformAdapterProvider>
 *   );
 * }
 * ```
 */

/**
 * Custom Adapter: Analytics Integration
 *
 * This adapter injects analytics tracking alongside metadata.
 */
export const analyticsAdapter: PlatformAdapter = {
  name: "web",

  injectMetadata(metadata: MetadataConfig<any, any>): void {
    // Standard metadata injection
    if (typeof document !== "undefined") {
      if (metadata.title) {
        document.title = metadata.title;

        // Track page view with title
        if (typeof window !== "undefined" && (window as any).gtag) {
          (window as any).gtag("event", "page_view", {
            page_title: metadata.title,
            page_location: window.location.href,
          });
        }
      }

      if (metadata.description) {
        updateOrCreateMeta("name", "description", metadata.description);
      }

      // Custom analytics meta tags
      if (metadata.customMeta) {
        const analyticsTag = metadata.customMeta.find(
          (tag) => tag.name === "analytics-category"
        );
        if (analyticsTag) {
          // Track category
          if (typeof window !== "undefined" && (window as any).gtag) {
            (window as any).gtag("event", "view_category", {
              category: analyticsTag.content,
            });
          }
        }
      }
    }
  },

  renderContainer(children: ReactNode, settings: ViewSettings): ReactNode {
    return (
      <div
        className="page-container"
        data-analytics-page="true"
        style={{ padding: settings.withoutPadding ? 0 : "16px" }}
      >
        {children}
      </div>
    );
  },

  renderScrollView(children: ReactNode, settings: ViewSettings): ReactNode {
    return (
      <div
        style={{
          overflowY: "auto",
          height: "100%",
          padding: settings.withoutPadding ? 0 : "16px",
        }}
      >
        {children}
      </div>
    );
  },

  supportsFeature(feature: PlatformFeature): boolean {
    return feature !== "intersectionObserver" || typeof IntersectionObserver !== "undefined";
  },
};

/**
 * Custom Adapter: Mobile Web (PWA)
 *
 * Specialized adapter for Progressive Web Apps with mobile-specific features.
 */
export const pwaAdapter: PlatformAdapter = {
  name: "web",

  injectMetadata(metadata: MetadataConfig<any, any>): void {
    if (typeof document === "undefined") return;

    // Standard metadata
    if (metadata.title) {
      document.title = metadata.title;
    }

    // PWA-specific meta tags
    updateOrCreateMeta("name", "mobile-web-app-capable", "yes");
    updateOrCreateMeta("name", "apple-mobile-web-app-capable", "yes");
    updateOrCreateMeta("name", "apple-mobile-web-app-status-bar-style", "black-translucent");

    // Theme color from metadata
    if (metadata.customMeta) {
      const themeTag = metadata.customMeta.find((tag) => tag.name === "theme-color");
      if (themeTag) {
        updateOrCreateMeta("name", "theme-color", themeTag.content);
      }
    }

    // Viewport settings for mobile
    updateOrCreateMeta(
      "name",
      "viewport",
      "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
    );
  },

  renderContainer(children: ReactNode, settings: ViewSettings): ReactNode {
    return (
      <div
        className="pwa-container"
        style={{
          padding: settings.withoutPadding ? 0 : "16px",
          minHeight: "100vh",
          touchAction: "manipulation", // Disable double-tap zoom
        }}
      >
        {children}
      </div>
    );
  },

  renderScrollView(children: ReactNode, settings: ViewSettings): ReactNode {
    return (
      <div
        style={{
          overflowY: "auto",
          height: "100%",
          padding: settings.withoutPadding ? 0 : "16px",
          WebkitOverflowScrolling: "touch", // Smooth scrolling on iOS
        }}
      >
        {children}
      </div>
    );
  },

  supportsFeature(feature: PlatformFeature): boolean {
    return true; // PWA supports all features
  },
};

/**
 * Usage Examples:
 */

/**
 * 1. Next.js App Router with SSR
 */
// import { PlatformAdapterProvider } from '@gaddario98/react-pages/config';
// import { nextJsAdapter } from './custom-adapter';
//
// <PlatformAdapterProvider adapter={nextJsAdapter}>
//   <PageGenerator {...config} />
// </PlatformAdapterProvider>

/**
 * 2. Analytics Integration
 */
// import { analyticsAdapter } from './custom-adapter';
//
// <PlatformAdapterProvider adapter={analyticsAdapter}>
//   <PageGenerator {...config} />
// </PlatformAdapterProvider>

/**
 * 3. Progressive Web App
 */
// import { pwaAdapter } from './custom-adapter';
//
// <PlatformAdapterProvider adapter={pwaAdapter}>
//   <PageGenerator {...config} />
// </PlatformAdapterProvider>

/**
 * 4. Combine Multiple Adapters (Decorator Pattern)
 */
export function createCompositeAdapter(
  baseAdapter: PlatformAdapter,
  ...middlewares: Array<(adapter: PlatformAdapter) => PlatformAdapter>
): PlatformAdapter {
  return middlewares.reduce((adapter, middleware) => middleware(adapter), baseAdapter);
}

// Example: Logging middleware
function withLogging(adapter: PlatformAdapter): PlatformAdapter {
  return {
    ...adapter,
    injectMetadata(metadata) {
      console.log("[Adapter] Injecting metadata:", metadata);
      adapter.injectMetadata(metadata);
    },
  };
}

// Example: Performance monitoring middleware
function withPerformanceMonitoring(adapter: PlatformAdapter): PlatformAdapter {
  return {
    ...adapter,
    injectMetadata(metadata) {
      const start = performance.now();
      adapter.injectMetadata(metadata);
      const duration = performance.now() - start;
      console.log(`[Adapter] Metadata injection took ${duration.toFixed(2)}ms`);
    },
  };
}

// Usage:
// const enhancedAdapter = createCompositeAdapter(
//   nextJsAdapter,
//   withLogging,
//   withPerformanceMonitoring
// );

/**
 * Testing Custom Adapters:
 *
 * @example Unit test with custom adapter
 * ```tsx
 * import { render } from '@testing-library/react';
 * import { PlatformAdapterProvider } from '@gaddario98/react-pages/config';
 * import { nextJsAdapter } from './custom-adapter';
 *
 * test('renders with custom adapter', () => {
 *   const { getByText } = render(
 *     <PlatformAdapterProvider adapter={nextJsAdapter}>
 *       <PageGenerator {...config} />
 *     </PlatformAdapterProvider>
 *   );
 *
 *   expect(getByText('My Page')).toBeInTheDocument();
 * });
 * ```
 */

/**
 * Best Practices for Custom Adapters:
 *
 * 1. **Keep adapters stateless**: No side effects except primary purpose
 * 2. **Handle SSR gracefully**: Check typeof document !== 'undefined'
 * 3. **Support feature detection**: Implement supportsFeature accurately
 * 4. **Document behavior**: Explain differences from default adapters
 * 5. **Test on all platforms**: Ensure consistent behavior
 * 6. **Use composition**: Combine adapters with middleware pattern
 */

/**
 * Common Use Cases for Custom Adapters:
 *
 * 1. **SSR Integration**: Next.js, Remix, Gatsby (capture metadata for server)
 * 2. **Analytics**: Track page views, metadata changes, user interactions
 * 3. **Mobile Optimization**: PWA features, touch handling, viewport settings
 * 4. **A/B Testing**: Inject experiment IDs into metadata
 * 5. **Internationalization**: Language-specific metadata injection
 * 6. **Accessibility**: Additional ARIA tags, screen reader hints
 * 7. **Development Tools**: Logging, performance monitoring, debugging
 */
