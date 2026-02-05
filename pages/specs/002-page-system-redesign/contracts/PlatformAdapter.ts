/**
 * PlatformAdapter Contract
 *
 * Defines the platform abstraction interface for cross-platform support.
 * Enables the same PageProps configuration to work on both web (React DOM)
 * and React Native platforms with platform-appropriate rendering.
 *
 * **NEW in 2.0.0**
 *
 * @since 2.0.0
 */

import { ReactNode } from "react";
import { MetadataConfig } from "./Metadata";
import { ViewSettings } from "./PageProps";

/**
 * Platform Adapter Interface
 *
 * Abstraction layer that maps universal page concepts to platform-specific
 * rendering primitives. Each platform (web, React Native) provides its own
 * implementation of this interface.
 *
 * @example Usage in PageGenerator
 * ```tsx
 * import { webAdapter } from '@gaddario98/react-pages/config/platformAdapters';
 *
 * function PageGenerator(props: PageProps) {
 *   const adapter = usePlatformAdapter(); // Returns webAdapter or nativeAdapter
 *
 *   // Use adapter for platform-specific rendering
 *   useEffect(() => {
 *     if (props.meta && adapter.supportsFeature('metadata')) {
 *       adapter.injectMetadata(props.meta);
 *     }
 *   }, [props.meta, adapter]);
 *
 *   return adapter.renderContainer(
 *     <ContentRenderer items={props.contents} />,
 *     props.viewSettings || {}
 *   );
 * }
 * ```
 */
export interface PlatformAdapter {
  /**
   * Platform identifier
   *
   * Identifies which platform this adapter targets.
   *
   * @readonly
   */
  name: "web" | "native";

  /**
   * Inject metadata into platform-specific head/manifest
   *
   * **Web**: Injects metadata into document.head (title, meta tags, JSON-LD)
   * **React Native**: No-op (stores metadata for SSR/analytics but doesn't render)
   *
   * @param metadata - Resolved metadata configuration (after evaluating mapping functions)
   *
   * @example Web implementation
   * ```tsx
   * injectMetadata(metadata: MetadataConfig<any, any>): void {
   *   if (metadata.title) {
   *     document.title = metadata.title;
   *   }
   *
   *   if (metadata.description) {
   *     updateOrCreateMeta('name', 'description', metadata.description);
   *   }
   *
   *   if (metadata.openGraph) {
   *     updateOrCreateMeta('property', 'og:title', metadata.openGraph.title);
   *     // ... more Open Graph tags
   *   }
   *
   *   if (metadata.structuredData) {
   *     const script = document.createElement('script');
   *     script.type = 'application/ld+json';
   *     script.textContent = JSON.stringify(metadata.structuredData.schema);
   *     document.head.appendChild(script);
   *   }
   * }
   * ```
   *
   * @example React Native implementation
   * ```tsx
   * injectMetadata(metadata: MetadataConfig<any, any>): void {
   *   // No-op: React Native doesn't have document.head
   *   console.log('[PlatformAdapter] Metadata (native - no-op):', metadata);
   *   // Optionally store for analytics or SSR
   * }
   * ```
   */
  injectMetadata(metadata: MetadataConfig<any, any>): void;

  /**
   * Render page container with platform-appropriate wrapper
   *
   * **Web**: Renders a <div> or custom React DOM component
   * **React Native**: Renders a <View> or custom React Native component
   *
   * Applies view settings (padding, custom container, etc.) in a platform-appropriate way.
   *
   * @param children - Page content to wrap
   * @param settings - View settings configuration
   * @returns Platform-appropriate container component wrapping children
   *
   * @example Web implementation
   * ```tsx
   * renderContainer(
   *   children: React.ReactNode,
   *   settings: ViewSettings
   * ): React.ReactNode {
   *   const Container = settings.customPageContainer || pageConfig.PageContainer;
   *
   *   return (
   *     <Container
   *       className="page-container"
   *       style={{ padding: settings.withoutPadding ? 0 : '16px' }}
   *     >
   *       {children}
   *     </Container>
   *   );
   * }
   * ```
   *
   * @example React Native implementation
   * ```tsx
   * renderContainer(
   *   children: React.ReactNode,
   *   settings: ViewSettings
   * ): React.ReactNode {
   *   const Container = settings.customPageContainer || View;
   *
   *   return (
   *     <Container
   *       style={{ padding: settings.withoutPadding ? 0 : 16 }}
   *     >
   *       {children}
   *     </Container>
   *   );
   * }
   * ```
   */
  renderContainer(
    children: ReactNode,
    settings: ViewSettings
  ): ReactNode;

