import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useSetAtom } from 'jotai'
import {
  getCompositeKey,
  mutationsAtom,
  queriesAtom,
} from '../atoms/queryResultAtoms'
import { useMultipleMutation } from './useMultipleMutation'
import { useMultipleQuery } from './useMultipleQuery'
import { useMultipleWebSocket } from './useMultipleWebSocket'
import type {
  MutationStoreEntry,
  QueryStoreEntry,
} from '../atoms/queryResultAtoms'
import type {
  ContextValue,
  ExtractWebSocket,
  MultipleQueryResponse,
  MutationItem,
  QueriesArray,
  QueryConfigArray,
  QueryItem,
  QueryProps,
} from '../types'

// ============================================================================
// Types
// ============================================================================

export interface UseApiOptions {
  /**
   * Unique identifier for this scope. Used as the key prefix for Jotai atoms.
   * @default 'default'
   */
  scopeId?: string
  /**
   * Whether to persist query/mutation results to Jotai atoms.
   * @default true
   */
  persistToAtoms?: boolean
}

// ============================================================================
// Main Hook
// ============================================================================

/**
 * Main hook that integrates TanStack Query with Jotai for state persistence.
 */
export function useApi<Q extends QueriesArray>(
  configs: QueryConfigArray<Q>,
  options?: UseApiOptions,
): ContextValue<Q>

/**
 * @deprecated Use options object instead: useApi(configs, { scopeId: 'my-scope' })
 */
export function useApi<Q extends QueriesArray>(
  configs: QueryConfigArray<Q>,
  id?: string,
): ContextValue<Q>

export function useApi<Q extends QueriesArray>(
  configs: QueryConfigArray<Q>,
  optionsOrId?: UseApiOptions | string,
): ContextValue<Q> {
  const options: UseApiOptions =
    typeof optionsOrId === 'string'
      ? { scopeId: optionsOrId }
      : (optionsOrId ?? {})

  const { scopeId = 'default', persistToAtoms = true } = options

  // Global atom setters
  const setQueriesAtom = useSetAtom(queriesAtom)
  const setMutationsAtom = useSetAtom(mutationsAtom)

  // Update a single query in the global atom
  const updateQueryAtom = useCallback(
    (key: string, state: QueryStoreEntry) => {
      const compositeKey = getCompositeKey(scopeId, key)
      setQueriesAtom((prev) => ({
        ...prev,
        [compositeKey]: state,
      }))
    },
    [setQueriesAtom, scopeId],
  )

  // Update a single mutation in the global atom
  const updateMutationAtom = useCallback(
    (key: string, state: MutationStoreEntry) => {
      const compositeKey = getCompositeKey(scopeId, key)
      setMutationsAtom((prev) => ({
        ...prev,
        [compositeKey]: state,
      }))
    },
    [setMutationsAtom, scopeId],
  )

  // Enhanced query configs with atom persistence
  const enhancedQueryConfigs = useMemo(() => {
    const items = configs.filter((q): q is QueryItem<Q> => q.type === 'query')

    return items
      .map((item) => {
        if (!item.queryConfig) return null

        const key = item.key
        const originalOnStateChange = item.queryConfig.onStateChange

        return {
          ...item.queryConfig,
          keyToMap: key,
          onStateChange: (state: MultipleQueryResponse<Q>[string]): void => {
            if (persistToAtoms) {
              updateQueryAtom(key, state)
            }
            originalOnStateChange?.(state)
          },
          options: item.queryConfig.options,
        }
      })
      .filter(Boolean) as unknown as Array<
      QueryProps<Q[number]['key'], Q[number]['response']>
    >
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    // eslint-disable-next-line react-hooks/exhaustive-deps
    JSON.stringify(configs),
    persistToAtoms,
    updateQueryAtom,
  ])

  // Enhanced mutation configs with atom persistence
  const enhancedMutationItems = useMemo(() => {
    const items = configs.filter(
      (q): q is MutationItem<Q> => q.type === 'mutation' && !!q.mutationConfig,
    )

    return items.map((item) => {
      const key = item.key
      const originalOnStateChange = item.mutationConfig.onStateChange

      return {
        ...item,
        mutationConfig: {
          ...item.mutationConfig,
          onStateChange: (state: MutationStoreEntry): void => {
            if (persistToAtoms) {
              updateMutationAtom(key, state)
            }
            originalOnStateChange?.(state)
          },
        },
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(configs), persistToAtoms, updateMutationAtom])

  const webSocketItems = useMemo(
    () =>
      configs.filter((q): q is ExtractWebSocket<Q> => q.type === 'websocket'),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(configs)],
  )

  // Execute hooks
  const allQuery = useMultipleQuery<Q>(enhancedQueryConfigs)
  const allMutation = useMultipleMutation<Q>(enhancedMutationItems)
  const allWebSocket = useMultipleWebSocket<Q[number]['key']>(webSocketItems)

  const queryKeys = enhancedQueryConfigs.map((el) => el.keyToMap)
  const mutationKeys = enhancedMutationItems.map((el) => el.key)

  const ref = useRef({ allQuery, allMutation, queryKeys, mutationKeys })
  useEffect(() => {
    ref.current = { allQuery, allMutation, queryKeys, mutationKeys }
  }, [allQuery, allMutation, queryKeys, mutationKeys])

  const refreshQueries = useCallback(() => {
    ref.current.queryKeys.forEach((k) => {
      ref.current.allQuery[k].refetch()
    })
  }, [])

  return {
    allQuery,
    allMutation,
    allWebSocket,
    refreshQueries,
  }
}

export default useApi
