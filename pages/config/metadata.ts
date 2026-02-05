/**
 * Metadata Store, DOM Application, and Server Collection
 *
 * Architecture:
 * - `createMetadataStore()` → request-scoped store (SSR-safe)
 * - `applyMetadataToDom(resolved)` → client-side DOM manipulation
 * - `collectMetadataToHtml(resolved)` → server-side HTML string collection
 * - `setMetadata / getMetadata / resetMetadata` → backward-compatible global API
 *
 * @module config/metadata
 */

import type {
  IconConfig,
  MetadataConfig,
  MetadataStore,
  OpenGraphImage,
  ResolvedMetadata,
} from './types'

// ─── Platform detection ──────────────────────────────────────

const isWeb = typeof document !== 'undefined'

// ─── Request-scoped Metadata Store ───────────────────────────

/**
 * Create a new request-scoped metadata store.
 * In SSR, each incoming request should create its own store
 * to avoid cross-request data leaks.
 * On the client, a single global store is used (see below).
 */
export function createMetadataStore(): MetadataStore {
  let metadata: ResolvedMetadata = {}

  return {
    getMetadata: () => ({ ...metadata }),
    setMetadata: (meta: ResolvedMetadata) => {
      metadata = { ...metadata, ...meta }
    },
    reset: () => {
      metadata = {}
    },
  }
}

/** Global store for client-side usage (singleton) */
const globalStore = createMetadataStore()

// ─── DOM helpers ─────────────────────────────────────────────

function updateOrCreateMeta(
  selector: string,
  content: string,
  attributes: Record<string, string> = {},
): void {
  let element = document.querySelector(selector)
  if (!element) {
    element = document.createElement('meta')
    Object.entries(attributes).forEach(([key, value]) => {
      element?.setAttribute(key, value)
    })
    document.head.appendChild(element)
  }
  element.setAttribute('content', content)
}

function updateOrCreateLink(
  selector: string,
  attributes: Record<string, string>,
): void {
  let element = document.querySelector(selector)
  if (!element) {
    element = document.createElement('link')
    document.head.appendChild(element)
  }
  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value)
  })
}

// ─── applyMetadataToDom ─────────────────────────────────────

/**
 * Apply resolved metadata to the document `<head>`.
 * Client-only: this function does nothing if `document` is not available.
 * Covers: title, description, canonical, lang, keywords, author, viewport,
 *         themeColor, Open Graph (advanced), Twitter Card, alternates/hreflang,
 *         icons, manifest, structured data JSON-LD, AI hints, robots, customMeta.
 */
