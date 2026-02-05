import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai'
import { selectAtom } from 'jotai/utils'
import { useCallback, useMemo } from 'react'
import type { FieldValues, SetValueFunction } from '../types'

export interface FormStoreEntry<F extends FieldValues = FieldValues> {
  formValues: F
  setValue: SetValueFunction<F>
}

export const DEFAULT_FORM_ENTRY: FormStoreEntry<FieldValues> = Object.freeze({
  formValues: {} as FieldValues,
  setValue: () => {},
})

/**
 * Global atom storing all form state.
 * Key format: "scopeId:formId" or just "formId" for backward compatibility.
 */
export const formAtom = atom<Record<string, FormStoreEntry>>({})

/**
 * Helper to generate composite keys for forms.
 */
export const getFormCompositeKey = (scopeId: string, key: string): string =>
  `${scopeId}:${key}`

/**
 * Creates a derived atom for accessing forms of a specific scope.
 */
export const createScopeFormsAtom = (scopeId: string) =>
  atom(
    (get) => {
      const allForms = get(formAtom)
      const prefix = `${scopeId}:`
      const scopeForms: Record<string, FormStoreEntry> = {}

      for (const [key, value] of Object.entries(allForms)) {
        if (key.startsWith(prefix)) {
          scopeForms[key.slice(prefix.length)] = value
        }
      }

      return scopeForms
    },
    (get, set, update: Record<string, FormStoreEntry>) => {
      const allForms = get(formAtom)
      const prefix = `${scopeId}:`
      const newForms = { ...allForms }

      // Remove old scope entries
      for (const key of Object.keys(newForms)) {
        if (key.startsWith(prefix)) {
          delete newForms[key]
        }
      }

      // Add new scope entries
      for (const [key, value] of Object.entries(update)) {
        newForms[`${prefix}${key}`] = value
      }

      set(formAtom, newForms)
    },
  )

export const createFormSelector = <F extends FieldValues = FieldValues>(
  formId: string,
) =>
  selectAtom(
    formAtom,
    (forms) => {
      const entry = forms[formId] as FormStoreEntry<F> | undefined
      return entry ?? (DEFAULT_FORM_ENTRY as unknown as FormStoreEntry<F>)
    },
    (a, b) =>
      a === b || (a.formValues === b.formValues && a.setValue === b.setValue),
  )

export const useFormValue = <F extends FieldValues>(formId: string) => {
  const selectorAtom = useMemo(() => createFormSelector<F>(formId), [formId])
  return useAtomValue(selectorAtom)
}

export const useFormState = <F extends FieldValues>() => {
  return useAtom(formAtom) as unknown as [
    Record<string, FormStoreEntry<F>>,
    (value: Record<string, FormStoreEntry<F>>) => void,
  ]
}

export const useSetFormState = <F extends FieldValues>(formId: string) => {
  const setForms = useSetAtom(formAtom)

  return useCallback(
    (val: Partial<FormStoreEntry<F>>) => {
      setForms((prev) => {
        const prevEntry =
          (prev[formId] as FormStoreEntry<FieldValues> | undefined) ??
          DEFAULT_FORM_ENTRY

        return {
          ...prev,
          [formId]: {
            ...(prevEntry as unknown as FormStoreEntry<F>),
            ...(val as unknown as Partial<FormStoreEntry<FieldValues>>),
          } as unknown as FormStoreEntry<FieldValues>,
        }
      })
    },
    [formId, setForms],
  )
}
