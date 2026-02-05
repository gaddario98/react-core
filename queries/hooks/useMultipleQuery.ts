import { useQueries } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useApiConfigValue } from '../config'
import type { MultipleQueryResponse, QueriesArray, QueryProps } from '../types'
import type { UseQueryResult } from '@tanstack/react-query'

export const useMultipleQuery = <Q extends QueriesArray>(
  settings: Array<QueryProps<Q[number]['key'], Q[number]['response']>> = [],
) => {
  const { requestFn, validateAuthFn, defaultHeaders, queryClient, endpoints } =
    useApiConfigValue()

  const generateEndpoint = useCallback(
    (endpoint: [string, string] | [string]) => {
      const [key, path] = endpoint
      const baseUrl = endpoints[key]
      return [baseUrl, path].filter(Boolean).join('/')
    },
    [endpoints],
  )
  const isLogged = useMemo(
    () => (validateAuthFn ? validateAuthFn() : true),
    [validateAuthFn],
  )

  const generateQueryFn = useCallback(
    async ({
      endpoint,
      customQueryFn,
      headers,
    }: QueryProps<Q[number]['key'], Q[number]['response']>) => {
      const fullEndpoint = generateEndpoint(endpoint)

      if (customQueryFn) {
        const res = await customQueryFn()
        return res
      }

      const mergedHeaders = {
        ...defaultHeaders,
        ...headers,
      }

      return await requestFn({
        url: fullEndpoint,
        method: 'GET',
        headers: mergedHeaders,
      })
    },
    [defaultHeaders, generateEndpoint, requestFn],
  )

  const ref = useRef({
    settings,
    data: {} as Record<Q[number]['key'], Q[number]['response']>,
    results: {} as Record<
      string,
      MultipleQueryResponse<Q>[keyof MultipleQueryResponse<Q>]
    >,
  })

  useEffect(() => {
    ref.current.settings = settings
  }, [settings])

  const queries = useMemo(() => {
    return settings.map((setting) => {
      const { queryKey, enabled = true, disableAuthControl, ...rest } = setting

      return {
        queryKey,
        queryFn: () => generateQueryFn(setting),
        enabled: !!enabled && (disableAuthControl || !!isLogged),
        ...rest,
      }
    })
  }, [settings, isLogged, generateQueryFn])

  const combine = useCallback(
    (results: Array<UseQueryResult<Q[number]['response'], Error>>) => {
      return results.reduce<MultipleQueryResponse<Q>>((prev, result, index) => {
        const setting = ref.current.settings[index]

        const keyToMap = setting.keyToMap
        Object.assign(prev, {
          [keyToMap]: {
            data: result.data as Q[number]['response'],
            isLoadingMapped: !setting.disableLoading && result.isLoading,
            isLoading: result.isLoading,
            isFetching: result.isFetching,
            isPending: result.isPending,
            error: result.error,
            refetch: result.refetch,
          },
        })

        return prev
      }, {} as MultipleQueryResponse<Q>)
    },
    [],
  )

  const result = useQueries(
    {
      queries,
      combine,
    },
    queryClient,
  )

  useEffect(() => {
    ref.current.settings.forEach((setting) => {
      const { keyToMap, onDataChanged, onStateChange } = setting
      if (!onDataChanged && !onStateChange) return

      const currentResult = result[keyToMap]
      const prevResult = ref.current.results[keyToMap]

      // Handle onStateChange
      if (onStateChange) {
        if (
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          !prevResult ||
          prevResult.data !== currentResult.data ||
          prevResult.isLoading !== currentResult.isLoading ||
          prevResult.isLoadingMapped !== currentResult.isLoadingMapped ||
          prevResult.isFetching !== currentResult.isFetching ||
          prevResult.isPending !== currentResult.isPending ||
          prevResult.error !== currentResult.error
        ) {
          ref.current.results[keyToMap] = currentResult
          onStateChange(currentResult)
        }
      }

      // Handle onDataChanged (Legacy support + specific data changes)
      if (onDataChanged) {
        const currentData = currentResult.data
        const prevData = ref.current.data[keyToMap]

        if (currentData !== undefined && currentData !== prevData) {
          ref.current.data[keyToMap] = currentData
          onDataChanged(currentData)
        }
      }
    })
  }, [result])

  return result
}
