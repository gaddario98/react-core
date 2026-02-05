/**
 * resolveMetadata — Pure function that evaluates dynamic MetadataConfig into ResolvedMetadata.
 *
 * All evaluator functions (title, description, og fields, twitter fields, etc.)
 * are called with the provided context. The result is a plain object with no functions.
 *
 * This function has NO side effects: no DOM, no global state.
 *
 * @module config/resolveMetadata
 */

import type { FieldValues } from '@gaddario98/react-form'
import type { QueriesArray } from '@gaddario98/react-queries'
import type {
  MetadataConfig,
  MetadataEvaluatorContext,
  OpenGraphImage,
  ResolvedMetadata,
} from './types'

/**
 * Safely evaluate a value that may be a function or a plain value.
 */
function evaluate<T, F extends FieldValues, Q extends QueriesArray>(
  value: T | ((ctx: MetadataEvaluatorContext<F, Q>) => T) | undefined,
  ctx: MetadataEvaluatorContext<F, Q>,
): T | undefined {
  if (value === undefined || value === null) return undefined
  if (typeof value === 'function') {
    return (value as (ctx: MetadataEvaluatorContext<F, Q>) => T)(ctx)
  }
  return value as T
}

/**
 * Resolve a MetadataConfig (which may contain evaluator functions)
 * into a plain ResolvedMetadata object.
 *
 * @param meta - The metadata configuration (static or with dynamic functions)
 * @param ctx  - The context providing get/set accessors for queries, form, state
 * @returns Fully resolved metadata with all functions evaluated
 */
export function resolveMetadata<
  F extends FieldValues = FieldValues,
  Q extends QueriesArray = QueriesArray,
>(
  meta: MetadataConfig<F, Q>,
  ctx: MetadataEvaluatorContext<F, Q>,
): ResolvedMetadata {
  const resolved: ResolvedMetadata = {}

  // ── Basic fields ────────────────────────────────────────────
  resolved.title = evaluate(meta.title, ctx)
  resolved.description = evaluate(meta.description, ctx)
  resolved.canonical = evaluate(meta.canonical, ctx)
  // Unify lang / documentLang: prefer `lang`, fall back to deprecated `documentLang`
  resolved.lang = meta.lang ?? meta.documentLang
  resolved.keywords = evaluate(meta.keywords, ctx)
  resolved.author = meta.author
  resolved.viewport = meta.viewport
  resolved.themeColor = meta.themeColor
  resolved.disableIndexing = meta.disableIndexing

  // ── Open Graph ──────────────────────────────────────────────
  if (meta.openGraph) {
    const og = meta.openGraph
    const resolvedImage = evaluate(og.image, ctx)
    const resolvedImages = evaluate(og.images, ctx)

    resolved.openGraph = {
      type: og.type,
      title: evaluate(og.title, ctx),
      description: evaluate(og.description, ctx),
      image: resolvedImage,
      images: resolvedImages,
      url: evaluate(og.url, ctx),
      siteName: og.siteName,
      locale: og.locale,
      article: og.article,
    }

    // Normalize: if single image string, also put it in images array
    if (resolvedImage && !resolvedImages) {
      const imgObj: OpenGraphImage =
        typeof resolvedImage === 'string'
          ? { url: resolvedImage }
          : resolvedImage
      resolved.openGraph.images = [imgObj]
    }
  }

  // ── Twitter Card ────────────────────────────────────────────
  if (meta.twitter) {
    const tw = meta.twitter
    resolved.twitter = {
      card: tw.card,
      site: tw.site,
      creator: tw.creator,
      title: evaluate(tw.title, ctx),
      description: evaluate(tw.description, ctx),
      image: evaluate(tw.image, ctx),
      imageAlt: evaluate(tw.imageAlt, ctx),
    }
  }

  // ── Alternates / hreflang ───────────────────────────────────
  if (meta.alternates) {
    resolved.alternates = { ...meta.alternates }
  }

  // ── Icons / PWA ─────────────────────────────────────────────
  if (meta.icons) {
    resolved.icons = { ...meta.icons }
  }
  if (meta.manifest) {
    resolved.manifest = meta.manifest
  }

  // ── Structured Data ─────────────────────────────────────────
  if (meta.structuredData) {
    const sd = meta.structuredData
    resolved.structuredData = {
      type: sd.type,
      schema:
        typeof sd.schema === 'function' ? sd.schema(ctx) : sd.schema,
    }
  }

  // ── AI Hints ────────────────────────────────────────────────
  if (meta.aiHints) {
    const hints = meta.aiHints
    resolved.aiHints = {
      contentClassification: evaluate(hints.contentClassification, ctx),
      modelHints: evaluate(hints.modelHints, ctx),
      contextualInfo: evaluate(hints.contextualInfo, ctx),
      excludeFromIndexing: hints.excludeFromIndexing,
    }
  }

  // ── Robots ──────────────────────────────────────────────────
  if (meta.robots) {
    resolved.robots = { ...meta.robots }
  }

  // ── Custom Meta Tags ───────────────────────────────────────
  const customMeta = evaluate(meta.customMeta, ctx)
  if (customMeta) {
    resolved.customMeta = customMeta
  }

  return resolved
}
