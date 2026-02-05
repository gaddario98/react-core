/* eslint-disable @typescript-eslint/no-explicit-any */
import {  useForm } from '@tanstack/react-form'
import type {FormOptions} from '@tanstack/react-form';
import type { FieldValues } from '../types'

export interface UseCustomFormOptions<TData extends FieldValues>
  extends FormOptions<
    TData,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any
  > {
  formId?: string
}

export function useJotaiForm<TData extends FieldValues>(formOptions: UseCustomFormOptions<TData>) {
  const form = useForm<
    TData,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any,
    any
  >(formOptions)

  return form
}
