/**
 * useMetadata Hook
 * Evaluates dynamic metadata with query data and form values
 * Integrates i18n for metadata translation
 * Uses resolveMetadata + applyMetadataToDom for clean separation
 *
 * @module hooks/useMetadata
 */

import { useEffect, useMemo } from 'react'
import { resolveMetadata } from '../config/resolveMetadata'
import { applyMetadataToDom } from '../config/metadata'
import { useMetadataStore } from '../config/MetadataStoreProvider'
import { usePageConfigValue } from '../config'
import { usePageValues } from './usePageValues'
import type { FieldValues } from '@gaddario98/react-form'
import type { QueriesArray } from '@gaddario98/react-queries'
import type { MappedItemsFunction, MetadataConfig } from '../types'
import type { ResolvedMetadata } from '../config/types'

/**
 * Props for useMetadata hook
 */
export interface UseMetadataProps<
  F extends FieldValues = FieldValues,
  Q extends QueriesArray = QueriesArray,
> {
  /** Base metadata configuration (static or dynamic function) */
  meta?: MetadataConfig<F, Q> | MappedItemsFunction<F, Q, MetadataConfig>

  /** Namespace for i18n translations */
  ns?: string

  /** Whether to automatically apply metadata (default: true) */
  autoApply?: boolean

  pageId: string
}

/**
 * Hook for evaluating and managing dynamic metadata.
 *
 * Pipeline:
 * 1. Evaluate `meta` (if it's a MappedItemsFunction, call it with get/set)
 * 2. Resolve all dynamic functions via `resolveMetadata()`
 * 3. Translate strings via i18n
 * 4. Auto-apply to DOM (client) or store (SSR) via `applyMetadataToDom` / MetadataStore
 *
 * @returns Resolved and translated metadata
 */
export function useMetadata<
  F extends FieldValues = FieldValues,
  Q extends QueriesArray = QueriesArray,
>({ meta, autoApply = true, pageId }: UseMetadataProps<F, Q>): ResolvedMetadata {
  const { translateText, locale } = usePageConfigValue()
  const t = useMemo(
    () => translateText ?? ((key: string) => key),
    [translateText],
  )
  const { get, set } = usePageValues<F, Q>({ pageId })
  const metadataStore = useMetadataStore()

  // Step 1: Evaluate metadata (if function)
  const evaluatedMeta = useMemo<MetadataConfig<F, Q>>(() => {
    if (!meta) return {}
    if (typeof meta === 'function') {
      return meta({ get, set })
    }
    return meta
  }, [meta, get, set])

  // Step 2: Resolve all dynamic evaluator functions into plain values
  const resolved = useMemo(
    () => resolveMetadata(evaluatedMeta, { get, set }),
    [evaluatedMeta, get, set],
  )

  // Step 3: Translate metadata strings (i18n)
  const translated = useMemo<ResolvedMetadata>(() => {
    const result: ResolvedMetadata = { ...resolved }

    // Translate basic fields
    if (result.title) {
      result.title = t(result.title, { ns: 'meta', defaultValue: result.title })
    }
    if (result.description) {
      result.description = t(result.description, {
        ns: 'meta',
        defaultValue: result.description,
      })
    }
    if (result.keywords) {
      result.keywords = result.keywords.map((kw) =>
        t(kw, { ns: 'meta', defaultValue: kw }),
      )
    }
    if (result.author) {
      result.author = t(result.author, { ns: 'meta', defaultValue: result.author })
    }

    // Translate Open Graph
    if (result.openGraph) {
      result.openGraph = { ...result.openGraph }
      if (result.openGraph.title) {
        result.openGraph.title = t(result.openGraph.title, {
          ns: 'meta',
          defaultValue: result.openGraph.title,
        })
      }
      if (result.openGraph.description) {
        result.openGraph.description = t(result.openGraph.description, {
          ns: 'meta',
          defaultValue: result.openGraph.description,
        })
      }
      if (result.openGraph.siteName) {
        result.openGraph.siteName = t(result.openGraph.siteName, {
          ns: 'meta',
          defaultValue: result.openGraph.siteName,
        })
      }
    }

    // Translate Twitter Card
    if (result.twitter) {
      result.twitter = { ...result.twitter }
      if (result.twitter.title) {
        result.twitter.title = t(result.twitter.title, {
          ns: 'meta',
          defaultValue: result.twitter.title,
        })
      }
      if (result.twitter.description) {
        result.twitter.description = t(result.twitter.description, {
          ns: 'meta',
          defaultValue: result.twitter.description,
        })
      }
    }

    // Set language from locale
    result.lang = result.lang ?? locale

    return result
  }, [resolved, t, locale])

  // Step 4: Apply metadata
  useEffect(() => {
    if (!autoApply) return

    // If we have a request-scoped store (SSR), write to it
    if (metadataStore) {
      metadataStore.setMetadata(translated)
    }

    // On the client, also apply to DOM
    if (typeof document !== 'undefined') {
      applyMetadataToDom(translated)
    }
  }, [translated, autoApply, metadataStore])

  return translated
}

/**
 * Hook to manually apply metadata (when autoApply is false)
 * @returns Function to apply resolved metadata to the DOM
 */
export function useApplyMetadata() {
  const metadataStore = useMetadataStore()

  return (meta: ResolvedMetadata) => {
    if (metadataStore) {
      metadataStore.setMetadata(meta)
    }
    if (typeof document !== 'undefined') {
      applyMetadataToDom(meta)
    }
  }
}