export function applyMetadataToDom(resolved: ResolvedMetadata): void {
  if (!isWeb) return

  // ── Title ───────────────────────────────────────────────────
  if (resolved.title) {
    document.title = resolved.title
  }

  // ── Standard meta tags ──────────────────────────────────────
  if (resolved.description) {
    updateOrCreateMeta('meta[name="description"]', resolved.description, {
      name: 'description',
    })
  }

  if (resolved.keywords?.length) {
    updateOrCreateMeta('meta[name="keywords"]', resolved.keywords.join(', '), {
      name: 'keywords',
    })
  }

  if (resolved.author) {
    updateOrCreateMeta('meta[name="author"]', resolved.author, {
      name: 'author',
    })
  }

  if (resolved.viewport) {
    updateOrCreateMeta('meta[name="viewport"]', resolved.viewport, {
      name: 'viewport',
    })
  }

  if (resolved.themeColor) {
    updateOrCreateMeta('meta[name="theme-color"]', resolved.themeColor, {
      name: 'theme-color',
    })
  }

  // ── Canonical ───────────────────────────────────────────────
  if (resolved.canonical) {
    updateOrCreateLink('link[rel="canonical"]', {
      rel: 'canonical',
      href: resolved.canonical,
    })
  }

  // ── Language ────────────────────────────────────────────────
  if (resolved.lang) {
    document.documentElement.lang = resolved.lang
  }

  // ── Open Graph ──────────────────────────────────────────────
  if (resolved.openGraph) {
    const og = resolved.openGraph

    if (og.title) {
      updateOrCreateMeta('meta[property="og:title"]', og.title, {
        property: 'og:title',
      })
    }
    if (og.description) {
      updateOrCreateMeta('meta[property="og:description"]', og.description, {
        property: 'og:description',
      })
    }
    if (og.type) {
      updateOrCreateMeta('meta[property="og:type"]', og.type, {
        property: 'og:type',
      })
    }
    if (og.url) {
      updateOrCreateMeta('meta[property="og:url"]', og.url, {
        property: 'og:url',
      })
    }
    if (og.siteName) {
      updateOrCreateMeta('meta[property="og:site_name"]', og.siteName, {
        property: 'og:site_name',
      })
    }
    if (og.locale) {
      updateOrCreateMeta('meta[property="og:locale"]', og.locale, {
        property: 'og:locale',
      })
    }

    // OG images (advanced: multiple + alt/width/height)
    if (og.images?.length) {
      applyOgImages(og.images)
    } else if (og.image) {
      const img: OpenGraphImage =
        typeof og.image === 'string' ? { url: og.image } : og.image
      applyOgImages([img])
    }

    // OG article metadata
    if (og.article) {
      const art = og.article
      if (art.publishedTime) {
        updateOrCreateMeta(
          'meta[property="article:published_time"]',
          art.publishedTime,
          { property: 'article:published_time' },
        )
      }
      if (art.modifiedTime) {
        updateOrCreateMeta(
          'meta[property="article:modified_time"]',
          art.modifiedTime,
          { property: 'article:modified_time' },
        )
      }
      if (art.expirationTime) {
        updateOrCreateMeta(
          'meta[property="article:expiration_time"]',
          art.expirationTime,
          { property: 'article:expiration_time' },
        )
      }
      if (art.section) {
        updateOrCreateMeta(
          'meta[property="article:section"]',
          art.section,
          { property: 'article:section' },
        )
      }
      const authors = Array.isArray(art.author) ? art.author : art.author ? [art.author] : []
      authors.forEach((author, i) => {
        updateOrCreateMeta(
          `meta[property="article:author"][data-index="${i}"]`,
          author,
          { property: 'article:author', 'data-index': String(i) },
        )
      })
      art.tags?.forEach((tag, i) => {
        updateOrCreateMeta(
          `meta[property="article:tag"][data-index="${i}"]`,
          tag,
          { property: 'article:tag', 'data-index': String(i) },
        )
      })
    }
  }

  // ── Twitter Card ────────────────────────────────────────────
  if (resolved.twitter) {
    const tw = resolved.twitter
    if (tw.card) {
      updateOrCreateMeta('meta[name="twitter:card"]', tw.card, {
        name: 'twitter:card',
      })
    }
    if (tw.site) {
      updateOrCreateMeta('meta[name="twitter:site"]', tw.site, {
        name: 'twitter:site',
      })
    }
    if (tw.creator) {
      updateOrCreateMeta('meta[name="twitter:creator"]', tw.creator, {
        name: 'twitter:creator',
      })
    }
    if (tw.title) {
      updateOrCreateMeta('meta[name="twitter:title"]', tw.title, {
        name: 'twitter:title',
      })
    }
    if (tw.description) {
      updateOrCreateMeta('meta[name="twitter:description"]', tw.description, {
        name: 'twitter:description',
      })
    }
    if (tw.image) {
      updateOrCreateMeta('meta[name="twitter:image"]', tw.image, {
        name: 'twitter:image',
      })
    }
    if (tw.imageAlt) {
      updateOrCreateMeta('meta[name="twitter:image:alt"]', tw.imageAlt, {
        name: 'twitter:image:alt',
      })
    }
  }

  // ── Alternates / hreflang ───────────────────────────────────
  if (resolved.alternates) {
    const alt = resolved.alternates

    if (alt.canonical) {
      updateOrCreateLink('link[rel="canonical"]', {
        rel: 'canonical',
        href: alt.canonical,
      })
    }

    if (alt.languages) {
      // Remove old hreflang links first
      document
        .querySelectorAll('link[rel="alternate"][hreflang]')
        .forEach((el) => el.remove())

      Object.entries(alt.languages).forEach(([locale, url]) => {
        const link = document.createElement('link')
        link.rel = 'alternate'
        link.hreflang = locale
        link.href = url
        document.head.appendChild(link)
      })
    }

    if (alt.media) {
      Object.entries(alt.media).forEach(([mediaQuery, url]) => {
        updateOrCreateLink(
          `link[rel="alternate"][media="${mediaQuery}"]`,
          { rel: 'alternate', media: mediaQuery, href: url },
        )
      })
    }

    if (alt.types) {
      Object.entries(alt.types).forEach(([mimeType, items]) => {
        items.forEach((item, i) => {
          const selector = `link[rel="alternate"][type="${mimeType}"][data-index="${i}"]`
          const attrs: Record<string, string> = {
            rel: 'alternate',
            type: mimeType,
            href: item.url,
            'data-index': String(i),
          }
          if (item.title) attrs.title = item.title
          updateOrCreateLink(selector, attrs)
        })
      })
    }
  }

  // ── Icons ───────────────────────────────────────────────────
  if (resolved.icons) {
    applyIcons(resolved.icons.icon, 'icon')
    applyIcons(resolved.icons.apple, 'apple-touch-icon')
    if (resolved.icons.shortcut) {
      updateOrCreateLink('link[rel="shortcut icon"]', {
        rel: 'shortcut icon',
        href: resolved.icons.shortcut,
      })
    }
  }

  // ── Manifest ────────────────────────────────────────────────
  if (resolved.manifest) {
    updateOrCreateLink('link[rel="manifest"]', {
      rel: 'manifest',
      href: resolved.manifest,
    })
  }

  // ── Structured data JSON-LD ─────────────────────────────────
  if (resolved.structuredData) {
    const schemaScriptId = 'react-pages-schema-org'
    let scriptElement = document.querySelector(
      `script[id="${schemaScriptId}"]`,
    ) as HTMLScriptElement

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!scriptElement) {
      scriptElement = document.createElement('script')
      scriptElement.type = 'application/ld+json'
      scriptElement.id = schemaScriptId
      document.head.appendChild(scriptElement)
    }

    scriptElement.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': resolved.structuredData.type,
      ...resolved.structuredData.schema,
    })
  }

  // ── AI crawler hints ────────────────────────────────────────
  if (resolved.aiHints) {
    const hints = resolved.aiHints
    if (hints.contentClassification) {
      updateOrCreateMeta(
        'meta[name="ai-content-classification"]',
        hints.contentClassification,
        { name: 'ai-content-classification' },
      )
    }
    if (hints.modelHints?.length) {
      updateOrCreateMeta(
        'meta[name="ai-model-hints"]',
        hints.modelHints.join(', '),
        { name: 'ai-model-hints' },
      )
    }
    if (hints.contextualInfo) {
      updateOrCreateMeta(
        'meta[name="ai-context"]',
        hints.contextualInfo,
        { name: 'ai-context' },
      )
    }
    if (hints.excludeFromIndexing) {
      updateOrCreateMeta(
        'meta[name="ai-exclude-from-indexing"]',
        'true',
        { name: 'ai-exclude-from-indexing' },
      )
    }
  }

  // ── Robots ──────────────────────────────────────────────────
  if (resolved.robots || resolved.disableIndexing) {
    const robots = resolved.robots ?? {}
    const noindex = resolved.disableIndexing || robots.noindex
    const nofollow = resolved.disableIndexing || robots.nofollow

    const robotsValue = [
      noindex ? 'noindex' : 'index',
      nofollow ? 'nofollow' : 'follow',
      robots.noarchive && 'noarchive',
      robots.nosnippet && 'nosnippet',
      robots.maxImagePreview && `max-image-preview:${robots.maxImagePreview}`,
      robots.maxSnippet != null && `max-snippet:${robots.maxSnippet}`,
    ]
      .filter(Boolean)
      .join(', ')

    updateOrCreateMeta('meta[name="robots"]', robotsValue, {
      name: 'robots',
    })
  }

  // ── Custom meta tags ────────────────────────────────────────
  if (resolved.customMeta?.length) {
    resolved.customMeta.forEach((tag) => {
      const selector = tag.id
        ? `meta[id="${tag.id}"]`
        : tag.name
          ? `meta[name="${tag.name}"]`
          : tag.property
            ? `meta[property="${tag.property}"]`
            : `meta[http-equiv="${tag.httpEquiv}"]`

      const attributes: Record<string, string> = tag.name
        ? { name: tag.name }
        : tag.property
          ? { property: tag.property }
          : tag.httpEquiv
            ? { 'http-equiv': tag.httpEquiv }
            : {}

      if (tag.id) attributes.id = tag.id

      updateOrCreateMeta(selector, tag.content, attributes)
    })
  }
}

