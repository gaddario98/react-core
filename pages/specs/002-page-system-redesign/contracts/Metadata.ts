/**
 * Metadata Contract
 *
 * Defines metadata configuration types for SEO, social media sharing,
 * structured data (JSON-LD), and AI crawler hints.
 *
 * **NEW in 2.0.0**
 *
 * @since 2.0.0
 */

import { FieldValues } from "react-hook-form";
import { QueriesArray } from "@gaddario98/react-queries";
import { MappedItemsFunction } from "./MappedProps";

/**
 * Metadata Configuration
 *
 * Complete metadata configuration for a page including SEO tags,
 * Open Graph (social media), structured data (search engines),
 * and AI crawler hints.
 *
 * Supports both static values and dynamic values via mapping functions
 * that update when query data or form values change.
 *
 * @template F - Form field values type
 * @template Q - Query/mutation definitions array type
 *
 * @platform Web: Full support (injects into document.head)
 * @platform React Native: No-op (metadata stored but not rendered)
 *
 * @example Static metadata
 * ```tsx
 * meta: {
 *   title: 'My Page Title',
 *   description: 'A comprehensive guide to using our product',
 *   keywords: ['react', 'pages', 'performance'],
 *   documentLang: 'en'
 * }
 * ```
 *
 * @example Dynamic metadata from query data
 * ```tsx
 * meta: {
 *   title: (props) => props.allQuery.getProduct?.data?.name || 'Product',
 *   description: (props) => props.allQuery.getProduct?.data?.description,
 *   openGraph: {
 *     type: 'product',
 *     image: (props) => props.allQuery.getProduct?.data?.imageUrl
 *   }
 * }
 * ```
 */
export interface MetadataConfig<
  F extends FieldValues,
  Q extends QueriesArray
> {
  /**
   * Page title (document.title and meta title tag)
   *
   * Appears in:
   * - Browser tab
   * - Search engine results (SERP)
   * - Social media shares (unless overridden by Open Graph)
   *
   * **Best practices**:
   * - Keep under 60 characters for optimal SERP display
   * - Include primary keyword near the beginning
   * - Use brand name at the end: "Page Title | Brand Name"
   *
   * @optional
   * @example Static: "User Profile - My App"
   * @example Dynamic: (props) => `${props.allQuery.getUser?.data?.name}'s Profile`
   */
  title?: string | MappedItemsFunction<F, Q, string>;

  /**
   * Page description (meta description tag)
   *
   * Appears in:
   * - Search engine results (SERP) as the snippet text
   * - Social media shares (unless overridden by Open Graph)
   *
   * **Best practices**:
   * - Keep between 150-160 characters for optimal SERP display
   * - Write compelling copy that encourages clicks
   * - Include primary keyword naturally
   *
   * @optional
   * @example "Manage your user profile, update settings, and view your activity history"
   * @example (props) => `View details for ${props.allQuery.getProduct?.data?.name}`
   */
  description?: string | MappedItemsFunction<F, Q, string>;

  /**
   * HTML document language (lang attribute)
   *
   * Sets the `<html lang="...">` attribute for accessibility and SEO.
   *
   * **Format**: ISO 639-1 language code (2 letters) or BCP 47 language tag
   *
   * @optional
   * @default undefined (browser default)
   * @example "en" // English
   * @example "it" // Italian
   * @example "en-US" // English (United States)
   * @example "pt-BR" // Portuguese (Brazil)
   */
  documentLang?: string;

  /**
   * Meta keywords (meta keywords tag)
   *
   * **Note**: Most search engines ignore this tag, but some specialized
   * search engines and internal site search may use it.
   *
   * @optional
   * @deprecated by Google (but still used by some search engines)
   * @example ['react', 'pages', 'performance', 'optimization']
   * @example (props) => props.allQuery.getProduct?.data?.tags || []
   */
  keywords?: string[] | MappedItemsFunction<F, Q, string[]>;

  /**
   * Open Graph metadata (social media sharing)
   *
   * Controls how your page appears when shared on:
   * - Facebook
   * - LinkedIn
   * - Twitter/X (also supports Twitter Cards)
   * - Slack
   * - Discord
   * - WhatsApp
   *
   * @optional
   * @see https://ogp.me/
   */
  openGraph?: OpenGraphConfig<F, Q>;

  /**
   * Structured data (JSON-LD schema.org markup)
   *
   * Provides machine-readable data to search engines for rich results:
   * - Rich snippets (star ratings, prices, availability)
   * - Knowledge graph panels
   * - Breadcrumb trails
   * - FAQ rich results
   *
   * @optional
   * @see https://schema.org/
   * @see https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data
   */
  structuredData?: StructuredDataConfig<F, Q>;

  /**
   * AI crawler hints (for AI search engines and LLMs)
   *
   * **NEW in 2.0.0**
   *
   * Provides context and hints for AI crawlers (ChatGPT, Perplexity, Claude, etc.)
   * to better understand and represent your content.
   *
   * @optional
   * @experimental AI crawlers are still evolving - format may change
   */
  aiHints?: AIHintsConfig<F, Q>;

  /**
   * Robots meta tag (indexing directives)
   *
   * Controls how search engines index and display your page.
   *
   * @optional
   * @default { noindex: false, nofollow: false }
   */
  robots?: RobotsConfig;

  /**
   * Custom meta tags
   *
   * Arbitrary meta tags not covered by other config options.
   * Useful for platform-specific tags (Apple, Microsoft, etc.)
   *
   * @optional
   * @example
   * ```tsx
   * customMeta: [
   *   { name: 'apple-mobile-web-app-capable', content: 'yes' },
   *   { name: 'theme-color', content: '#000000' },
   *   { property: 'fb:app_id', content: '123456789' }
   * ]
   * ```
   */
  customMeta?: MetaTag[] | MappedItemsFunction<F, Q, MetaTag[]>;
}

