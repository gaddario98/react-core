import { useCallback, useMemo } from 'react'
import { usePageValues } from './usePageValues'
import type { FieldValues, FormManagerConfig, Submit } from '@gaddario98/react-form'
import type { QueriesArray } from '@gaddario98/react-queries'
import type { FormPageProps } from '../types'

/**
 * Specialized hook for managing form data processing
 * Uses useMemo to prevent unnecessary re-computation
 * @param form - Form configuration
 * @param isAllQueryMapped - Whether all queries are mapped
 * @param formValues - Current form values
 * @param extractMutationsHandle - Extracted mutations
 * @param extractQueryHandle - Extracted queries
 * @param setValue - Form setValue function
 * @returns Processed form data and submit handlers
 */
export function useFormData<
  F extends FieldValues,
  Q extends QueriesArray,
  V extends Record<string, unknown> = Record<string, unknown>,
>({ form, pageId }: { form?: FormPageProps<F, Q, V>; pageId: string }) {
  const { get, set } = usePageValues<F, Q, V>({ pageId })

  const hiddenMapped = useCallback(() => {
    const isHidden = form?.hidden
    if (!isHidden) return false
    if (typeof isHidden === 'function') {
      return isHidden({
        get,
        set,
      })
    } else {
      return !!isHidden
    }
  }, [form?.hidden, get, set])

  const mappedFormData = useMemo((): Array<FormManagerConfig<F>> => {
    if (!form?.data || hiddenMapped()) return []

    return (
      form.data
        .map((el) => {
          if (typeof el === 'function') {
            return el({ get, set })
          }
          return el
        })
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        .filter((el) => !!el)
        .map((el, i) => ({ ...el, key: el.key ?? `${i}` }))
    )
  }, [form, get, hiddenMapped, set])

  const formSubmit = useMemo((): Array<Submit<F>> => {
    if (!form?.submit || hiddenMapped()) return []

    const submitFn = form.submit
    return (
      typeof submitFn === 'function' ? submitFn({ get, set }) : submitFn
    ).map((el, i) => ({ ...el, key: el.key ?? `${i}` }))
  }, [form, hiddenMapped, get, set])

  return {
    mappedFormData,
    formSubmit,
  }
}