/** Apply OG images to the DOM (supports multiple images with alt/width/height) */
function applyOgImages(images: Array<OpenGraphImage>): void {
  // Remove existing OG image tags to avoid stale data
  document
    .querySelectorAll(
      'meta[property="og:image"], meta[property="og:image:alt"], meta[property="og:image:width"], meta[property="og:image:height"], meta[property="og:image:type"]',
    )
    .forEach((el) => el.remove())

  images.forEach((img) => {
    const ogImg = document.createElement('meta')
    ogImg.setAttribute('property', 'og:image')
    ogImg.setAttribute('content', img.url)
    document.head.appendChild(ogImg)

    if (img.alt) {
      const altMeta = document.createElement('meta')
      altMeta.setAttribute('property', 'og:image:alt')
      altMeta.setAttribute('content', img.alt)
      document.head.appendChild(altMeta)
    }
    if (img.width) {
      const wMeta = document.createElement('meta')
      wMeta.setAttribute('property', 'og:image:width')
      wMeta.setAttribute('content', String(img.width))
      document.head.appendChild(wMeta)
    }
    if (img.height) {
      const hMeta = document.createElement('meta')
      hMeta.setAttribute('property', 'og:image:height')
      hMeta.setAttribute('content', String(img.height))
      document.head.appendChild(hMeta)
    }
    if (img.type) {
      const tMeta = document.createElement('meta')
      tMeta.setAttribute('property', 'og:image:type')
      tMeta.setAttribute('content', img.type)
      document.head.appendChild(tMeta)
    }
  })
}

