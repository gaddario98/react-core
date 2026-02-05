/**
 * Sitemap & Robots.txt Generation Helpers
 *
 * Provides functions for generating sitemap.xml and robots.txt content
 * from page metadata. Useful for:
 * - Next.js App Router `app/sitemap.ts` and `app/robots.ts`
 * - Any SSR/SSG framework that needs sitemap generation
 *
 * @module integrations/sitemap
 */

// ─── Sitemap ─────────────────────────────────────────────────

export interface SitemapEntry {
  /** Absolute URL of the page */
  url: string
  /** Last modification date (ISO 8601) */
  lastModified?: string | Date
  /** Change frequency hint */
  changeFrequency?:
    | 'always'
    | 'hourly'
    | 'daily'
    | 'weekly'
    | 'monthly'
    | 'yearly'
    | 'never'
  /** Priority (0.0 to 1.0, default 0.5) */
  priority?: number
  /** Alternate language URLs */
  alternates?: Record<string, string>
}

/**
 * Generate a sitemap.xml string from a list of entries.
 *
 * @example
 * ```ts
 * // app/sitemap.ts (Next.js App Router)
 * import { generateSitemapXml } from '@/core/pages/integrations/sitemap';
 *
 * export default function sitemap() {
 *   return generateSitemapEntries([
 *     { url: 'https://example.com', changeFrequency: 'daily', priority: 1.0 },
 *     { url: 'https://example.com/about', changeFrequency: 'monthly', priority: 0.8 },
 *   ]);
 * }
 * ```
 */
export function generateSitemapXml(entries: Array<SitemapEntry>): string {
  const urls = entries.map((entry) => {
    const parts = [`    <loc>${escapeXml(entry.url)}</loc>`]

    if (entry.lastModified) {
      const dateStr =
        entry.lastModified instanceof Date
          ? entry.lastModified.toISOString()
          : entry.lastModified
      parts.push(`    <lastmod>${escapeXml(dateStr)}</lastmod>`)
    }

    if (entry.changeFrequency) {
      parts.push(`    <changefreq>${entry.changeFrequency}</changefreq>`)
    }

    if (entry.priority != null) {
      parts.push(`    <priority>${entry.priority.toFixed(1)}</priority>`)
    }

    // xhtml:link for alternates
    if (entry.alternates) {
      Object.entries(entry.alternates).forEach(([lang, href]) => {
        parts.push(
          `    <xhtml:link rel="alternate" hreflang="${escapeXml(lang)}" href="${escapeXml(href)}" />`,
        )
      })
    }

    return `  <url>\n${parts.join('\n')}\n  </url>`
  })

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...urls,
    '</urlset>',
  ].join('\n')
}

/**
 * Generate structured sitemap entries compatible with Next.js App Router `sitemap()`.
 * Returns plain objects that Next.js can serialize.
 */
export function generateSitemapEntries(
  entries: Array<SitemapEntry>,
): Array<{
  url: string
  lastModified?: Date
  changeFrequency?: string
  priority?: number
}> {
  return entries.map((entry) => ({
    url: entry.url,
    lastModified: entry.lastModified
      ? entry.lastModified instanceof Date
        ? entry.lastModified
        : new Date(entry.lastModified)
      : undefined,
    changeFrequency: entry.changeFrequency,
    priority: entry.priority,
  }))
}

// ─── Robots.txt ──────────────────────────────────────────────

export interface RobotsTxtConfig {
  /** Rules for specific or all user agents */
  rules: Array<{
    /** User agent string (e.g., "*", "Googlebot") */
    userAgent: string | Array<string>
    /** Allowed paths */
    allow?: Array<string>
    /** Disallowed paths */
    disallow?: Array<string>
    /** Crawl delay in seconds */
    crawlDelay?: number
  }>
  /** Sitemap URLs to reference */
  sitemap?: string | Array<string>
  /** Host directive */
  host?: string
}

/**
 * Generate a robots.txt string from configuration.
 *
 * @example
 * ```ts
 * // app/robots.ts (Next.js App Router)
 * import { generateRobotsTxt } from '@/core/pages/integrations/sitemap';
 *
 * export default function robots() {
 *   return generateRobotsTxt({
 *     rules: [
 *       { userAgent: '*', allow: ['/'], disallow: ['/admin'] },
 *       { userAgent: 'Googlebot', allow: ['/'] },
 *     ],
 *     sitemap: 'https://example.com/sitemap.xml',
 *   });
 * }
 * ```
 */
export function generateRobotsTxt(config: RobotsTxtConfig): string {
  const lines: Array<string> = []

  config.rules.forEach((rule) => {
    const agents = Array.isArray(rule.userAgent)
      ? rule.userAgent
      : [rule.userAgent]

    agents.forEach((agent) => {
      lines.push(`User-agent: ${agent}`)
    })

    rule.allow?.forEach((path) => {
      lines.push(`Allow: ${path}`)
    })

    rule.disallow?.forEach((path) => {
      lines.push(`Disallow: ${path}`)
    })

    if (rule.crawlDelay != null) {
      lines.push(`Crawl-delay: ${rule.crawlDelay}`)
    }

    lines.push('')
  })

  // Sitemap
  const sitemaps = config.sitemap
    ? Array.isArray(config.sitemap)
      ? config.sitemap
      : [config.sitemap]
    : []

  sitemaps.forEach((url) => {
    lines.push(`Sitemap: ${url}`)
  })

  // Host
  if (config.host) {
    lines.push(`Host: ${config.host}`)
  }

  return lines.join('\n')
}

// ─── Helpers ─────────────────────────────────────────────────

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
