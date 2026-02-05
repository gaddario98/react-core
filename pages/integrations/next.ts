/**
 * Next.js Integration Helpers
 *
 * Provides helpers for using the pages metadata system with Next.js:
 * - `toNextMetadata()` — App Router (`generateMetadata`)
 * - `NextHeadFromMetadata` — Pages Router (`next/head`)
 *
 * @module integrations/next
 */

import type { OpenGraphImage, ResolvedMetadata } from '../config/types'

// ─── Types matching Next.js Metadata API ─────────────────────

/**
 * Subset of Next.js Metadata type that we map to.
 * Consumers can use this directly as the return type of `generateMetadata`.
 */
export interface NextMetadata {
  title?: string
  description?: string
  keywords?: Array<string>
  authors?: Array<{ name?: string; url?: string }>
  viewport?: string
  themeColor?: string
  robots?: string | {
    index?: boolean
    follow?: boolean
    noarchive?: boolean
    nosnippet?: boolean
    'max-image-preview'?: 'none' | 'standard' | 'large'
    'max-snippet'?: number
  }
  alternates?: {
    canonical?: string
    languages?: Record<string, string>
    media?: Record<string, string>
    types?: Record<string, string>
  }
  openGraph?: {
    title?: string
    description?: string
    url?: string
    siteName?: string
    locale?: string
    type?: string
    images?: Array<{
      url: string
      alt?: string
      width?: number
      height?: number
      type?: string
    }>
    publishedTime?: string
    modifiedTime?: string
    authors?: Array<string>
    section?: string
    tags?: Array<string>
  }
  twitter?: {
    card?: 'summary' | 'summary_large_image' | 'app' | 'player'
    site?: string
    creator?: string
    title?: string
    description?: string
    images?: Array<string | { url: string; alt?: string }>
  }
  icons?: {
    icon?: Array<{ url: string; type?: string; sizes?: string }>
    apple?: Array<{ url: string; type?: string; sizes?: string }>
    shortcut?: string
  }
  manifest?: string
  other?: Record<string, string>
}

// ─── toNextMetadata (App Router) ─────────────────────────────

/**
 * Convert ResolvedMetadata into a Next.js Metadata object
 * for use with App Router's `generateMetadata` or `metadata` export.
 *
 * @example
 * ```ts
 * // app/page.tsx
 * import { resolveMetadata, toNextMetadata } from '@/core/pages';
 *
 * export async function generateMetadata() {
 *   const resolved = resolveMetadata(pageConfig.meta, context);
 *   return toNextMetadata(resolved);
 * }
 * ```
 */
