/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  MutateOptions,
  UseMutationOptions,
  UseQueryOptions,
  useMutation,
  useQuery,
} from '@tanstack/react-query'
import type { NotificationConfig } from '@gaddario98/react-notifications'
import type { AxiosRequestConfig } from 'axios'

export type ApiMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'

export type Endpoint = Record<string, string>
export interface QueriesProps<TProps, TResponse, TConverter = null> {
  endpoint: [keyof Endpoint, string] | [keyof Endpoint]
  queryKeyToInvalidate?: Array<string>
  headers?: AxiosRequestConfig['headers']
  method: ApiMethod
  converter?: (props: TProps) => TConverter
  customRequest?: (
    url: string,
    method: string,
    data: TProps,
  ) => Promise<TResponse>
  mutateOptions?: MutateOptions<TResponse, Error, TProps, unknown>
  isTest?: boolean
  notification?: {
    success?: NotificationConfig | ((res: TResponse) => NotificationConfig)
    error?: NotificationConfig | ((error: string) => NotificationConfig)
    translationOption?: Record<string, any>
  }
}
export interface QueryProps<Key extends string, TResponse> {
  endpoint: [keyof Endpoint, string] | [keyof Endpoint]
  queryKey: Array<string>
  enabled: boolean
  keyToMap: Key
  disableLoading?: boolean
  customQueryFn?: () => Promise<TResponse>
  headers?: AxiosRequestConfig['headers']
  disableAuthControl?: boolean
  onDataChanged?: (data: TResponse) => void
  onStateChange?: (state: QueryResult<TResponse>) => void
  options?: Omit<
    Parameters<typeof useQuery<TResponse>>['0'],
    'queryKey' | 'queryFn'
  >
}
export interface CustomQueryOptions<TResponse>
  extends Omit<UseQueryOptions<TResponse, Error>, 'queryKey' | 'queryFn'> {
  endpoint: [keyof Endpoint, string] | [keyof Endpoint]
  queryKey: Array<string>
  headers?: AxiosRequestConfig['headers']
  disableAuthControl?: boolean
  onDataChanged?: (data: TResponse | undefined) => void
  onStateChange?: (state: QueryResult<TResponse>) => void
  options?: Omit<
    Parameters<typeof useQuery<TResponse>>['0'],
    'queryKey' | 'queryFn'
  >
  // Legacy support
  keyToMap?: string
  disableLoading?: boolean
  customQueryFn?: () => Promise<TResponse>
}

export interface CustomMutationOptions<TProps, TResponse>
  extends UseMutationOptions<TResponse, Error, TProps, unknown> {
  endpoint: [keyof Endpoint, string] | [keyof Endpoint]
  method: ApiMethod
  headers?: AxiosRequestConfig['headers']
  queryKeyToInvalidate?: Array<string>
  customRequest?: (
    url: string,
    method: string,
    data: TProps,
  ) => Promise<TResponse>
  converter?: (props: TProps) => any
  isTest?: boolean
  notification?: {
    success?: NotificationConfig | ((res: TResponse) => NotificationConfig)
    error?: NotificationConfig | ((error: string) => NotificationConfig)
    translationOption?: Record<string, any>
  }
}

// Types for useApi configuration (Backward Compatibility + New Power)

export type QueryDefinition<
  K extends string,
  T extends 'query' | 'mutation' | 'websocket',
  P,
  R,
  C = any,
> = { key: K; props: P; response?: R; converter: C; type: T }

export type QueriesArray = Array<QueryDefinition<string, any, any, any, any>>

export type ExtractQuery<Q extends QueriesArray> = Extract<
  Q[number],
  { type: 'query' }
>
export type ExtractWebSocket<Q extends QueriesArray> = Extract<
  Q[number],
  { type: 'websocket' }
>
export type ExtractQueryResponse<
  Q extends QueriesArray,
  K extends Q[number]['key'],
> = Extract<Q[number], { key: K }>

export type ExtractMutation<Q extends QueriesArray> = Extract<
  Q[number],
  { type: 'mutation' }
>

export type CustomMutation<
  TData = unknown,
  TError = Error,
  TVariables = void,
  TOnMutateResult = unknown,
> = typeof useMutation<TData, TError, TVariables, TOnMutateResult> & {
  endpoint: string
}