  /**
   * Render scrollable container
   *
   * **Web**: Renders a scrollable <div> with overflow
   * **React Native**: Renders a <ScrollView> with refresh control
   *
   * @param children - Scrollable content
   * @param settings - View settings configuration
   * @returns Platform-appropriate scrollable component
   *
   * @example Web implementation
   * ```tsx
   * renderScrollView(
   *   children: React.ReactNode,
   *   settings: ViewSettings
   * ): React.ReactNode {
   *   return (
   *     <div
   *       style={{
   *         overflowY: 'auto',
   *         height: '100%',
   *         padding: settings.withoutPadding ? 0 : '16px'
   *       }}
   *     >
   *       {children}
   *     </div>
   *   );
   * }
   * ```
   *
   * @example React Native implementation
   * ```tsx
   * renderScrollView(
   *   children: React.ReactNode,
   *   settings: ViewSettings
   * ): React.ReactNode {
   *   const refreshControl = settings.disableRefreshing
   *     ? undefined
   *     : <RefreshControl refreshing={false} onRefresh={() => {}} />;
   *
   *   return (
   *     <ScrollView
   *       contentContainerStyle={{ padding: settings.withoutPadding ? 0 : 16 }}
   *       refreshControl={refreshControl}
   *     >
   *       {children}
   *     </ScrollView>
   *   );
   * }
   * ```
   */
  renderScrollView(
    children: ReactNode,
    settings: ViewSettings
  ): ReactNode;

  /**
   * Check if platform supports a specific feature
   *
   * Allows conditional logic based on platform capabilities.
   *
   * @param feature - Feature name to check
   * @returns true if feature is supported on this platform
   *
   * @example Usage in PageGenerator
   * ```tsx
   * // Only inject metadata if platform supports it
   * if (adapter.supportsFeature('metadata')) {
   *   adapter.injectMetadata(resolvedMetadata);
   * }
   *
   * // Only use IntersectionObserver if available
   * if (adapter.supportsFeature('intersectionObserver')) {
   *   useLazyLoadingWithIntersection();
   * } else {
   *   useEagerLoading(); // Fallback for React Native
   * }
   * ```
   */
  supportsFeature(feature: PlatformFeature): boolean;
}

/**
 * Platform Feature
 *
 * Features that may or may not be supported on different platforms.
 */
export type PlatformFeature =
  | "metadata"              // Document head manipulation (meta tags, title, JSON-LD)
  | "lazyLoading"           // Code splitting with React.lazy()
  | "suspense"              // React Suspense support
  | "documentHead"          // Direct access to document.head
  | "intersectionObserver"; // IntersectionObserver API for viewport detection

/**
 * Feature Support Matrix
 *
 * | Feature                | Web | React Native |
 * |------------------------|-----|--------------|
 * | metadata               | ✅  | ❌           |
 * | lazyLoading            | ✅  | ✅           |
 * | suspense               | ✅  | ✅           |
 * | documentHead           | ✅  | ❌           |
 * | intersectionObserver   | ✅  | ❌           |
 */

