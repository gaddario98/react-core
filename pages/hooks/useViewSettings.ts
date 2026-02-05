import { usePageValues } from './usePageValues'
import type { FieldValues } from '@gaddario98/react-form'
import type { QueriesArray } from '@gaddario98/react-queries'
import type { MappedItemsFunction, ViewSettings } from '../types'

/**
 * Specialized hook for managing view settings
 * Optimized to prevent unnecessary re-renders
 * @param viewSettings - View settings configuration (static or function)
 * @param allQuery - All query results
 * @param allMutation - All mutation handlers
 * @param formValues - Current form values
 * @param setValue - Form setValue function
 * @returns Processed view settings
 */

export function useViewSettings<
  F extends FieldValues,
  Q extends QueriesArray,
  V extends Record<string, unknown> = Record<string, unknown>,
>({
  viewSettings = {},
  pageId,
}: {
  viewSettings?: MappedItemsFunction<F, Q, ViewSettings, V> | ViewSettings
  pageId: string
}) {
  const { get, set } = usePageValues<F, Q, V>({ pageId })
  if (typeof viewSettings === 'function') {
    return viewSettings({
      get,
      set,
    })
  } else {
    return viewSettings
  }
}
