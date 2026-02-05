import { useEffect, useMemo, useState } from 'react'
import { QueryObserver, useApiConfigValue } from '@gaddario98/react-queries'
import { useFormManager  } from '@gaddario98/react-form'
import { useFormData } from './useFormData'
import type {
  FieldValues,
  FormManagerConfig,
  Submit,
} from '@gaddario98/react-form'
import type { FormPageProps } from '../types'
import type { QueriesArray } from '@gaddario98/react-queries'

export interface UsePageFormManagerProps<
  F extends FieldValues,
  Q extends QueriesArray,
  V extends Record<string, unknown> = Record<string, unknown>,
> {
  form?: FormPageProps<F, Q, V>
  pageId: string
  ns?: string
}

export const usePageFormManager = <
  F extends FieldValues,
  Q extends QueriesArray,
  V extends Record<string, unknown> = Record<string, unknown>,
>({
  form,
  pageId,
  ns,
}: UsePageFormManagerProps<F, Q, V>) => {
  const { queryClient } = useApiConfigValue()
  const [defaultValueQuery, setDefaultValueQuery] = useState<F | undefined>(
    form?.defaultValues,
  )

  useEffect(() => {
    if (!form?.defaultValueQueryKey) {
      // setDefaultValueQuery(form?.defaultValues)
      return
    }
    const initialData = queryClient.getQueryData<F>(form.defaultValueQueryKey)
    if (initialData) {
      // setDefaultValueQuery(initialData)
    }
    const observer = new QueryObserver<F>(queryClient, {
      queryKey: form.defaultValueQueryKey,
      enabled: true,
      notifyOnChangeProps: ['data'],
      refetchOnWindowFocus: false,
    })
    const unsubscribe = observer.subscribe((result) => {
      if (result.data !== undefined) {
        setDefaultValueQuery(result.data)
      }
    })
    return () => unsubscribe()
  }, [form?.defaultValueQueryKey, form?.defaultValues, queryClient])

  const defaultValues = useMemo(
    () =>
      ({
        ...(defaultValueQuery ?? {}),
        ...(form?.defaultValueQueryMap?.(defaultValueQuery) ?? {}),
      }) as F,
    [defaultValueQuery, form],
  )

  const { mappedFormData, formSubmit } = useFormData<F, Q, V>({
    form,
    pageId,
  })

  // Call useFormManager hook at top level (maintains hook order)
  const rawFormData = useFormManager({
    ...form,
    data: mappedFormData,
    ns,
    submit: formSubmit,
    id: pageId,
    formOptions: {
      defaultValues: defaultValues,
      ...(form?.formSettings ?? {}),
      formId: pageId,
    },
  })

  const formData = useMemo(
    () => ({
      ...rawFormData,
      formContents: rawFormData.formContents as Array<
        FormManagerConfig<F> | Submit<F>
      >,
    }),
    [rawFormData],
  )

  return {
    formData
  }
}
