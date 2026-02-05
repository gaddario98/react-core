/**
 * Metadata Configuration Types
 * Custom metadata system replacing react-helmet-async
 * Platform-agnostic: works on web, React Native, and SSR
 */

import type { FieldValues } from '@gaddario98/react-form'
import type { QueriesArray } from '@gaddario98/react-queries'
import type { FunctionProps, PageProps } from '../types'

/**
 * Context passed to dynamic metadata evaluator functions
 * Provides access to form values, queries, and page state
 */
export type MetadataEvaluatorContext<
  F extends FieldValues = FieldValues,
  Q extends QueriesArray = QueriesArray,
> = FunctionProps<F, Q>

export interface MetaTag {
  /** For <meta name="..." content="..." /> */
  name?: string
  /** For <meta property="og:..." content="..." /> */
  property?: string
  /** For <meta http-equiv="..." content="..." /> */
  httpEquiv?: string
  /** Meta tag content */
  content: string
  /** Unique identifier for updating existing tags */
  id?: string
}

// ─── Open Graph ──────────────────────────────────────────────

/**
 * Open Graph Image Configuration
 */
export interface OpenGraphImage {
  /** Absolute URL to the image */
  url: string
  /** Alt text for the image */
  alt?: string
  /** Image width in pixels */
  width?: number
  /** Image height in pixels */
  height?: number
  /** MIME type (e.g., "image/jpeg", "image/png") */
  type?: string
}

/**
 * Open Graph Article Configuration (when type='article')
 */
export interface OpenGraphArticle {
  /** ISO 8601 date string */
  publishedTime?: string
  /** ISO 8601 date string */
  modifiedTime?: string
  /** ISO 8601 date string */
  expirationTime?: string
  /** Author name or URL */
  author?: string | Array<string>
  /** Article section/category */
  section?: string
  /** Article tags */
  tags?: Array<string>
}

/**
 * Open Graph Configuration (Facebook, LinkedIn, etc.)
 */
export interface OpenGraphConfig<
  F extends FieldValues = FieldValues,
  Q extends QueriesArray = QueriesArray,
> {
  type?: 'website' | 'article' | 'product' | 'profile'
  title?: string | ((context: MetadataEvaluatorContext<F, Q>) => string)
  description?: string | ((context: MetadataEvaluatorContext<F, Q>) => string)
  /** Single image URL or full image config */
  image?: string | OpenGraphImage | ((context: MetadataEvaluatorContext<F, Q>) => string | OpenGraphImage)
  /** Multiple images for the page */
  images?: Array<OpenGraphImage> | ((context: MetadataEvaluatorContext<F, Q>) => Array<OpenGraphImage>)
  /** Canonical URL */
  url?: string | ((context: MetadataEvaluatorContext<F, Q>) => string)
  siteName?: string
  /** Locale (e.g., "en_US", "it_IT") */
  locale?: string
  /** Article-specific metadata (when type='article') */
  article?: OpenGraphArticle
}

// ─── Twitter Card ────────────────────────────────────────────

/**
 * Twitter Card Configuration
 */
export interface TwitterCardConfig<
  F extends FieldValues = FieldValues,
  Q extends QueriesArray = QueriesArray,
> {
  /** Card type */
  card?: 'summary' | 'summary_large_image' | 'app' | 'player'
  /** @username of the website */
  site?: string
  /** @username of the content creator */
  creator?: string
  /** Title (falls back to og:title then page title) */
  title?: string | ((context: MetadataEvaluatorContext<F, Q>) => string)
  /** Description (falls back to og:description then page description) */
  description?: string | ((context: MetadataEvaluatorContext<F, Q>) => string)
  /** Image URL (falls back to og:image) */
  image?: string | ((context: MetadataEvaluatorContext<F, Q>) => string)
  /** Alt text for the image */
  imageAlt?: string | ((context: MetadataEvaluatorContext<F, Q>) => string)
}

// ─── Alternates / hreflang ───────────────────────────────────

/**
 * Alternate languages/URLs configuration for i18n SEO
 */
export interface AlternatesConfig {
  /** Canonical URL for this page */
  canonical?: string
  /** Map of locale → URL for hreflang tags (e.g., { "en": "/en/page", "it": "/it/page" }) */
  languages?: Record<string, string>
  /** Media-specific alternates (e.g., mobile version) */
  media?: Record<string, string>
  /** RSS/Atom feed alternates */
  types?: Record<string, Array<{ url: string; title?: string }>>
}

// ─── Icons / Manifest / PWA ──────────────────────────────────

/**
 * Icon configuration
 */
export interface IconConfig {
  /** URL to the icon */
  url: string
  /** Icon type (e.g., "image/png", "image/svg+xml") */
  type?: string
  /** Icon sizes (e.g., "32x32", "192x192") */
  sizes?: string
  /** Color for SVG mask icons */
  color?: string
}

/**
 * Icons & PWA configuration
 */
