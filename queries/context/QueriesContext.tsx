import { QueryClientProvider } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { useApiConfigValue } from '../config'
import type { PropsWithChildren } from 'react'

export const QueriesProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const { queryClient, persistOptions } = useApiConfigValue()

  if (persistOptions?.persister) {
    return (
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={persistOptions}
      >{children}</PersistQueryClientProvider>
    )
  }

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}