export type AllMutation<Q extends QueriesArray = QueriesArray> = {
  [K in ExtractMutation<Q>['key']]: ReturnType<
    CustomMutation<
      ExtractQueryResponse<Q, K>['response'],
      Error,
      ExtractQueryResponse<Q, K>['props'],
      unknown
    >
  > & { endpoint: QueriesProps<any, any>['endpoint'] }
}
export type ExtractMutationByKey<
  Q extends QueriesArray = QueriesArray,
  K extends ExtractMutation<Q>['key'] = ExtractMutation<Q>['key'],
> = ReturnType<
  CustomMutation<
    ExtractQueryResponse<Q, K>['response'],
    Error,
    ExtractQueryResponse<Q, K>['props'],
    unknown
  >
>
export type ExtractQueryByKey<
  Q extends QueriesArray = QueriesArray,
  K extends ExtractQuery<Q>['key'] = ExtractQuery<Q>['key'],
> = {
  data?: ExtractQueryResponse<Q, K>['response']
  isLoading: boolean
  isLoadingMapped: boolean
  isFetching: boolean
  isPending: boolean
  error: Error | null
  refetch: () => Promise<unknown>
}

export interface MutationConfig<
  TProps = unknown,
  TResponse = unknown,
  TConverter = any,
> extends QueriesProps<TProps, TResponse, TConverter> {
  method: 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  onStateChange?: (state: MutationStateInternal<TResponse>) => void
}

export interface QueryResult<TResponse> {
  data?: TResponse
  isLoading: boolean
  isLoadingMapped: boolean
  isFetching: boolean
  isPending: boolean
  error: Error | null
  refetch: () => Promise<unknown>
}

export type MultipleQueryResponse<Q extends QueriesArray> = {
  [K in ExtractQuery<Q>['key']]: {
    data: ExtractQueryResponse<Q, K>['response']
    isLoading: boolean
    isLoadingMapped: boolean
    isFetching: boolean
    isPending: boolean
    error: Error | null
    refetch: () => Promise<unknown>
  }
}

export interface QueryConfig<K extends string, TResponse>
  extends CustomQueryOptions<TResponse> {
  keyToMap: K
}

export type SingleQueryConfig<Q extends QueryDefinition<any, any, any, any>> =
  Q extends QueryDefinition<infer K, infer T, infer P, infer R, infer C>
    ? T extends 'mutation'
      ? { type: 'mutation'; mutationConfig: MutationConfig<P, R, C>; key: K }
      : T extends 'query'
        ? {
            type: 'query'
            queryConfig?: Omit<QueryConfig<K, R>, 'keyToMap'>
            key: K
          }
        : WebSocketDefinition<K>
    : never

export type QueryAtIndex<Q extends QueriesArray, I extends keyof Q> =
  Q[I] extends QueryDefinition<infer K, infer T, infer P, infer R, infer C>
    ? QueryDefinition<K, T, P, R, C>
    : never

export type QueryConfigArray<Q extends QueriesArray> = {
  [I in keyof Q]: SingleQueryConfig<QueryAtIndex<Q, I>>
}

export interface ContextValue<Q extends QueriesArray> {
  allMutation: AllMutation<Q>
  allQuery: MultipleQueryResponse<Q>
  allWebSocket: MultipleWebSocketResponse<Q[number]['key']>
  refreshQueries: () => void
}

export type MultipleWebSocketResponse<K extends string = string> = {
  [key in K]: WebSocketResult
}

export type MutationItem<Q extends QueriesArray> = Extract<
  QueryConfigArray<Q>[number],
  { type: 'mutation'; mutationConfig: any }
>

export type QueryItem<Q extends QueriesArray> = Extract<
  QueryConfigArray<Q>[number],
  { type: 'query' }
>

// WebSocket types
export interface WebSocketDefinition<TKey extends string = string> {
  key: TKey
  endpoint?: string
  onMessage?: (data: any) => void
  invalidateQueriesOnMessage?: Array<string>
  autoConnect?: boolean
  type: 'websocket'
}

export type WebSocketsArray = Array<WebSocketDefinition<string>>

export interface WebSocketResult {
  lastMessage: any
  sendMessage: (message: any) => void
  status: 'connecting' | 'open' | 'closed'
}