export interface IconsConfig {
  /** Standard favicon(s) - link[rel="icon"] */
  icon?: string | IconConfig | Array<IconConfig>
  /** Apple touch icon(s) - link[rel="apple-touch-icon"] */
  apple?: string | IconConfig | Array<IconConfig>
  /** Shortcut icon (legacy) */
  shortcut?: string
}

// ─── Structured Data ─────────────────────────────────────────

/**
 * Structured Data Configuration (schema.org JSON-LD)
 */
export interface StructuredDataConfig<
  F extends FieldValues = FieldValues,
  Q extends QueriesArray = QueriesArray,
> {
  type:
    | 'Article'
    | 'Product'
    | 'WebPage'
    | 'FAQPage'
    | 'Organization'
    | 'Person'
    | 'WebSite'
    | 'BreadcrumbList'
  schema:
    | Record<string, unknown>
    | ((context: MetadataEvaluatorContext<F, Q>) => Record<string, unknown>)
}

// ─── AI Hints ────────────────────────────────────────────────

/**
 * AI Crawler Hints (for AI search engines and LLMs)
 */
export interface AIHintsConfig<
  F extends FieldValues = FieldValues,
  Q extends QueriesArray = QueriesArray,
> {
  /** Content classification (e.g., "documentation", "tutorial", "reference") */
  contentClassification?:
    | string
    | ((context: MetadataEvaluatorContext<F, Q>) => string)
  /** Hints for AI models (e.g., ["code-heavy", "technical"]) */
  modelHints?:
    | Array<string>
    | ((context: MetadataEvaluatorContext<F, Q>) => Array<string>)
  /** Additional context for AI understanding */
  contextualInfo?:
    | string
    | ((context: MetadataEvaluatorContext<F, Q>) => string)
  /** Exclude this page from AI crawler indexing */
  excludeFromIndexing?: boolean
}

// ─── Robots ──────────────────────────────────────────────────

/**
 * Robots Configuration (indexing directives)
 */
export interface RobotsConfig {
  /** Prevent indexing */
  noindex?: boolean
  /** Don't follow links */
  nofollow?: boolean
  /** Don't cache page */
  noarchive?: boolean
  /** Don't show snippets in search results */
  nosnippet?: boolean
  /** Image preview size in search results */
  maxImagePreview?: 'none' | 'standard' | 'large'
  /** Max snippet length in search results */
  maxSnippet?: number
}

// ─── Resolved Metadata (all values are plain strings/objects) ─

/**
 * Resolved Metadata - all dynamic functions have been evaluated.
 * This is the output of resolveMetadata() and is what gets applied to the DOM
 * or passed to framework helpers (toNextMetadata, etc.).
 */
export interface ResolvedMetadata {
  // Basic
  title?: string
  description?: string
  canonical?: string
  lang?: string
  keywords?: Array<string>
  author?: string
  viewport?: string
  themeColor?: string

  // Open Graph
  openGraph?: {
    type?: 'website' | 'article' | 'product' | 'profile'
    title?: string
    description?: string
    image?: string | OpenGraphImage
    images?: Array<OpenGraphImage>
    url?: string
    siteName?: string
    locale?: string
    article?: OpenGraphArticle
  }

  // Twitter Card
  twitter?: {
    card?: 'summary' | 'summary_large_image' | 'app' | 'player'
    site?: string
    creator?: string
    title?: string
    description?: string
    image?: string
    imageAlt?: string
  }

  // Alternates / hreflang
  alternates?: AlternatesConfig

  // Icons / PWA
  icons?: IconsConfig
  /** Web app manifest URL */
  manifest?: string

  // Structured Data
  structuredData?: {
    type: string
    schema: Record<string, unknown>
  }

  // AI Hints
  aiHints?: {
    contentClassification?: string
    modelHints?: Array<string>
    contextualInfo?: string
    excludeFromIndexing?: boolean
  }

  // Robots
  robots?: RobotsConfig

  // Disable search engine indexing (shorthand for robots.noindex + robots.nofollow)
  disableIndexing?: boolean

  // Custom meta tags
  customMeta?: Array<MetaTag>
}

// ─── MetadataConfig (input, with dynamic functions) ──────────

/**
 * Complete Metadata Configuration (Generic over F and Q for dynamic metadata)
 * This is the "input" type — values can be strings or evaluator functions.
 * Use resolveMetadata() to convert this to ResolvedMetadata.
 */
export interface MetadataConfig<
  F extends FieldValues = FieldValues,
  Q extends QueriesArray = QueriesArray,