/**
 * Open Graph Configuration (Social Media Sharing)
 *
 * Controls how pages appear when shared on social media platforms.
 *
 * @see https://ogp.me/
 */
export interface OpenGraphConfig<
  F extends FieldValues,
  Q extends QueriesArray
> {
  /**
   * Open Graph type
   *
   * Declares the type of content for optimal social media display.
   *
   * Common types:
   * - "website": Default for most pages
   * - "article": Blog posts, news articles
   * - "product": E-commerce product pages
   * - "profile": User profiles, author pages
   *
   * @optional
   * @default "website"
   * @see https://ogp.me/#types
   */
  type?: "website" | "article" | "product" | "profile";

  /**
   * Open Graph title
   *
   * Title shown in social media shares.
   * Falls back to page title if not specified.
   *
   * @optional (falls back to meta.title)
   * @example "Amazing Product - Buy Now!"
   * @example (props) => props.allQuery.getArticle?.data?.headline
   */
  title?: string | MappedItemsFunction<F, Q, string>;

  /**
   * Open Graph description
   *
   * Description shown in social media shares.
   * Falls back to page description if not specified.
   *
   * @optional (falls back to meta.description)
   * @example "Discover our revolutionary product that will change your life"
   */
  description?: string | MappedItemsFunction<F, Q, string>;

  /**
   * Open Graph image URL
   *
   * Image shown in social media shares.
   *
   * **Best practices**:
   * - Use absolute URLs (https://example.com/image.jpg)
   * - Recommended size: 1200x630 pixels (1.91:1 ratio)
   * - Minimum size: 600x315 pixels
   * - Maximum file size: 8 MB
   * - Format: JPG, PNG, or WebP
   *
   * @optional
   * @required for optimal social sharing
   * @example "https://example.com/og-image.jpg"
   * @example (props) => props.allQuery.getProduct?.data?.imageUrl
   */
  image?: string | MappedItemsFunction<F, Q, string>;

  /**
   * Canonical URL
   *
   * The permanent URL for this content (for deduplication).
   *
   * @optional
   * @recommended Always provide for proper content attribution
   * @example "https://example.com/products/amazing-product"
   * @example (props) => `https://example.com/users/${props.allQuery.getUser?.data?.id}`
   */
  url?: string | MappedItemsFunction<F, Q, string>;

  /**
   * Site name
   *
   * The name of your website/application.
   * Displayed alongside the page title on some platforms.
   *
   * @optional
   * @example "My Awesome App"
   */
  siteName?: string;

  /**
   * Locale
   *
   * Language and region for this content.
   *
   * **Format**: language_TERRITORY (ISO 639-1 + ISO 3166-1 alpha-2)
   *
   * @optional
   * @example "en_US" // English (United States)
   * @example "it_IT" // Italian (Italy)
   * @example "pt_BR" // Portuguese (Brazil)
   */
  locale?: string;
}

/**
 * Structured Data Configuration (JSON-LD Schema.org)
 *
 * Provides machine-readable structured data to search engines.
 *
 * @see https://schema.org/
 * @see https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data
 */