/**
 * Web Platform Adapter (Reference Implementation)
 *
 * @example config/platformAdapters/web.ts
 * ```tsx
 * import { PlatformAdapter, PlatformFeature } from './PlatformAdapter';
 * import { pageConfig } from '../pageConfig';
 *
 * function updateOrCreateMeta(
 *   attr: 'name' | 'property',
 *   key: string,
 *   content: string
 * ): void {
 *   const selector = `meta[${attr}="${key}"]`;
 *   let meta = document.querySelector(selector) as HTMLMetaElement;
 *
 *   if (!meta) {
 *     meta = document.createElement('meta');
 *     meta.setAttribute(attr, key);
 *     document.head.appendChild(meta);
 *   }
 *
 *   meta.setAttribute('content', content);
 * }
 *
 * export const webAdapter: PlatformAdapter = {
 *   name: 'web',
 *
 *   injectMetadata(metadata) {
 *     // Title
 *     if (metadata.title) {
 *       document.title = metadata.title;
 *     }
 *
 *     // Description
 *     if (metadata.description) {
 *       updateOrCreateMeta('name', 'description', metadata.description);
 *     }
 *
 *     // Keywords
 *     if (metadata.keywords) {
 *       updateOrCreateMeta('name', 'keywords', metadata.keywords.join(', '));
 *     }
 *
 *     // Language
 *     if (metadata.documentLang) {
 *       document.documentElement.lang = metadata.documentLang;
 *     }
 *
 *     // Open Graph
 *     if (metadata.openGraph) {
 *       const og = metadata.openGraph;
 *       if (og.type) updateOrCreateMeta('property', 'og:type', og.type);
 *       if (og.title) updateOrCreateMeta('property', 'og:title', og.title);
 *       if (og.description) updateOrCreateMeta('property', 'og:description', og.description);
 *       if (og.image) updateOrCreateMeta('property', 'og:image', og.image);
 *       if (og.url) updateOrCreateMeta('property', 'og:url', og.url);
 *       if (og.siteName) updateOrCreateMeta('property', 'og:site_name', og.siteName);
 *       if (og.locale) updateOrCreateMeta('property', 'og:locale', og.locale);
 *     }
 *
 *     // Robots
 *     if (metadata.robots) {
 *       const directives: string[] = [];
 *       if (metadata.robots.noindex) directives.push('noindex');
 *       if (metadata.robots.nofollow) directives.push('nofollow');
 *       if (metadata.robots.noarchive) directives.push('noarchive');
 *       if (metadata.robots.nosnippet) directives.push('nosnippet');
 *       if (metadata.robots.maxImagePreview) directives.push(`max-image-preview:${metadata.robots.maxImagePreview}`);
 *       if (metadata.robots.maxSnippet !== undefined) directives.push(`max-snippet:${metadata.robots.maxSnippet}`);
 *
 *       if (directives.length > 0) {
 *         updateOrCreateMeta('name', 'robots', directives.join(', '));
 *       }
 *     }
 *
 *     // Structured Data (JSON-LD)
 *     if (metadata.structuredData) {
 *       const scriptId = 'structured-data-jsonld';
 *       let script = document.getElementById(scriptId) as HTMLScriptElement;
 *
 *       if (!script) {
 *         script = document.createElement('script');
 *         script.type = 'application/ld+json';
 *         script.id = scriptId;
 *         document.head.appendChild(script);
 *       }
 *
 *       script.textContent = JSON.stringify(metadata.structuredData.schema);
 *     }
 *
 *     // Custom meta tags
 *     if (metadata.customMeta) {
 *       metadata.customMeta.forEach(tag => {
 *         if (tag.id?.startsWith('schema-')) {
 *           // JSON-LD script tag
 *           let script = document.getElementById(tag.id) as HTMLScriptElement;
 *           if (!script) {
 *             script = document.createElement('script');
 *             script.type = 'application/ld+json';
 *             script.id = tag.id;
 *             document.head.appendChild(script);
 *           }
 *           script.textContent = tag.content;
 *         } else if (tag.name) {
 *           updateOrCreateMeta('name', tag.name, tag.content);
 *         } else if (tag.property) {
 *           updateOrCreateMeta('property', tag.property, tag.content);
 *         }
 *       });
 *     }
 *   },
 *
 *   renderContainer(children, settings) {
 *     const Container = settings.customPageContainer || pageConfig.PageContainer;
 *     return (
 *       <Container
 *         withoutPadding={settings.withoutPadding}
 *         headerWithoutPadding={settings.header?.withoutPadding}
 *         footerWithoutPadding={settings.footer?.withoutPadding}
 *       >
 *         {children}
 *       </Container>
 *     );
 *   },
 *
 *   renderScrollView(children, settings) {
 *     return (
 *       <div
 *         style={{
 *           overflowY: 'auto',
 *           height: '100%',
 *           padding: settings.withoutPadding ? 0 : '16px'
 *         }}
 *       >
 *         {children}
 *       </div>
 *     );
 *   },
 *
 *   supportsFeature(feature: PlatformFeature): boolean {
 *     switch (feature) {
 *       case 'metadata':
 *       case 'documentHead':
 *         return typeof document !== 'undefined';
 *       case 'lazyLoading':
 *       case 'suspense':
 *         return true;
 *       case 'intersectionObserver':
 *         return typeof IntersectionObserver !== 'undefined';
 *       default:
 *         return false;
 *     }
 *   }
 * };
 * ```
 */

/**
 * React Native Platform Adapter (Reference Implementation)
 *
 * @example config/platformAdapters/native.ts
 * ```tsx
 * import { PlatformAdapter, PlatformFeature } from './PlatformAdapter';
 * import { View, ScrollView } from 'react-native';
 *
 * export const nativeAdapter: PlatformAdapter = {
 *   name: 'native',
 *
 *   injectMetadata(metadata) {
 *     // No-op: React Native doesn't have document.head
 *     // Optionally log or store for SSR/analytics
 *     if (__DEV__) {
 *       console.log('[PlatformAdapter] Metadata (native - no-op):', metadata);
 *     }
 *   },
 *
 *   renderContainer(children, settings) {
 *     const Container = settings.customPageContainer || View;
 *     return (
 *       <Container
 *         style={{
 *           flex: 1,
 *           padding: settings.withoutPadding ? 0 : 16
 *         }}
 *       >
 *         {children}
 *       </Container>
 *     );
 *   },
 *
 *   renderScrollView(children, settings) {
 *     return (
 *       <ScrollView
 *         contentContainerStyle={{
 *           padding: settings.withoutPadding ? 0 : 16
 *         }}
 *         refreshControl={
 *           settings.disableRefreshing
 *             ? undefined
 *             : <RefreshControl refreshing={false} onRefresh={() => {}} />
 *         }
 *       >
 *         {children}
 *       </ScrollView>
 *     );
 *   },
 *
 *   supportsFeature(feature: PlatformFeature): boolean {
 *     switch (feature) {
 *       case 'lazyLoading':
 *       case 'suspense':
 *         return true; // React Native supports React.lazy() with Metro bundler
 *       case 'metadata':
 *       case 'documentHead':
 *       case 'intersectionObserver':
 *         return false; // Not available in React Native
 *       default:
 *         return false;
 *     }
 *   }
 * };
 * ```
 */

