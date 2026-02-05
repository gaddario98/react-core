import { useCallback } from 'react'
import { useApiConfigValue } from '../config'

export const useInvalidateQueries = () => {
  const { queryClient } = useApiConfigValue()
  const invalidateQueries = useCallback(
    async (queryKeys: Array<Array<string>>) => {
      await Promise.all(
        queryKeys.map(async (queryKey) => {
            await queryClient.invalidateQueries<Array<string>>({ queryKey, exact: false })
          
        }),
      )
    },
    [queryClient],
  )

  return { invalidateQueries }
}
