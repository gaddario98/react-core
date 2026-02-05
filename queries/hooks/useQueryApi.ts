import { useQuery } from '@tanstack/react-query'
import { useSetAtom } from 'jotai'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { getCompositeKey, queriesAtom } from '../atoms/queryResultAtoms'
import { useApiConfigValue } from '../config'
import type { CustomQueryOptions, QueryResult } from '../types'

export const useQueryApi = <TResponse>(
  options: CustomQueryOptions<TResponse>,
  id: string = 'default',
): QueryResult<TResponse> => {
  const {
    endpoint,
    queryKey,
    enabled = true,
    headers,
    disableAuthControl,
    onDataChanged,
    customQueryFn,
    disableLoading,
    ...restOptions
  } = options

  const { requestFn, validateAuthFn, defaultHeaders,endpoints } =
    useApiConfigValue()

  const fullEndpoint = useMemo(() => {
    const [key, path] = endpoint
    const baseUrl = endpoints[key]
    return [baseUrl, path].filter(Boolean).join('/')
  }, [endpoint, endpoints])

  const isLogged = useMemo(
    () => (validateAuthFn ? validateAuthFn() : true),
    [validateAuthFn],
  )
  const queryFn = useCallback(async () => {
    if (customQueryFn) {
      const res = await customQueryFn()
      return res
    }

    const mergedHeaders = {
      ...defaultHeaders,
      ...headers,
    }

    const res = await requestFn<unknown, TResponse>({
      url: fullEndpoint,
      method: 'GET',
      headers: mergedHeaders,
    })
    return res
  }, [customQueryFn, defaultHeaders, fullEndpoint, headers, requestFn])

  const enabledFinal = useMemo(() => {
    if (disableAuthControl) {
      return enabled
    }
    return enabled && isLogged
  }, [disableAuthControl, enabled, isLogged])
  const result = useQuery<TResponse, Error>({
    queryKey,
    queryFn,
    enabled: enabledFinal,
    retry: 1,
    retryDelay: 1000,
    ...restOptions,
  })
  const ref = useRef({ onDataChanged, refetch: result.refetch })

  useEffect(() => {
    ref.current = { onDataChanged, refetch: result.refetch }
  }, [onDataChanged, result.refetch])

  useEffect(() => {
    ref.current.onDataChanged?.(result.data)
  }, [result.data])

  // Sync to Jotai atom for persistence
  const setQueriesAtom = useSetAtom(queriesAtom)
  const queryKeyStr = queryKey.join('-')
  const compositeKey = getCompositeKey(id, queryKeyStr)

  useEffect(() => {
    setQueriesAtom((prev) => ({
      ...prev,
      [compositeKey]: {
        data: result.data,
        isLoading: result.isLoading,
        isLoadingMapped: !disableLoading && result.isLoading,
        isFetching: result.isFetching,
        isPending: result.isPending,
        isSuccess: result.isSuccess,
        isError: result.isError,
        isStale: result.isStale,
        error: result.error,
        dataUpdatedAt: result.dataUpdatedAt,
        errorUpdatedAt: result.errorUpdatedAt,
        fetchStatus: result.fetchStatus,
        refetch: result.refetch,
      },
    }))
  }, [
    result.data,
    result.isLoading,
    result.isFetching,
    result.isPending,
    result.isSuccess,
    result.isError,
    result.isStale,
    result.error,
    result.dataUpdatedAt,
    result.errorUpdatedAt,
    result.fetchStatus,
    setQueriesAtom,
    compositeKey,
    disableLoading,
    result.refetch,
  ])

  return {
    data: result.data,
    isLoadingMapped: !disableLoading && result.isLoading,
    isLoading: result.isLoading,
    isFetching: result.isFetching,
    isPending: result.isPending,
    error: result.error,
    refetch: () => ref.current.refetch(),
  }
}