// Types for useMultipleMutation
export interface MutationStateInternal<TData = unknown> {
  status: 'idle' | 'pending' | 'success' | 'error'
  data: TData | undefined
  error: Error | null
  submittedAt: number | null
  variables: unknown | undefined
}

export type MutationActionInternal =
  | { type: 'RESET'; key: string }
  | { type: 'PENDING'; key: string; submittedAt: number; variables: unknown }
  | { type: 'SUCCESS'; key: string; data: unknown }
  | { type: 'ERROR'; key: string; error: Error }

type StringKey<T> = Extract<keyof T, string>
type QueryTopKey<Q extends QueriesArray> = StringKey<MultipleQueryResponse<Q>>
type QuerySubKey<Q extends QueriesArray, K extends QueryTopKey<Q>> = StringKey<
  MultipleQueryResponse<Q>[K]
>
type QueryCompositeKey<Q extends QueriesArray> = {
  [K in QueryTopKey<Q>]: K | `${K}.${QuerySubKey<Q, K>}`
}[QueryTopKey<Q>]
type QueryValue<
  Q extends QueriesArray,
  K extends QueryCompositeKey<Q>,
> = K extends `${infer Top}.${infer Sub}`
  ? Top extends QueryTopKey<Q>
    ? Sub extends QuerySubKey<Q, Top>
      ? MultipleQueryResponse<Q>[Top][Sub]
      : never
    : never
  : K extends QueryTopKey<Q>
    ? MultipleQueryResponse<Q>[K]
    : never

type MutationTopKey<Q extends QueriesArray> = StringKey<AllMutation<Q>>
type MutationSubKey<
  Q extends QueriesArray,
  K extends MutationTopKey<Q>,
> = StringKey<AllMutation<Q>[K]>
type MutationCompositeKey<Q extends QueriesArray> = {
  [K in MutationTopKey<Q>]: K | `${K}.${MutationSubKey<Q, K>}`
}[MutationTopKey<Q>]
type MutationValue<
  Q extends QueriesArray,
  K extends MutationCompositeKey<Q>,
> = K extends `${infer Top}.${infer Sub}`
  ? Top extends MutationTopKey<Q>
    ? Sub extends MutationSubKey<Q, Top>
      ? AllMutation<Q>[Top][Sub]
      : never
    : never
  : K extends MutationTopKey<Q>
    ? AllMutation<Q>[K]
    : never

export type GetApiValuesFunction<Q extends QueriesArray> = {
  // Queries
  <K extends QueryTopKey<Q>>(type: 'query', key: K): MultipleQueryResponse<Q>[K]
  <K extends QueryCompositeKey<Q>>(type: 'query', key: K): QueryValue<Q, K>
  <K extends QueryCompositeKey<Q>>(
    type: 'query',
    key: K,
    defaultValue: unknown,
  ): NonNullable<QueryValue<Q, K>>
  <K extends MutationCompositeKey<Q>>(
    type: 'mutation',
    key: K,
    defaultValue: unknown,
  ): NonNullable<MutationValue<Q, K>>
  <K extends QueryTopKey<Q>>(
    type: 'query',
    key: K,
    defaultValue: MultipleQueryResponse<Q>[K]['data'],
  ): MultipleQueryResponse<Q>[K]['data']
  <K extends QueryCompositeKey<Q>>(
    type: 'query',
    key: K,
    defaultValue: QueryValue<Q, K>,
  ): NonNullable<QueryValue<Q, K>>

  // Mutations
  <K extends MutationTopKey<Q>>(type: 'mutation', key: K): AllMutation<Q>[K]
  <K extends MutationCompositeKey<Q>>(
    type: 'mutation',
    key: K,
  ): MutationValue<Q, K>
  <K extends MutationTopKey<Q>>(
    type: 'mutation',
    key: K,
    defaultValue: AllMutation<Q>[K]['data'],
  ): AllMutation<Q>[K]['data']
  <K extends MutationCompositeKey<Q>>(
    type: 'mutation',
    key: K,
    defaultValue: MutationValue<Q, K>,
  ): NonNullable<MutationValue<Q, K>>

  (type: 'query' | 'mutation', key: string, defaultValue?: unknown): unknown
}