export function toNextMetadata(resolved: ResolvedMetadata): NextMetadata {
  const result: NextMetadata = {}

  // Basic
  if (resolved.title) result.title = resolved.title
  if (resolved.description) result.description = resolved.description
  if (resolved.keywords?.length) result.keywords = resolved.keywords
  if (resolved.author) result.authors = [{ name: resolved.author }]
  if (resolved.viewport) result.viewport = resolved.viewport
  if (resolved.themeColor) result.themeColor = resolved.themeColor

  // Robots
  if (resolved.robots || resolved.disableIndexing) {
    const r = resolved.robots ?? {}
    result.robots = {
      index: !(resolved.disableIndexing || r.noindex),
      follow: !(resolved.disableIndexing || r.nofollow),
      noarchive: r.noarchive,
      nosnippet: r.nosnippet,
      'max-image-preview': r.maxImagePreview,
      'max-snippet': r.maxSnippet,
    }
  }

  // Alternates
  if (resolved.canonical || resolved.alternates) {
    result.alternates = {
      canonical: resolved.alternates?.canonical ?? resolved.canonical,
      languages: resolved.alternates?.languages,
      media: resolved.alternates?.media,
    }
  }

  // Open Graph
  if (resolved.openGraph) {
    const og = resolved.openGraph
    const nextOg: NextMetadata['openGraph'] = {}

    if (og.title) nextOg.title = og.title
    if (og.description) nextOg.description = og.description
    if (og.url) nextOg.url = og.url
    if (og.siteName) nextOg.siteName = og.siteName
    if (og.locale) nextOg.locale = og.locale
    if (og.type) nextOg.type = og.type

    // Images
    const images = normalizeOgImages(og.images, og.image)
    if (images.length) {
      nextOg.images = images.map((img) => ({
        url: img.url,
        alt: img.alt,
        width: img.width,
        height: img.height,
        type: img.type,
      }))
    }

    // Article metadata
    if (og.article) {
      if (og.article.publishedTime) nextOg.publishedTime = og.article.publishedTime
      if (og.article.modifiedTime) nextOg.modifiedTime = og.article.modifiedTime
      if (og.article.section) nextOg.section = og.article.section
      if (og.article.tags) nextOg.tags = og.article.tags
      if (og.article.author) {
        nextOg.authors = Array.isArray(og.article.author)
          ? og.article.author
          : [og.article.author]
      }
    }

    result.openGraph = nextOg
  }

  // Twitter
  if (resolved.twitter) {
    const tw = resolved.twitter
    const nextTw: NextMetadata['twitter'] = {}

    if (tw.card) nextTw.card = tw.card
    if (tw.site) nextTw.site = tw.site
    if (tw.creator) nextTw.creator = tw.creator
    if (tw.title) nextTw.title = tw.title
    if (tw.description) nextTw.description = tw.description
    if (tw.image) {
      nextTw.images = tw.imageAlt
        ? [{ url: tw.image, alt: tw.imageAlt }]
        : [tw.image]
    }

    result.twitter = nextTw
  }

  // Icons
  if (resolved.icons) {
    const icons = resolved.icons
    const nextIcons: NextMetadata['icons'] = {}

    if (icons.icon) {
      const list = typeof icons.icon === 'string'
        ? [{ url: icons.icon }]
        : Array.isArray(icons.icon)
          ? icons.icon
          : [icons.icon]
      nextIcons.icon = list.map((i) => ({
        url: i.url,
        type: i.type,
        sizes: i.sizes,
      }))
    }
    if (icons.apple) {
      const list = typeof icons.apple === 'string'
        ? [{ url: icons.apple }]
        : Array.isArray(icons.apple)
          ? icons.apple
          : [icons.apple]
      nextIcons.apple = list.map((i) => ({
        url: i.url,
        type: i.type,
        sizes: i.sizes,
      }))
    }
    if (icons.shortcut) nextIcons.shortcut = icons.shortcut

    result.icons = nextIcons
  }

  // Manifest
  if (resolved.manifest) result.manifest = resolved.manifest

  return result
}

// ─── toNextHeadTags (Pages Router) ───────────────────────────

/**
 * Convert ResolvedMetadata into an array of React-compatible head tag descriptors
 * for use with `next/head` in the Pages Router.
 *
 * @example
 * ```tsx
 * // pages/index.tsx
 * import Head from 'next/head';
 * import { toNextHeadTags, resolveMetadata } from '@/core/pages';
 *
 * export default function Page() {
 *   const resolved = resolveMetadata(pageConfig.meta, context);
 *   const tags = toNextHeadTags(resolved);
 *   return (
 *     <>
 *       <Head>{tags.map(t => t.html)}</Head>
 *       <PageContent />
 *     </>
 *   );
 * }
 * ```
 *
 * Each tag has a `key` (for React list rendering) and `html` (raw HTML string).
 * For a JSX-based approach, use `collectMetadataToHtml` and inject via dangerouslySetInnerHTML.
 */
export interface HeadTag {
  key: string
  tag: string
  attributes: Record<string, string>
  content?: string
}

