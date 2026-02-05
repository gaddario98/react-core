import { atomStateGenerator } from '@gaddario98/react-state'
import { QueryClient } from '@tanstack/react-query'
import { apiRequest } from './utils/request'
import type { ApiMethod, Endpoint } from './types'
import type { PersistQueryClientOptions } from '@tanstack/react-query-persist-client'
import type { AxiosRequestConfig } from 'axios'

export interface EncryptionConfig {
  secretKey: string
  enabled?: boolean
  // Optional custom functions to override default AES-GCM
  encryptFn?: (data: unknown, key: string) => Promise<string>
  decryptFn?: (data: string, key: string) => Promise<unknown>
}
// Lazy initialization to avoid side effects at module load time

export type ApiConverter<TProps, TConverter> = (props: TProps) => TConverter
export interface ApiRequestFnProps<TProps, TConverter = TProps> {
  url: string
  method: ApiMethod
  body?: TProps
  headers?: AxiosRequestConfig['headers']
  converter?: ApiConverter<TProps, TConverter>
}
export interface ApiNotificationMessage {
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
  autoHideDuration?: number
  textTransOption?: Record<string, unknown>
  ns?: string
}
export interface ApiConfig {
  endpoints: Endpoint
  requestFn: <TProps, TResponse, TConverter = TProps>(
    props: ApiRequestFnProps<TProps, TConverter>,
  ) => Promise<TResponse>
  validateAuthFn?: () => boolean
  defaultHeaders?: Record<string, string>
  persistOptions?: Omit<PersistQueryClientOptions, 'queryClient'>
  queryClient: QueryClient
  websocketConfig?: {
    url: string
    onMessage?: (message: unknown) => void
    autoConnect?: boolean
  }
  encryption?: EncryptionConfig
  showNotification?: (notification: ApiNotificationMessage) => void
}
const _endpoints: Endpoint = {
  custom: '',
  api: 'http://localhost:3000', // import.meta.env.VITE_API_URL ||
}

const defaultQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
    //  staleTime: 2 * 60 * 1000,
    },
  },
})
export const {
  atom: apiConfigAtom,
  useValue: useApiConfigValue,
  useState: useApiConfigState,
  useReset: useApiConfigReset,
} = atomStateGenerator<ApiConfig>({
  key: 'apiConfig',
  defaultValue: {
    endpoints: _endpoints,
    requestFn: apiRequest,
    queryClient: defaultQueryClient,
  },
  persist: false,
})
