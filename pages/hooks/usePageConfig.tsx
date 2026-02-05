import { useMemo } from 'react'
import { useApi } from '@gaddario98/react-queries'
import { usePageConfigValue } from '../config'
import { useViewSettings } from './useViewSettings'
import { usePageFormManager } from './usePageFormManager'
import { usePageValues } from './usePageValues'
import type { FieldValues } from '@gaddario98/react-form'
import type { QueriesArray, QueryConfigArray } from '@gaddario98/react-queries'
import type {
  FormPageProps,
  LazyLoadingConfig,
  MappedItemsFunction,
  MetadataConfig,
  QueryPageConfigArray,
  ViewSettings,
} from '../types'

const EMPTY_ARRAY: [] = []

export const usePageConfig = <
  F extends FieldValues,
  Q extends QueriesArray,
  V extends Record<string, unknown> = Record<string, unknown>,
>({
  queries = EMPTY_ARRAY as QueryPageConfigArray<F, Q, V>,
  form,
  ns,
  viewSettings = {},
  meta,
  lazyLoading,
  variables,
  pageId,
}: {
  queries: QueryPageConfigArray<F, Q, V>
  form?: FormPageProps<F, Q, V>
  ns: string
  viewSettings?: MappedItemsFunction<F, Q, ViewSettings, V> | ViewSettings
  // Metadata and lazy loading configuration
  meta?: MetadataConfig<F, Q>
  lazyLoading?: LazyLoadingConfig
  variables?: V
  pageId: string
}) => {
  // Use global config usage if needed, but per-page config is primary
  const globalConfig = usePageConfigValue()

  // 1. Form Management
  const { formData } = usePageFormManager<F, Q, V>({
    form,
    pageId,
    ns,
  })
  const { get, set } = usePageValues<F, Q, V>({
    pageId,
    initialValues: variables,
  })

  // 2. Query Generation

  const processedQueries = useMemo((): QueryConfigArray<Q> => {
    return queries.map((q) => {
      if (q.type === 'mutation') {
        const mutationConfig =
          typeof q.mutationConfig === 'function'
            ? q.mutationConfig<Q>({ get, set })
            : q.mutationConfig
        return {
          ...q,
          mutationConfig,
        }
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      } else if (q.type === 'query') {
        const queryConfig =
          typeof q.queryConfig === 'function'
            ? q.queryConfig<Q>({ get, set })
            : q.queryConfig
        return {
          ...q,
          queryConfig,
        }
      }
      return q
    }) as QueryConfigArray<Q>
  }, [queries, get, set])

  useApi<Q>(processedQueries, {
    persistToAtoms: true,
    scopeId: pageId,
  })

  const mappedViewSettings = useViewSettings<F, Q, V>({
    viewSettings,
    pageId,
  })

  // Merge custom configuration with defaults
  const mergedConfig = useMemo(() => {
    return {
      formData,
      form,
      mappedViewSettings,
      meta,
      lazyLoading,
      globalConfig, // Expose global config if needed
    }
  }, [
    formData,
    form,
    mappedViewSettings,
    meta,
    lazyLoading,
    globalConfig,
  ])

  return mergedConfig
}