export interface StructuredDataConfig<
  F extends FieldValues,
  Q extends QueriesArray
> {
  /**
   * Schema.org type
   *
   * The type of structured data you're providing.
   *
   * Common types:
   * - "Article": Blog posts, news articles
   * - "Product": E-commerce products
   * - "WebPage": Generic web pages
   * - "FAQPage": FAQ pages (enables FAQ rich results)
   * - "Organization": Company/organization info
   * - "Person": Person profiles
   *
   * @required
   * @see https://schema.org/docs/full.html (full list of types)
   */
  type:
    | "Article"
    | "Product"
    | "WebPage"
    | "FAQPage"
    | "Organization"
    | "Person"
    | "Event"
    | "Recipe";

  /**
   * Schema.org JSON-LD object
   *
   * The actual structured data following schema.org specification.
   * Must include @context and @type fields.
   *
   * @required
   * @example Static product schema
   * ```tsx
   * schema: {
   *   '@context': 'https://schema.org',
   *   '@type': 'Product',
   *   name: 'Amazing Product',
   *   description: 'The best product ever',
   *   offers: {
   *     '@type': 'Offer',
   *     price: '99.99',
   *     priceCurrency: 'USD'
   *   }
   * }
   * ```
   *
   * @example Dynamic article schema
   * ```tsx
   * schema: (props) => {
   *   const article = props.allQuery.getArticle?.data;
   *   return {
   *     '@context': 'https://schema.org',
   *     '@type': 'Article',
   *     headline: article?.title,
   *     author: {
   *       '@type': 'Person',
   *       name: article?.author?.name
   *     },
   *     datePublished: article?.publishedAt
   *   };
   * }
   * ```
   */
  schema: Record<string, any> | MappedItemsFunction<F, Q, Record<string, any>>;
}

/**
 * AI Crawler Hints Configuration
 *
 * **NEW in 2.0.0**
 *
 * Provides hints to AI crawlers (ChatGPT, Perplexity, Claude, etc.)
 * for better understanding and representation of your content.
 *
 * @experimental Format may evolve as AI crawlers standardize
 */
export interface AIHintsConfig<
  F extends FieldValues,
  Q extends QueriesArray
> {
  /**
   * Content classification
   *
   * Broad category of your content to help AI understand context.
   *
   * @optional
   * @example "technical-documentation"
   * @example "tutorial"
   * @example "api-reference"
   * @example "blog-post"
   * @example "product-listing"
   */
  contentClassification?: string | MappedItemsFunction<F, Q, string>;

  /**
   * Model hints
   *
   * Specific hints about the nature of your content.
   * Helps AI models provide more accurate responses.
   *
   * @optional
   * @example ["code-heavy", "technical", "beginner-friendly"]
   * @example ["api-reference", "rest-api", "authentication"]
   * @example (props) => props.allQuery.getArticle?.data?.tags || []
   */
  modelHints?: string[] | MappedItemsFunction<F, Q, string[]>;

  /**
   * Contextual information
   *
   * Free-form text providing additional context to AI models.
   * Think of this as a "summary for AI" - describe what your page
   * is about and what users can do on it.
   *
   * @optional
   * @example "Complete API documentation for user authentication endpoints including OAuth 2.0 flows, JWT tokens, and error codes"
   * @example (props) => {
   *   const product = props.allQuery.getProduct?.data;
   *   return `Product page for ${product?.name}, a ${product?.category} that helps users ${product?.benefit}`;
   * }
   */
  contextualInfo?: string | MappedItemsFunction<F, Q, string>;
}

/**
 * Robots Configuration (Indexing Directives)
 *
 * Controls how search engines index and display your page.
 *
 * @see https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag
 */
export interface RobotsConfig {
  /**
   * Prevent indexing
   *
   * When true, search engines will not index this page.
   * Use for:
   * - Admin pages
   * - User-specific pages
   * - Staging/development environments
   * - Duplicate content
   *
   * @optional
   * @default false
   * @example noindex: true // Don't index this page
   */
  noindex?: boolean;

  /**
   * Don't follow links
   *
   * When true, search engines will not follow links on this page.
   * Use for:
   * - User-generated content (prevent spam links)
   * - External link aggregation pages
   *
   * @optional
   * @default false
   * @example nofollow: true // Don't follow links
   */
  nofollow?: boolean;

