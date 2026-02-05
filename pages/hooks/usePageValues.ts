import { useCallback, useEffect, useRef, useState } from 'react'
import equal from 'fast-deep-equal'
import { useFormValues } from '@gaddario98/react-form'
import { useAtom } from 'jotai'
import { useApiValues } from '@gaddario98/react-queries'
import { pageVariablesAtomFamily } from '../utils'
import type { FieldValues} from '@gaddario98/react-form';
import type { QueriesArray } from '@gaddario98/react-queries'
import type { GetFunction, SetFunction } from '../types'
import type { DeepKeys } from '@tanstack/react-form'

const getValueAtPath = (obj: unknown, path: string): unknown => {
  if (!path) return undefined
  const normalized = path.replace(/\[(\d+)\]/g, '.$1')
  const parts = normalized.split('.').filter(Boolean)
  let current: unknown = obj

  for (const part of parts) {
    if (current == null) return undefined
    if (typeof current !== 'object') return undefined
    current = (current as Record<string, unknown>)[part]
  }

  return current
}

interface UsePageValuesProps<
  V extends Record<string, unknown> = Record<string, unknown>,
> {
  pageId: string
  initialValues?: V
}

export const usePageValues = <
  F extends FieldValues,
  Q extends QueriesArray,
  V extends Record<string, unknown> = Record<string, unknown>,
>({
  pageId,
  initialValues,
}: UsePageValuesProps) => {
  const { get: getApiValues } = useApiValues<Q>({ scopeId: pageId })
  const { get: getFormValues, set: setFormValues } = useFormValues<F>({
    formId: pageId,
  })
  const subscriptions = useRef(new Map<string, unknown>())
  const [trigger, setTrigger] = useState(0)
  const [pageVariables, setPageVariables] = useAtom(
    pageVariablesAtomFamily(pageId),
  )

  const initialized = useRef(false)
  useEffect(() => {
    if (!initialized.current && initialValues) {
      setPageVariables(initialValues)
      initialized.current = true
    }
  }, [initialValues, setPageVariables])

  const dataRef = useRef({
    state: pageVariables,
  })

  // Sync dataRef with latest values
  useEffect(() => {
    let internalTrigger = false
    subscriptions.current.forEach((_, key) => {
      const [type, keyPath] = key.split(':')
      if (type === 'state') {
        const newValue = getValueAtPath(pageVariables, keyPath)
        const oldValue = getValueAtPath(dataRef.current.state, keyPath)
        internalTrigger = internalTrigger || !equal(newValue, oldValue)
      }
    })
    dataRef.current = {
      state: pageVariables,
    }
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (internalTrigger) {
      setTrigger((v) => v + 1)
    }
  }, [pageVariables])

  // get che legge dallo store e registra le dipendenze
  const get = useCallback(
    <Ty extends 'mutation' | 'query' | 'form' | 'state'>(
      type: Ty,
      key: Parameters<GetFunction<F, Q, V>>[1],
      defaultValue: Parameters<GetFunction<F, Q, V>>[2],
    ) => {
      const keyMap = `${type}:${key}`

      switch (type) {
        case 'mutation': {
          const value = getApiValues(type, key, defaultValue)
          subscriptions.current.set(keyMap, value)
          break
        }
        case 'query': {
          const value = getApiValues(type, key, defaultValue)
          subscriptions.current.set(keyMap, value)
          break
        }
        case 'form': {
          const value = getFormValues<DeepKeys<F>>(key, defaultValue)
          subscriptions.current.set(keyMap, value)
          break
        }
        case 'state': {
          const value =
            getValueAtPath(dataRef.current['state'], String(key)) ??
            defaultValue
          subscriptions.current.set(keyMap, value)
          break
        }
      }

      return subscriptions.current.get(keyMap)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pageId, trigger, getApiValues, getFormValues],
  ) as GetFunction<F, Q, V>

  // set stabile
  const set = useCallback(
    (type: 'form' | 'state') => {
      if (type === 'form') {
        return setFormValues
      }
      return (key: string, value: unknown) => {
        setPageVariables((prev) => ({ ...prev, [key]: value }))
      }
    },
    [setPageVariables, setFormValues],
  ) as SetFunction<F, V>

  return { get, set }
}
