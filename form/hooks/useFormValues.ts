import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import equal from 'fast-deep-equal'
import { useFormValue } from '../atoms'
import type {
  FieldValues,
  FormFunctionProps,
  GetFormValuesFunction,
} from '../types'
import type { DeepKeys, DeepValue } from '@tanstack/react-form'

const getValueAtPath = (
  obj: unknown,
  path: string,
  defaultObj?: unknown,
): unknown => {
  if (!path) return undefined
  const normalized = path.replace(/\[(\d+)\]/g, '.$1')
  const parts = normalized.split('.').filter(Boolean)
  let current: unknown = obj
  for (const part of parts) {
    if (!current || !Object.keys(current).length) {
      if (!defaultObj) return undefined
      current = { [part]: defaultObj }
    }
    if (typeof current !== 'object') return undefined
    current = (current as Record<string, unknown>)[part]
  }

  return current
}

export interface UseFormValuesProps {
  formId: string
  scopeId?: string
}

export const useFormValues = <F extends FieldValues>({
  formId,
}: UseFormValuesProps): FormFunctionProps<F> => {
  // We subscribe to the specific form entry in the atoms
  // Note: This subscription is a bit coarse (entire form entry), but we optimize re-renders locally
  // Ideally we would want to subscribe only to specific paths, but Jotai atoms are per-form.
  const formEntry = useFormValue(formId)
  const currentValues = useMemo(
    () => formEntry.formValues,
    [formEntry.formValues],
  )

  const subscriptions = useRef(new Map<string, unknown>())
  // trigger state is used to force re-render when a subscribed value changes
  const [trigger, setTrigger] = useState(0)

  // Ref to hold the latest values without causing re-renders itself
  const formRef = useRef({
    formValues: formEntry.formValues,
    setValue: formEntry.setValue,
  })

  useEffect(() => {
    formRef.current.setValue = formEntry.setValue
  }, [formEntry.setValue])

  useEffect(() => {
    let shouldTrigger = false
    subscriptions.current.forEach((_, path) => {
      const newValue = getValueAtPath(currentValues, path)
      const oldValue = getValueAtPath(formRef.current.formValues, path)
      if (!equal(newValue, oldValue)) {
        shouldTrigger = true
      }
    })

    formRef.current.formValues = currentValues
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (shouldTrigger) {
      setTrigger((c) => c + 1)
    }
  }, [currentValues])

  const get = useCallback(
    (key: string, defaultValue?: unknown) => {
      const val =
        getValueAtPath(formRef.current.formValues, key) ?? defaultValue
      subscriptions.current.set(key, val)
      return subscriptions.current.get(key)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [trigger],
  ) as GetFormValuesFunction<F>

  const set = useCallback(
    <TField extends DeepKeys<F>>(
      field: TField,
      value: DeepValue<F, TField>,
    ) => {
      formRef.current.setValue(field, value)
    },
    [],
  )

  return { get, set }
}
