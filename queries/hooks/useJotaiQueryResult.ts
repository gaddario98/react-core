import { useMemo } from 'react'
import { useAtomValue } from 'jotai'
import {
  DEFAULT_MUTATION_ENTRY,
  DEFAULT_QUERY_ENTRY,
  mutationsAtom,
  queriesAtom,
} from '../atoms'
import type { MutationStoreEntry, QueryStoreEntry } from '../atoms'
import type { QueriesArray } from '../types'

// ============================================================================
// Bulk Query/Mutation Hooks
// ============================================================================

/**
 * Hook to read all queries for a scope.
 */
export function useJotaiQueries<Q extends QueriesArray>(options: {
  scopeId: string
}) {
  const { scopeId } = options
  const allQueries =
    useAtomValue<Record<string, QueryStoreEntry<Q>>>(queriesAtom)

  return useMemo(() => {
    const prefix = `${scopeId}:`
    const scopeQueries: Record<string, QueryStoreEntry<Q>> = {}

    for (const [key, value] of Object.entries(allQueries)) {
      if (key.startsWith(prefix)) {
        scopeQueries[key.slice(prefix.length)] = value
      }
    }

    return scopeQueries
  }, [allQueries, scopeId])
}

/**
 * Hook to read all mutations for a scope.
 */
export function useJotaiMutations<Q extends QueriesArray>(options: {
  scopeId: string
}) {
  const { scopeId } = options
  const allMutations =
    useAtomValue<Record<string, MutationStoreEntry<Q>>>(mutationsAtom)

  return useMemo(() => {
    const prefix = `${scopeId}:`
    const scopeMutations: Record<string, MutationStoreEntry<Q>> = {}
    for (const [key, value] of Object.entries(allMutations)) {
      if (key.startsWith(prefix)) {
        scopeMutations[key.slice(prefix.length)] = value
      }
    }

    return scopeMutations
  }, [allMutations, scopeId])
}

// ============================================================================
// Utility Exports
// ============================================================================

export { DEFAULT_QUERY_ENTRY, DEFAULT_MUTATION_ENTRY }