/**
 * Platform Detection and Auto-Selection
 *
 * @example config/platformAdapters/index.ts
 * ```tsx
 * import { PlatformAdapter } from './PlatformAdapter';
 * import { webAdapter } from './web';
 * import { nativeAdapter } from './native';
 *
 * // Auto-detect platform
 * export function detectPlatform(): PlatformAdapter {
 *   // React Native detection
 *   if (typeof navigator !== 'undefined' && navigator.product === 'ReactNative') {
 *     return nativeAdapter;
 *   }
 *
 *   // Web (default)
 *   return webAdapter;
 * }
 *
 * // Default adapter (auto-detected)
 * export const defaultAdapter = detectPlatform();
 *
 * // Re-export adapters for manual selection
 * export { webAdapter, nativeAdapter };
 * ```
 */

/**
 * Custom Platform Adapter
 *
 * You can create custom adapters for specialized platforms or behaviors.
 *
 * @example Custom SSR adapter with server-side metadata extraction
 * ```tsx
 * import { PlatformAdapter } from '@gaddario98/react-pages/contracts/PlatformAdapter';
 *
 * let capturedMetadata: MetadataConfig<any, any> | null = null;
 *
 * export const ssrAdapter: PlatformAdapter = {
 *   name: 'web',
 *
 *   injectMetadata(metadata) {
 *     // Capture metadata for SSR instead of injecting into DOM
 *     capturedMetadata = metadata;
 *   },
 *
 *   renderContainer(children, settings) {
 *     // SSR-specific rendering (no client-side JavaScript)
 *     return <div data-ssr-container>{children}</div>;
 *   },
 *
 *   renderScrollView(children, settings) {
 *     return <div data-ssr-scroll>{children}</div>;
 *   },
 *
 *   supportsFeature(feature) {
 *     // SSR supports everything except IntersectionObserver
 *     return feature !== 'intersectionObserver';
 *   }
 * };
 *
 * export function getServerMetadata(): MetadataConfig<any, any> | null {
 *   return capturedMetadata;
 * }
 * ```
 */

/**
 * PlatformAdapterProvider Context
 *
 * Allows runtime adapter override via React Context.
 *
 * @example Usage in app root
 * ```tsx
 * import { PlatformAdapterProvider } from '@gaddario98/react-pages/config';
 * import { customAdapter } from './customAdapter';
 *
 * function App() {
 *   return (
 *     <PlatformAdapterProvider adapter={customAdapter}>
 *       <PageGenerator {...pageConfig} />
 *     </PlatformAdapterProvider>
 *   );
 * }
 * ```
 */

/**
 * Best Practices
 *
 * 1. **Use auto-detection by default**: Let the library detect the platform automatically
 *    unless you have specific requirements.
 *
 * 2. **Check feature support**: Always use `adapter.supportsFeature()` before calling
 *    platform-specific features to ensure graceful degradation.
 *
 * 3. **Test on both platforms**: If you create custom adapters, test on both web and
 *    React Native to ensure consistent behavior.
 *
 * 4. **Keep adapters stateless**: Adapters should be pure functions with no side effects
 *    except for their primary purpose (metadata injection, rendering).
 *
 * 5. **Document custom adapters**: If you create custom adapters, document their behavior
 *    and any limitations compared to default adapters.
 */

/**
 * Migration Notes (1.x → 2.x)
 *
 * **NEW in 2.0.0**: PlatformAdapter is entirely new. 1.x had implicit platform handling.
 *
 * **No action required for most users**: Auto-detection works out of the box.
 *
 * **Migration for custom platform handling**:
 * If you had custom platform detection in 1.x, migrate to custom adapter in 2.x:
 *
 * @example Before (1.x - implicit)
 * ```tsx
 * // Platform-specific code scattered throughout components
 * if (Platform.OS === 'web') {
 *   document.title = title;
 * }
 * ```
 *
 * @example After (2.x - explicit adapter)
 * ```tsx
 * // Centralized in platform adapter
 * const adapter = usePlatformAdapter();
 * if (adapter.supportsFeature('metadata')) {
 *   adapter.injectMetadata(metadata);
 * }
 * ```
 */
