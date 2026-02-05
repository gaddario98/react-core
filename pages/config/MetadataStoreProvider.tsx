/**
 * MetadataStoreProvider — React Context for request-scoped metadata store.
 *
 * In SSR, wrap your app in this provider (one per request) to avoid
 * cross-request metadata leaks. On the client, a default global store is used.
 *
 * @module config/MetadataStoreProvider
 */

import { createContext, useContext, useMemo } from 'react'
import { createMetadataStore } from './metadata'
import type { MetadataStore } from './types'

const MetadataStoreContext = createContext<MetadataStore | null>(null)

export interface MetadataStoreProviderProps {
  /** Optional pre-created store. If not provided, a new one is created. */
  store?: MetadataStore
  children: React.ReactNode
}

/**
 * Provides a request-scoped MetadataStore via React Context.
 *
 * @example SSR (one per request)
 * ```tsx
 * import { createMetadataStore, MetadataStoreProvider } from '@/core/pages';
 *
 * function handleRequest(req, res) {
 *   const store = createMetadataStore();
 *   const html = renderToString(
 *     <MetadataStoreProvider store={store}>
 *       <App />
 *     </MetadataStoreProvider>
 *   );
 *   const headHtml = collectMetadataToHtml(store.getMetadata());
 *   // inject headHtml into <head>
 * }
 * ```
 */
export function MetadataStoreProvider({
  store,
  children,
}: MetadataStoreProviderProps) {
  const value = useMemo(() => store ?? createMetadataStore(), [store])
  return (
    <MetadataStoreContext.Provider value={value}>
      {children}
    </MetadataStoreContext.Provider>
  )
}

/**
 * Access the nearest request-scoped MetadataStore.
 * Returns `null` if no provider is found (falls back to global store in consumers).
 */
export function useMetadataStore(): MetadataStore | null {
  return useContext(MetadataStoreContext)
}