  /**
   * Don't cache page
   *
   * When true, search engines will not show cached versions of this page.
   * Use for:
   * - Frequently updated content
   * - Time-sensitive content
   * - Personal/private content
   *
   * @optional
   * @default false
   */
  noarchive?: boolean;

  /**
   * Don't show snippets
   *
   * When true, search engines will not show text snippets in search results.
   * Use for:
   * - Pages where snippets might be misleading
   * - Content that should only be viewed in full context
   *
   * @optional
   * @default false
   */
  nosnippet?: boolean;

  /**
   * Maximum image preview size
   *
   * Controls the size of image previews in search results.
   *
   * @optional
   * @default "standard"
   * @example "large" // Allow large image previews (better for image-heavy content)
   */
  maxImagePreview?: "none" | "standard" | "large";

  /**
   * Maximum snippet length
   *
   * Maximum character count for text snippets in search results.
   *
   * @optional
   * @default unlimited
   * @example maxSnippet: 160 // Limit to 160 characters
   * @example maxSnippet: -1 // No snippet at all
   */
  maxSnippet?: number;
}

/**
 * Custom Meta Tag
 *
 * Arbitrary meta tag for platform-specific or custom metadata.
 */
export interface MetaTag {
  /**
   * Meta tag name attribute
   *
   * @example name: "viewport"
   * @example name: "theme-color"
   */
  name?: string;

  /**
   * Meta tag property attribute (for Open Graph, etc.)
   *
   * @example property: "og:title"
   * @example property: "fb:app_id"
   */
  property?: string;

  /**
   * Meta tag content
   *
   * @required
   * @example content: "width=device-width, initial-scale=1"
   */
  content: string;

  /**
   * Element ID (for JSON-LD scripts)
   *
   * When provided with "schema-" prefix, creates a <script> tag
   * instead of a <meta> tag for structured data injection.
   *
   * @optional
   * @example id: "schema-product" // Creates <script id="schema-product" type="application/ld+json">
   */
  id?: string;
}

/**
 * Platform-Specific Behavior
 *
 * **Web (React DOM)**:
 * - Metadata injected into document.head via native DOM manipulation
 * - Updates synchronously when query data or form values change
 * - JSON-LD structured data injected as <script type="application/ld+json">
 * - All features fully supported
 *
 * **React Native**:
 * - Metadata stored but NOT rendered (no document.head in native)
 * - Graceful no-op - no errors or warnings
 * - Can be retrieved via getMetadata() for SSR or analytics
 * - Consider using platform-specific meta tags for native features (app links, etc.)
 *
 * **SSR (Server-Side Rendering)**:
 * - Metadata can be extracted server-side via getMetadata()
 * - Framework-specific integration needed (Next.js, Remix, etc.)
 * - Ensure metadata is available before first contentful paint
 *
 * @example Platform-specific metadata
 * ```tsx
 * platformOverrides: {
 *   web: {
 *     meta: {
 *       title: 'My App - Desktop Version',
 *       structuredData: { ... } // Full schema
 *     }
 *   },
 *   native: {
 *     meta: {
 *       title: 'My App', // Simplified for native
 *       // No structuredData (not applicable)
 *     }
 *   }
 * }
 * ```
 */

/**
 * Migration Notes (1.x → 2.x)
 *
 * **Breaking changes**:
 * - PageMetadataProps renamed to MetadataConfig
 *   - Migration: Use import alias: `import { MetadataConfig as PageMetadataProps } from '@gaddario98/react-pages'`
 *
 * **New fields (non-breaking)**:
 * - keywords (optional)
 * - openGraph (optional, greatly expanded from 1.x)
 * - structuredData (optional, NEW)
 * - aiHints (optional, NEW)
 * - robots (optional, expanded from disableIndexing)
 * - customMeta (optional, replaces otherMetaTags)
 *
 * **Deprecated fields**:
 * - disableIndexing → robots.noindex
 * - otherMetaTags → customMeta
 *
 * @example Before (1.x)
 * ```tsx
 * meta: {
 *   title: 'My Page',
 *   description: 'Page description',
 *   disableIndexing: true,
 *   otherMetaTags: [<meta key="..." />]
 * }
 * ```
 *
 * @example After (2.x)
 * ```tsx
 * meta: {
 *   title: 'My Page',
 *   description: 'Page description',
 *   robots: { noindex: true }, // NEW
 *   customMeta: [              // NEW
 *     { name: '...', content: '...' }
 *   ]
 * }
 * ```
 */
