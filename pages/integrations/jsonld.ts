/**
 * JSON-LD Structured Data Builders
 *
 * Helpers to build valid schema.org JSON-LD objects for common types.
 * These can be passed to MetadataConfig.structuredData.schema or used
 * directly in a <script type="application/ld+json"> tag.
 *
 * @module integrations/jsonld
 */

// ─── Organization ────────────────────────────────────────────

export interface OrganizationJsonLdInput {
  name: string
  url: string
  logo?: string
  description?: string
  sameAs?: Array<string>
  contactPoint?: {
    telephone?: string
    contactType?: string
    email?: string
    areaServed?: string | Array<string>
    availableLanguage?: string | Array<string>
  }
}

export function buildOrganizationJsonLd(
  input: OrganizationJsonLdInput,
): Record<string, unknown> {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: input.name,
    url: input.url,
  }

  if (input.logo) schema.logo = input.logo
  if (input.description) schema.description = input.description
  if (input.sameAs?.length) schema.sameAs = input.sameAs

  if (input.contactPoint) {
    const cp: Record<string, unknown> = {
      '@type': 'ContactPoint',
    }
    if (input.contactPoint.telephone) cp.telephone = input.contactPoint.telephone
    if (input.contactPoint.contactType) cp.contactType = input.contactPoint.contactType
    if (input.contactPoint.email) cp.email = input.contactPoint.email
    if (input.contactPoint.areaServed) cp.areaServed = input.contactPoint.areaServed
    if (input.contactPoint.availableLanguage) cp.availableLanguage = input.contactPoint.availableLanguage
    schema.contactPoint = cp
  }

  return schema
}

// ─── WebSite ─────────────────────────────────────────────────

export interface WebSiteJsonLdInput {
  name: string
  url: string
  description?: string
  /** Enable sitelinks searchbox */
  potentialAction?: {
    /** URL template for search, e.g., "https://example.com/search?q={search_term_string}" */
    target: string
    queryInput: string
  }
}

export function buildWebSiteJsonLd(
  input: WebSiteJsonLdInput,
): Record<string, unknown> {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: input.name,
    url: input.url,
  }

  if (input.description) schema.description = input.description

  if (input.potentialAction) {
    schema.potentialAction = {
      '@type': 'SearchAction',
      target: input.potentialAction.target,
      'query-input': input.potentialAction.queryInput,
    }
  }

  return schema
}

// ─── BreadcrumbList ──────────────────────────────────────────

export interface BreadcrumbItem {
  name: string
  url: string
}

export function buildBreadcrumbListJsonLd(
  items: Array<BreadcrumbItem>,
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

// ─── Article ─────────────────────────────────────────────────

export interface ArticleJsonLdInput {
  headline: string
  description?: string
  image?: string | Array<string>
  datePublished?: string
  dateModified?: string
  author?: {
    name: string
    url?: string
  } | Array<{
    name: string
    url?: string
  }>
  publisher?: {
    name: string
    logo?: string
  }
  url?: string
  mainEntityOfPage?: string
}

export function buildArticleJsonLd(
  input: ArticleJsonLdInput,
): Record<string, unknown> {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: input.headline,
  }

  if (input.description) schema.description = input.description

  if (input.image) {
    schema.image = Array.isArray(input.image) ? input.image : [input.image]
  }

  if (input.datePublished) schema.datePublished = input.datePublished
  if (input.dateModified) schema.dateModified = input.dateModified

  if (input.author) {
    const authors = Array.isArray(input.author) ? input.author : [input.author]
    schema.author = authors.map((a) => ({
      '@type': 'Person',
      name: a.name,
      ...(a.url ? { url: a.url } : {}),
    }))
  }

  if (input.publisher) {
    const pub: Record<string, unknown> = {
      '@type': 'Organization',
      name: input.publisher.name,
    }
    if (input.publisher.logo) {
      pub.logo = {
        '@type': 'ImageObject',
        url: input.publisher.logo,
      }
    }
    schema.publisher = pub
  }

  if (input.url) schema.url = input.url
  if (input.mainEntityOfPage) {
    schema.mainEntityOfPage = {
      '@type': 'WebPage',
      '@id': input.mainEntityOfPage,
    }
  }

  return schema
}

// ─── FAQPage ─────────────────────────────────────────────────

export interface FAQItem {
  question: string
  answer: string
}

export function buildFAQPageJsonLd(
  items: Array<FAQItem>,
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  }
}

// ─── Product ─────────────────────────────────────────────────

export interface ProductJsonLdInput {
  name: string
  description?: string
  image?: string | Array<string>
  brand?: string
  sku?: string
  offers?: {
    price: number
    priceCurrency: string
    availability?:
      | 'InStock'
      | 'OutOfStock'
      | 'PreOrder'
      | 'SoldOut'
      | 'BackOrder'
    url?: string
    priceValidUntil?: string
  }
  aggregateRating?: {
    ratingValue: number
    reviewCount: number
    bestRating?: number
    worstRating?: number
  }
}

export function buildProductJsonLd(
  input: ProductJsonLdInput,
): Record<string, unknown> {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: input.name,
  }

  if (input.description) schema.description = input.description
  if (input.image) {
    schema.image = Array.isArray(input.image) ? input.image : [input.image]
  }
  if (input.brand) {
    schema.brand = { '@type': 'Brand', name: input.brand }
  }
  if (input.sku) schema.sku = input.sku

  if (input.offers) {
    const offer: Record<string, unknown> = {
      '@type': 'Offer',
      price: input.offers.price,
      priceCurrency: input.offers.priceCurrency,
    }
    if (input.offers.availability) {
      offer.availability = `https://schema.org/${input.offers.availability}`
    }
    if (input.offers.url) offer.url = input.offers.url
    if (input.offers.priceValidUntil) offer.priceValidUntil = input.offers.priceValidUntil
    schema.offers = offer
  }

  if (input.aggregateRating) {
    const rating: Record<string, unknown> = {
      '@type': 'AggregateRating',
      ratingValue: input.aggregateRating.ratingValue,
      reviewCount: input.aggregateRating.reviewCount,
    }
    if (input.aggregateRating.bestRating != null) rating.bestRating = input.aggregateRating.bestRating
    if (input.aggregateRating.worstRating != null) rating.worstRating = input.aggregateRating.worstRating
    schema.aggregateRating = rating
  }

  return schema
}