> {
  // Basic Metadata
  /** Page title - sets document.title on web */
  title?: string | ((context: MetadataEvaluatorContext<F, Q>) => string)
  /** Page description meta tag */
  description?: string | ((context: MetadataEvaluatorContext<F, Q>) => string)
  /** Canonical URL for the page */
  canonical?: string | ((context: MetadataEvaluatorContext<F, Q>) => string)
  /** HTML lang attribute (e.g., "en", "it") */
  lang?: string
  /**
   * @deprecated Use `lang` instead. Will be removed in a future version.
   */
  documentLang?: string
  /** Keywords for SEO */
  keywords?:
    | Array<string>
    | ((context: MetadataEvaluatorContext<F, Q>) => Array<string>)

  // Open Graph (Social Media)
  openGraph?: OpenGraphConfig<F, Q>

  // Twitter Card
  twitter?: TwitterCardConfig<F, Q>

  // Alternates / hreflang (i18n SEO)
  alternates?: AlternatesConfig

  // Icons / PWA
  icons?: IconsConfig
  /** Web app manifest URL */
  manifest?: string

  // Structured Data (Search Engines)
  structuredData?: StructuredDataConfig<F, Q>

  // AI Crawler Hints
  aiHints?: AIHintsConfig<F, Q>

  // Robots Meta Tags
  robots?: RobotsConfig

  // Additional custom meta tags
  customMeta?:
    | Array<MetaTag>
    | ((context: MetadataEvaluatorContext<F, Q>) => Array<MetaTag>)

  // Disable search engine indexing (shorthand for robots.noindex + robots.nofollow)
  disableIndexing?: boolean

  /** Author meta tag */
  author?: string
  /** Viewport meta tag (defaults to "width=device-width, initial-scale=1") */
  viewport?: string
  /** Theme color for browser UI */
  themeColor?: string
}

// ─── Metadata Store & Provider ───────────────────────────────

/**
 * Request-scoped metadata store.
 * In SSR each request gets its own store to avoid cross-request leaks.
 * On the client, a single global store is used.
 */
export interface MetadataStore {
  /** Get current resolved metadata */
  getMetadata: () => ResolvedMetadata
  /** Set (merge) resolved metadata into the store */
  setMetadata: (meta: ResolvedMetadata) => void
  /** Reset store to empty */
  reset: () => void
}

export interface MetadataProvider {
  /** Apply metadata configuration to the page */
  setMetadata: (config: MetadataConfig) => void
  /** Get current metadata configuration */
  getMetadata: () => MetadataConfig
  /** Reset all metadata to defaults */
  resetMetadata: () => void
}

/**
 * Configuration for lazy loading and code splitting behavior
 * Enables deferred component loading to reduce initial bundle size
 */
export interface LazyLoadingConfig<
  F extends FieldValues = FieldValues,
  Q extends QueriesArray = QueriesArray,
> {
  /** Enable lazy loading (default: true) */
  enabled?: boolean
  /** Preload on hover for interactive elements (default: false) */
  preloadOnHover?: boolean
  /** Preload on focus for keyboard navigation (default: false) */
  preloadOnFocus?: boolean
  /** Preload after render with delay (in ms, default: undefined - no delay) */
  preloadAfterRender?: number
  /** Fallback component to show while loading (default: null) */
  suspenseFallback?: React.ReactNode
  /** Custom error boundary component for lazy-loaded modules */
  errorBoundary?: React.ComponentType<{ error: Error; retry: () => void }>
  /** Maximum time to wait before showing error state (in ms, default: 30000) */
  timeout?: number
  /** Log performance metrics for lazy loading (development only) */
  logMetrics?: boolean
  /** IntersectionObserver threshold (0-1, default: 0.1) - alias for intersectionThreshold */
  threshold?: number | Array<number>
  /** IntersectionObserver threshold (0-1, default: 0.1) */
  intersectionThreshold?: number | Array<number>
  /** IntersectionObserver root margin (default: "100px") - alias for intersectionRootMargin */
  rootMargin?: string
  /** IntersectionObserver root margin (default: "100px") */
  intersectionRootMargin?: string
  /** Trigger type for lazy loading: viewport (IntersectionObserver), interaction (manual), or conditional (based on function) */
  trigger?: 'viewport' | 'interaction' | 'conditional'
  /** Conditional function to determine if content should load (for trigger: "conditional") */
  condition?: (context: MetadataEvaluatorContext<F, Q>) => boolean
  /** Placeholder component to show before lazy content loads */
  placeholder?: React.ReactNode
}

/**
 * Platform-specific configuration overrides
 * Allows different behavior on web vs React Native
 * Note: This is a partial type - it will be completed in types.ts with full PageProps type
 */
export interface PlatformOverrides<
  F extends FieldValues = FieldValues,
  Q extends QueriesArray = QueriesArray,
> {
  /** Web-specific overrides (React DOM) */
  web?: Partial<PageProps<F, Q>> // Will be Partial<PageProps<F, Q>> when imported in types.ts
  /** React Native-specific overrides */
  native?: Partial<PageProps<F, Q>> // Will be Partial<PageProps<F, Q>> when imported in types.ts
}

// ─── LLMs.txt ────────────────────────────────────────────────

/**
 * Entry for the llms.txt file
 */
export interface LlmsTxtEntry {
  /** URL of the page */
  url: string
  /** Short title / label for this page */
  title: string
  /** Brief description for the LLM */
  description?: string
}

/**
 * Configuration for llms.txt generation
 */
export interface LlmsTxtConfig {
  /** Site title / name shown at the top of llms.txt */
  siteName: string
  /** Brief description of the site */
  siteDescription?: string
  /** Curated list of pages to expose in llms.txt */
  entries: Array<LlmsTxtEntry>
}