/** Apply icon link tags to the DOM */
function applyIcons(
  icons: string | IconConfig | Array<IconConfig> | undefined,
  rel: string,
): void {
  if (!icons) return

  const iconList: Array<IconConfig> =
    typeof icons === 'string'
      ? [{ url: icons }]
      : Array.isArray(icons)
        ? icons
        : [icons]

  // Remove old icons of this rel
  document.querySelectorAll(`link[rel="${rel}"]`).forEach((el) => el.remove())

  iconList.forEach((icon) => {
    const link = document.createElement('link')
    link.rel = rel
    link.href = icon.url
    if (icon.type) link.type = icon.type
    if (icon.sizes) link.setAttribute('sizes', icon.sizes)
    if (icon.color) link.setAttribute('color', icon.color)
    document.head.appendChild(link)
  })
}

// ─── collectMetadataToHtml (SSR) ─────────────────────────────

/**
 * Collect resolved metadata as an HTML string for SSR injection into `<head>`.
 * Pure function — no DOM, no side effects.
 */
export function collectMetadataToHtml(resolved: ResolvedMetadata): string {
  const tags: Array<string> = []

  if (resolved.title) {
    tags.push(`<title>${escapeHtml(resolved.title)}</title>`)
  }
  if (resolved.description) {
    tags.push(
      `<meta name="description" content="${escapeAttr(resolved.description)}" />`,
    )
  }
  if (resolved.canonical) {
    tags.push(`<link rel="canonical" href="${escapeAttr(resolved.canonical)}" />`)
  }
  if (resolved.keywords?.length) {
    tags.push(
      `<meta name="keywords" content="${escapeAttr(resolved.keywords.join(', '))}" />`,
    )
  }
  if (resolved.author) {
    tags.push(
      `<meta name="author" content="${escapeAttr(resolved.author)}" />`,
    )
  }
  if (resolved.viewport) {
    tags.push(
      `<meta name="viewport" content="${escapeAttr(resolved.viewport)}" />`,
    )
  }
  if (resolved.themeColor) {
    tags.push(
      `<meta name="theme-color" content="${escapeAttr(resolved.themeColor)}" />`,
    )
  }

  // Open Graph
  if (resolved.openGraph) {
    const og = resolved.openGraph
    if (og.type) tags.push(ogMeta('og:type', og.type))
    if (og.title) tags.push(ogMeta('og:title', og.title))
    if (og.description) tags.push(ogMeta('og:description', og.description))
    if (og.url) tags.push(ogMeta('og:url', og.url))
    if (og.siteName) tags.push(ogMeta('og:site_name', og.siteName))
    if (og.locale) tags.push(ogMeta('og:locale', og.locale))

    const images = og.images ?? (og.image ? [typeof og.image === 'string' ? { url: og.image } : og.image] : [])
    images.forEach((img) => {
      tags.push(ogMeta('og:image', img.url))
      if (img.alt) tags.push(ogMeta('og:image:alt', img.alt))
      if (img.width) tags.push(ogMeta('og:image:width', String(img.width)))
      if (img.height) tags.push(ogMeta('og:image:height', String(img.height)))
      if (img.type) tags.push(ogMeta('og:image:type', img.type))
    })

    if (og.article) {
      const art = og.article
      if (art.publishedTime) tags.push(ogMeta('article:published_time', art.publishedTime))
      if (art.modifiedTime) tags.push(ogMeta('article:modified_time', art.modifiedTime))
      if (art.section) tags.push(ogMeta('article:section', art.section))
      const authors = Array.isArray(art.author) ? art.author : art.author ? [art.author] : []
      authors.forEach((a) => tags.push(ogMeta('article:author', a)))
      art.tags?.forEach((t) => tags.push(ogMeta('article:tag', t)))
    }
  }

  // Twitter Card
  if (resolved.twitter) {
    const tw = resolved.twitter
    if (tw.card) tags.push(nameMeta('twitter:card', tw.card))
    if (tw.site) tags.push(nameMeta('twitter:site', tw.site))
    if (tw.creator) tags.push(nameMeta('twitter:creator', tw.creator))
    if (tw.title) tags.push(nameMeta('twitter:title', tw.title))
    if (tw.description) tags.push(nameMeta('twitter:description', tw.description))
    if (tw.image) tags.push(nameMeta('twitter:image', tw.image))
    if (tw.imageAlt) tags.push(nameMeta('twitter:image:alt', tw.imageAlt))
  }

  // Alternates / hreflang
  if (resolved.alternates?.languages) {
    Object.entries(resolved.alternates.languages).forEach(([locale, url]) => {
      tags.push(`<link rel="alternate" hreflang="${escapeAttr(locale)}" href="${escapeAttr(url)}" />`)
    })
  }

  // Icons
  if (resolved.icons) {
    collectIconTags(resolved.icons.icon, 'icon', tags)
    collectIconTags(resolved.icons.apple, 'apple-touch-icon', tags)
    if (resolved.icons.shortcut) {
      tags.push(`<link rel="shortcut icon" href="${escapeAttr(resolved.icons.shortcut)}" />`)
    }
  }

  // Manifest
  if (resolved.manifest) {
    tags.push(`<link rel="manifest" href="${escapeAttr(resolved.manifest)}" />`)
  }

  // Structured data JSON-LD
  if (resolved.structuredData) {
    const jsonLd = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': resolved.structuredData.type,
      ...resolved.structuredData.schema,
    })
    tags.push(`<script type="application/ld+json">${jsonLd}</script>`)
  }

  // Robots
  if (resolved.robots || resolved.disableIndexing) {
    const robots = resolved.robots ?? {}
    const noindex = resolved.disableIndexing || robots.noindex
    const nofollow = resolved.disableIndexing || robots.nofollow
    const robotsValue = [
      noindex ? 'noindex' : 'index',
      nofollow ? 'nofollow' : 'follow',
      robots.noarchive && 'noarchive',
      robots.nosnippet && 'nosnippet',
      robots.maxImagePreview && `max-image-preview:${robots.maxImagePreview}`,
      robots.maxSnippet != null && `max-snippet:${robots.maxSnippet}`,
    ]
      .filter(Boolean)
      .join(', ')
    tags.push(`<meta name="robots" content="${escapeAttr(robotsValue)}" />`)
  }

  // Custom meta tags
  resolved.customMeta?.forEach((tag) => {
    if (tag.property) {
      tags.push(ogMeta(tag.property, tag.content))
    } else if (tag.name) {
      tags.push(nameMeta(tag.name, tag.content))
    } else if (tag.httpEquiv) {
      tags.push(
        `<meta http-equiv="${escapeAttr(tag.httpEquiv)}" content="${escapeAttr(tag.content)}" />`,
      )
    }
  })

  return tags.join('\n')
}

