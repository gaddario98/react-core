import { atom } from 'jotai'
import { atomWithStorage, createJSONStorage, selectAtom } from 'jotai/utils'
import { storage } from '@gaddario98/react-state'
import type { UseMutationResult } from '@tanstack/react-query'
import type { QueriesArray, QueryResult } from '../types'

// ============================================================================
// Type Definitions
// ============================================================================

export type QueryStoreEntry<Q extends QueriesArray = QueriesArray> =
  QueryResult<Q[number]['response']>

export type MutationStoreEntry<Q extends QueriesArray = QueriesArray> =
  UseMutationResult<Q[number]['response'], Error, Q[number]['props'], unknown>
// ============================================================================
// Default Values
// ============================================================================

export const DEFAULT_QUERY_ENTRY: QueryStoreEntry = Object.freeze({
  data: undefined,
  isLoading: false,
  isLoadingMapped: false,
  isFetching: false,
  isPending: false,
  isSuccess: false,
  isError: false,
  isStale: false,
  error: null,
  dataUpdatedAt: 0,
  errorUpdatedAt: 0,
  fetchStatus: 'idle' as const,
  refetch: () => Promise.resolve(),
})

export const DEFAULT_MUTATION_ENTRY: MutationStoreEntry = Object.freeze({
  data: undefined,
  status: 'idle',
  error: null,
  variables: undefined,
  submittedAt: 0,
  isIdle: true,
  isPending: false,
  isSuccess: false,
  isError: false,
  mutate: () => {},
  mutateAsync: async () => Promise.resolve(undefined),
  reset: () => {},
  context: 0,
  failureCount: 0,
  failureReason: null,
  isPaused: false,
} as MutationStoreEntry)

// ============================================================================
// Global Atoms (single atom for all queries, single atom for all mutations)
// ============================================================================

/**
 * Global atom storing all query results.
 * Key format: "scopeId:queryKey"
 */
export const queriesAtom = atomWithStorage<Record<string, QueryStoreEntry>>(
  'queries-atom',
  {},
  createJSONStorage<Record<string, QueryStoreEntry>>(() => storage),{ getOnInit: true }
)

/**
 * Global atom storing all mutation results.
 * Key format: "scopeId:mutationKey"
 */
export const mutationsAtom = atom<Record<string, MutationStoreEntry>>({})

// ============================================================================
// Helper to generate composite keys
// ============================================================================

export const getCompositeKey = (scopeId: string, key: string): string =>
  `${scopeId}:${key}`

// ============================================================================
// Derived Atoms for specific scope access
// ============================================================================

/**
 * Creates a derived atom for accessing queries of a specific scope.
 */
export const createScopeQueriesAtom = (scopeId: string) =>
  atom(
    (get) => {
      const allQueries = get(queriesAtom)
      const prefix = `${scopeId}:`
      const scopeQueries: Record<string, QueryStoreEntry> = {}

      for (const [key, value] of Object.entries(allQueries)) {
        if (key.startsWith(prefix)) {
          scopeQueries[key.slice(prefix.length)] = value
        }
      }

      return scopeQueries
    },
    (get, set, update: Record<string, QueryStoreEntry>) => {
      const allQueries = get(queriesAtom)
      const prefix = `${scopeId}:`
      const newQueries = { ...allQueries }

      // Remove old scope entries
      for (const key of Object.keys(newQueries)) {
        if (key.startsWith(prefix)) {
          delete newQueries[key]
        }
      }

      // Add new scope entries
      for (const [key, value] of Object.entries(update)) {
        newQueries[`${prefix}${key}`] = value
      }

      set(queriesAtom, newQueries)
    },
  )

/**
 * Creates a derived atom for accessing mutations of a specific scope.
 */
export const createScopeMutationsAtom = (scopeId: string) =>
  atom(
    (get) => {
      const allMutations = get(mutationsAtom)
      const prefix = `${scopeId}:`
      const scopeMutations: Record<string, MutationStoreEntry> = {}

      for (const [key, value] of Object.entries(allMutations)) {
        if (key.startsWith(prefix)) {
          scopeMutations[key.slice(prefix.length)] = value
        }
      }

      return scopeMutations
    },
    (get, set, update: Record<string, MutationStoreEntry>) => {
      const allMutations = get(mutationsAtom)
      const prefix = `${scopeId}:`
      const newMutations = { ...allMutations }

      // Remove old scope entries
      for (const key of Object.keys(newMutations)) {
        if (key.startsWith(prefix)) {
          delete newMutations[key]
        }
      }

      // Add new scope entries
      for (const [key, value] of Object.entries(update)) {
        newMutations[`${prefix}${key}`] = value
      }

      set(mutationsAtom, newMutations)
    },
  )

// ============================================================================
// Selectors for single query/mutation access
// ============================================================================

export const createQuerySelector = <Q extends QueriesArray>(
  scopeId: string,
  queryKey: string,
) => {
  const compositeKey = getCompositeKey(scopeId, queryKey)
  return selectAtom<Record<string, QueryStoreEntry<Q>>, QueryStoreEntry<Q>>(
    queriesAtom,
    (queries) => {
      const entry = queries[compositeKey]
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      return entry ?? DEFAULT_QUERY_ENTRY
    },
    (a, b) =>
      a === b ||
      (a.data === b.data &&
        a.isLoading === b.isLoading &&
        a.isFetching === b.isFetching &&
        a.error === b.error),
  )
}

export const createMutationSelector = <Q extends QueriesArray>(
  scopeId: string,
  mutationKey: string,
) => {
  const compositeKey = getCompositeKey(scopeId, mutationKey)
  return selectAtom<
    Record<string, MutationStoreEntry<Q>>,
    MutationStoreEntry<Q>
  >(
    mutationsAtom,
    (mutations) => {
      const entry = mutations[compositeKey]
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      return entry ?? DEFAULT_MUTATION_ENTRY
    },
    (a, b) =>
      a === b ||
      (a.data === b.data && a.isPending === b.isPending && a.error === b.error),
  )
}