export function toNextHeadTags(resolved: ResolvedMetadata): Array<HeadTag> {
  const tags: Array<HeadTag> = []

  if (resolved.title) {
    tags.push({ key: 'title', tag: 'title', attributes: {}, content: resolved.title })
  }
  if (resolved.description) {
    tags.push({
      key: 'desc',
      tag: 'meta',
      attributes: { name: 'description', content: resolved.description },
    })
  }
  if (resolved.canonical) {
    tags.push({
      key: 'canonical',
      tag: 'link',
      attributes: { rel: 'canonical', href: resolved.canonical },
    })
  }
  if (resolved.keywords?.length) {
    tags.push({
      key: 'keywords',
      tag: 'meta',
      attributes: { name: 'keywords', content: resolved.keywords.join(', ') },
    })
  }
  if (resolved.author) {
    tags.push({
      key: 'author',
      tag: 'meta',
      attributes: { name: 'author', content: resolved.author },
    })
  }
  if (resolved.viewport) {
    tags.push({
      key: 'viewport',
      tag: 'meta',
      attributes: { name: 'viewport', content: resolved.viewport },
    })
  }
  if (resolved.themeColor) {
    tags.push({
      key: 'theme-color',
      tag: 'meta',
      attributes: { name: 'theme-color', content: resolved.themeColor },
    })
  }

  // OG
  if (resolved.openGraph) {
    const og = resolved.openGraph
    if (og.type) tags.push({ key: 'og:type', tag: 'meta', attributes: { property: 'og:type', content: og.type } })
    if (og.title) tags.push({ key: 'og:title', tag: 'meta', attributes: { property: 'og:title', content: og.title } })
    if (og.description) tags.push({ key: 'og:desc', tag: 'meta', attributes: { property: 'og:description', content: og.description } })
    if (og.url) tags.push({ key: 'og:url', tag: 'meta', attributes: { property: 'og:url', content: og.url } })
    if (og.siteName) tags.push({ key: 'og:site', tag: 'meta', attributes: { property: 'og:site_name', content: og.siteName } })
    if (og.locale) tags.push({ key: 'og:locale', tag: 'meta', attributes: { property: 'og:locale', content: og.locale } })

    const images = normalizeOgImages(og.images, og.image)
    images.forEach((img, i) => {
      tags.push({ key: `og:img:${i}`, tag: 'meta', attributes: { property: 'og:image', content: img.url } })
      if (img.alt) tags.push({ key: `og:img:alt:${i}`, tag: 'meta', attributes: { property: 'og:image:alt', content: img.alt } })
      if (img.width) tags.push({ key: `og:img:w:${i}`, tag: 'meta', attributes: { property: 'og:image:width', content: String(img.width) } })
      if (img.height) tags.push({ key: `og:img:h:${i}`, tag: 'meta', attributes: { property: 'og:image:height', content: String(img.height) } })
    })
  }

  // Twitter
  if (resolved.twitter) {
    const tw = resolved.twitter
    if (tw.card) tags.push({ key: 'tw:card', tag: 'meta', attributes: { name: 'twitter:card', content: tw.card } })
    if (tw.site) tags.push({ key: 'tw:site', tag: 'meta', attributes: { name: 'twitter:site', content: tw.site } })
    if (tw.creator) tags.push({ key: 'tw:creator', tag: 'meta', attributes: { name: 'twitter:creator', content: tw.creator } })
    if (tw.title) tags.push({ key: 'tw:title', tag: 'meta', attributes: { name: 'twitter:title', content: tw.title } })
    if (tw.description) tags.push({ key: 'tw:desc', tag: 'meta', attributes: { name: 'twitter:description', content: tw.description } })
    if (tw.image) tags.push({ key: 'tw:img', tag: 'meta', attributes: { name: 'twitter:image', content: tw.image } })
    if (tw.imageAlt) tags.push({ key: 'tw:img:alt', tag: 'meta', attributes: { name: 'twitter:image:alt', content: tw.imageAlt } })
  }

  // Hreflang
  if (resolved.alternates?.languages) {
    Object.entries(resolved.alternates.languages).forEach(([locale, url]) => {
      tags.push({
        key: `hreflang:${locale}`,
        tag: 'link',
        attributes: { rel: 'alternate', hreflang: locale, href: url },
      })
    })
  }

  // Manifest
  if (resolved.manifest) {
    tags.push({ key: 'manifest', tag: 'link', attributes: { rel: 'manifest', href: resolved.manifest } })
  }

  return tags
}

// ─── Helpers ─────────────────────────────────────────────────

function normalizeOgImages(
  images?: Array<OpenGraphImage>,
  singleImage?: string | OpenGraphImage,
): Array<OpenGraphImage> {
  if (images?.length) return images
  if (!singleImage) return []
  return [typeof singleImage === 'string' ? { url: singleImage } : singleImage]
}