function collectIconTags(
  icons: string | IconConfig | Array<IconConfig> | undefined,
  rel: string,
  tags: Array<string>,
): void {
  if (!icons) return
  const iconList: Array<IconConfig> =
    typeof icons === 'string'
      ? [{ url: icons }]
      : Array.isArray(icons)
        ? icons
        : [icons]

  iconList.forEach((icon) => {
    let tag = `<link rel="${rel}" href="${escapeAttr(icon.url)}"`
    if (icon.type) tag += ` type="${escapeAttr(icon.type)}"`
    if (icon.sizes) tag += ` sizes="${escapeAttr(icon.sizes)}"`
    if (icon.color) tag += ` color="${escapeAttr(icon.color)}"`
    tag += ' />'
    tags.push(tag)
  })
}

// ─── HTML helpers ────────────────────────────────────────────

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function escapeAttr(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function ogMeta(property: string, content: string): string {
  return `<meta property="${escapeAttr(property)}" content="${escapeAttr(content)}" />`
}

function nameMeta(name: string, content: string): string {
  return `<meta name="${escapeAttr(name)}" content="${escapeAttr(content)}" />`
}

// ─── Backward-compatible global API ──────────────────────────
// These wrap the global store + applyMetadataToDom for existing consumers.

/**
 * Apply metadata configuration to the page.
 * Merges with existing metadata in the global store.
 * On web: also applies changes to the DOM.
 *
 * @deprecated Prefer using `MetadataStoreProvider` + `resolveMetadata` + `applyMetadataToDom`
 *             for SSR-safe, request-scoped metadata management.
 */
export const setMetadata = (config: MetadataConfig): void => {
  // For backward compat, treat the config as already resolved (strings only).
  // Evaluator functions should have been resolved by useMetadata before calling this.
  const resolved = config as unknown as ResolvedMetadata
  globalStore.setMetadata(resolved)

  if (isWeb) {
    applyMetadataToDom(resolved)
  }
}

/**
 * Get current metadata from the global store.
 * @deprecated Prefer using `MetadataStoreProvider` context in SSR.
 */
export const getMetadata = (): MetadataConfig => {
  return globalStore.getMetadata() as unknown as MetadataConfig
}

/**
 * Reset all metadata in the global store.
 * @deprecated Prefer using `MetadataStoreProvider` context in SSR.
 */
export const resetMetadata = (): void => {
  globalStore.reset()
}
