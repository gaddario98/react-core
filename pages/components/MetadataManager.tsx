/**
 * MetadataManager Component
 * Consumes PageProps.meta and manages metadata injection.
 *
 * Delegates to `useMetadata` which:
 * - Resolves dynamic functions via `resolveMetadata`
 * - Translates strings via i18n
 * - Applies metadata to DOM (client) or MetadataStore (SSR)
 *
 * @module components/MetadataManager
 */

import { useMetadata } from '../hooks/useMetadata'
import type { FieldValues } from '@gaddario98/react-form'
import type { QueriesArray } from '@gaddario98/react-queries'
import type { MappedItemsFunction, MetadataConfig } from '../types'

/**
 * Props for MetadataManager component
 */
export interface MetadataManagerProps<
  F extends FieldValues = FieldValues,
  Q extends QueriesArray = QueriesArray,
> {
  /** Page metadata configuration (static or dynamic function) */
  meta?: MetadataConfig<F, Q> | MappedItemsFunction<F, Q, MetadataConfig>

  /** Namespace for i18n translations */
  ns?: string

  /** Page ID for scoping */
  pageId: string
}

/**
 * Headless component that manages metadata injection.
 * On web: injects metadata into `<head>`.
 * On SSR: stores metadata in the request-scoped MetadataStore (via context).
 * On React Native: metadata is resolved but not applied to DOM.
 *
 * @example
 * ```tsx
 * <MetadataManager
 *   meta={{
 *     title: 'My Page',
 *     description: 'Page description',
 *     openGraph: { type: 'website', image: '/og.png' },
 *     twitter: { card: 'summary_large_image' },
 *   }}
 *   pageId="my-page"
 * />
 * ```
 */
const MetadataManagerImpl = <
  F extends FieldValues = FieldValues,
  Q extends QueriesArray = QueriesArray,
>({
  meta,
  ns = 'common',
  pageId,
}: MetadataManagerProps<F, Q>) => {
  // useMetadata handles the full pipeline:
  // evaluate → resolve → translate → apply (DOM or store)
  useMetadata({ meta, ns, pageId })

  return null
}

MetadataManagerImpl.displayName = 'MetadataManager'

export const MetadataManager = MetadataManagerImpl
