import { useMutation } from '@tanstack/react-query'
import { useSetAtom } from 'jotai'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import {
  getCompositeKey,
  mutationsAtom
} from '../atoms/queryResultAtoms'
import { useApiConfigValue } from '../config'
import type {
  MutationStoreEntry} from '../atoms/queryResultAtoms';
import type { MutationFunctionContext } from '@tanstack/react-query'
import type { CustomMutationOptions } from '../types'

export const useMutateApi = <TProps, TResponse>(
  options: CustomMutationOptions<TProps, TResponse>,
  id: string = 'default',
) => {
  const {
    endpoint,
    method,
    headers,
    queryKeyToInvalidate,
    customRequest,
    converter,
    isTest,
    notification,
    ...restOptions
  } = useMemo(() => options, [options])
  const { requestFn, validateAuthFn, defaultHeaders, showNotification,endpoints } = useApiConfigValue()
  const { queryClient } = useApiConfigValue()

  const [key, path] = useMemo(() => endpoint, [endpoint])
  const baseUrl = useMemo(() => endpoints[key] ?? '', [endpoints, key])
  const fullEndpoint = useMemo(
    () => [baseUrl, path].filter(Boolean).join('/'),
    [baseUrl, path],
  )
  const executeMutation = useCallback(
    async (data: TProps) => {
      if (isTest) {
        return 'test' as unknown as TResponse
      }

      // Auth validation
      const isValidAuth = validateAuthFn ? validateAuthFn() : true

      if ( !isValidAuth) {
        throw new Error('Utente non autenticato')
      }

      const mergedHeaders = {
        ...defaultHeaders,
        ...headers,
      }

      if (customRequest) {
        return customRequest(fullEndpoint, method, data)
      }

        return requestFn<TProps, TResponse>({
          url: fullEndpoint,
          method,
          body: data,
          headers: mergedHeaders,
          converter,
        })
      
    },
    [converter, customRequest, defaultHeaders, fullEndpoint, headers, isTest, method, requestFn, validateAuthFn],
  )
  const onSuccess = useCallback(
    (
      data: TResponse,
      variables: TProps,
      onMutateResult: unknown,
      context: MutationFunctionContext,
    ) => {
      // Notifications
      const notificationProps =
        typeof notification?.success === 'function'
          ? notification.success(data)
          : notification?.success

      if (notificationProps?.message) {
        showNotification?.({
          message: notificationProps.message,
          type: notificationProps.type ?? 'success',
          ...notificationProps,
        })
      }
      restOptions.onSuccess?.(data, variables, onMutateResult, context)

      // Invalidate queries
      if (queryKeyToInvalidate) {
        queryKeyToInvalidate.forEach((qKey) => {
          queryClient.invalidateQueries({ queryKey: [qKey], exact: false })
        })
      }
    },
    [
      notification,
      queryClient,
      queryKeyToInvalidate,
      restOptions,
      showNotification,
    ],
  )
  const onError = useCallback(
    (
      error: Error,
      variables: TProps,
      onMutateResult: unknown,
      context: MutationFunctionContext,
    ) => {
      const notificationProps =
        typeof notification?.error === 'function'
          ? notification.error(error.message)
          : notification?.error

      if (notificationProps?.message || error.message) {
        showNotification?.({
          message:
            notificationProps?.message ||
            error.message ||
            'An unexpected error occurred',
          type: notificationProps?.type ?? 'error',
          ...notificationProps,
        })
      }

      restOptions.onError?.(error, variables, onMutateResult, context)
    },
    [notification, restOptions, showNotification],
  )
  const ref = useRef({ executeMutation, onSuccess, onError })

  useEffect(() => {
    ref.current = { executeMutation, onSuccess, onError }
  }, [executeMutation, onSuccess, onError])

  const result = useMutation<TResponse, Error, TProps>({
    mutationFn: (data) => {
      return ref.current.executeMutation(data)
    },
    ...restOptions,
    onSuccess: (data, variables, onMutateResult, context) => {
      ref.current.onSuccess(data, variables, onMutateResult, context)
    },
    onError: (error, variables, onMutateResult, context) => {
      ref.current.onError(error, variables, onMutateResult, context)
    },
  })

  // Sync to Jotai atom for persistence
  const setMutationsAtom = useSetAtom(mutationsAtom)
  const mutationKey = restOptions.mutationKey?.join('-') ?? fullEndpoint
  const compositeKey = getCompositeKey(id, mutationKey)

  useEffect(() => {
    setMutationsAtom((prev) => ({
      ...prev,
      [compositeKey]: {
        data: result.data,
        status: result.status,
        error: result.error,
        variables: result.variables,
        submittedAt: result.submittedAt,
        isIdle: result.isIdle,
        isPending: result.isPending,
        isSuccess: result.isSuccess,
        isError: result.isError,
      } as MutationStoreEntry,
    }))
  }, [
    result.data,
    result.status,
    result.error,
    result.variables,
    result.submittedAt,
    result.isIdle,
    result.isPending,
    result.isSuccess,
    result.isError,
    setMutationsAtom,
    compositeKey,
  ])

  return result
}
