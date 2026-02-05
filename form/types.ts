/* eslint-disable @typescript-eslint/no-explicit-any */
import type { FormNotificationMessage,FormTranslationOptions } from './config'
import type { UseCustomFormOptions } from './hooks'
import type {
  DeepKeys,
  DeepValue,
  FieldApi,
  FieldState,
  ReactFormExtendedApi,
} from '@tanstack/react-form'
import type { PropsWithChildren } from 'react'
import type React from 'react'

// Polyfill FieldValues as it is not exported by tanstack/react-form
export type FieldValues = Record<string, any>

// Helper types to handle the many generics of TanStack Form
// useForm returns an object that includes FormApi but also components like Field, Subscribe
export type SetValueFunction<F extends FieldValues> = <
  TField extends DeepKeys<F>,
>(
  field: TField,
  value: DeepValue<F, TField>,
) => void

export type GetFormValuesFunction<F extends FieldValues> = {
  // Form values
  <TField extends DeepKeys<F>>(key: TField): DeepValue<F, TField> | undefined

  <TField extends DeepKeys<F>>(
    key: TField,
    defaultValue: DeepValue<F, TField>,
  ): NonNullable<DeepValue<F, TField>>
}

export type GenericFormApi<TData extends FieldValues> = ReactFormExtendedApi<
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
>

export type GenericFieldApi<TData extends FieldValues> = FieldApi<
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
  any,
  any
>

export type GenericFieldState<TData extends FieldValues> = FieldState<
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
>

export type SubmitKeysArg<T> = ReadonlyArray<keyof T> | undefined

export type SubmitPayload<T, K extends SubmitKeysArg<T>> =
  K extends ReadonlyArray<keyof T> ? Pick<T, K[number]> : T

export type FormFunctionProps<F extends FieldValues> = {
  get: GetFormValuesFunction<F>
  set: SetValueFunction<F>
}

export interface Submit<
  T extends FieldValues = FieldValues,
  K extends SubmitKeysArg<T> = SubmitKeysArg<T>,
> {
  onSuccess?: (values: T) => void
  onError?: (err: Error) => void
  values?: K
  index?: number
  buttonProps?: Record<string, unknown>
  renderInFooter?: boolean
  hidden?: boolean
  renderInHeader?: boolean
  isDisabled?: boolean
  isDraggable?: boolean
  isInDraggableView?: boolean
  isLoading?: boolean
  usedBoxes?: number
  type?: 'submit' | 'button'
  key?: string
  component?: (props: {
    onClick: () => void
    index: number
    key: string
    type: 'submit' | 'button'
  }) => React.JSX.Element
}

export interface ViewSettingsContainerProps {
  children: React.ReactNode
}

export type FormManagerProps<T extends FieldValues = FieldValues> = {
  data: Array<
    | FormManagerConfig<T>
    | ((props: FormFunctionProps<T>) => FormManagerConfig<T>)
  >
  defaultValues: T
  onInvalid?: (err: unknown) => void
  isHiddenErrors?: boolean
  ns?: string
  globalErrorNs?: string
  submit?: Array<Submit<T>>
  notification?: {
    success?: FormNotificationMessage | ((res: unknown) => FormNotificationMessage)
    error?: FormNotificationMessage | ((error: string) => FormNotificationMessage)
    ns?: string
  }
  onValuesChange?: (props: T, setValue: (name: any, value: any) => void) => void
  formSettings?: UseCustomFormOptions<T>
  isDraggable?: boolean
  isInDraggableView?: boolean
  id?: string
  viewSettings?: {
    container?: React.ComponentType<ViewSettingsContainerProps>
    submitContainer?: React.ComponentType<ViewSettingsContainerProps>
    bodyContainer?: React.ComponentType<ViewSettingsContainerProps>
    containerProps?: Record<string, unknown>
    submitContainerProps?: Record<string, unknown>
    bodyContainerProps?: Record<string, unknown>
  }
}

export type UseFormManagerProps<T extends FieldValues> = {
  data: Array<
    | FormManagerConfig<T>
    | ((props: FormFunctionProps<T>) => FormManagerConfig<T>)
  >
  onInvalid?: (err: unknown) => void
  formOptions: UseCustomFormOptions<T>
  isHiddenErrors?: boolean
  ns?: string
  globalErrorNs?: string
  submit?: Array<Submit<T>>
  notification?: {
    success?: FormNotificationMessage | ((res: unknown) => FormNotificationMessage)
    error?: FormNotificationMessage | ((error: string) => FormNotificationMessage)
    ns?: string
  }
  onValuesChange?: (props: T, setValue: (name: any, value: any) => void) => void
  id?: string
}

export interface FieldComponentProps<T extends FieldValues> {
  value: any
  onChange: (value: any) => void
  onBlur: () => void
  error?: boolean
  errorMessage?: string
  formValues?: T
  label?: string
  helperMessage?: string
}

export type FormManagerConfig<T extends FieldValues> = Omit<
  FormFieldConfig<T>,
  'field' | 'fieldState' | 'fieldValues'
>

export type MappedFormItemsFunction<F extends FieldValues, ComponentType> = (
  props: FormFunctionProps<F>,
) => ComponentType

export type Rules = {
  validate?: (value: any) => string | undefined | Promise<string | undefined>
  onChange?: (value: any) => void
  onBlur?: () => void
  onMount?: (value: any) => void
}

export type FormFieldConfig<T extends FieldValues> = {
  name: any // TanStack form defines deeply nested accessors which are hard to type strictly
  label?: string
  rules?: Rules | MappedFormItemsFunction<T, Rules>
  field: GenericFieldApi<T>
  fieldState: GenericFieldState<T>
  containerStyle?: string
  component: (
    props: Omit<FieldComponentProps<T>, 'formValues'>,
  ) => React.JSX.Element
  container?: React.FC<PropsWithChildren>
  ns?: string
  errorNs?: string
  index?: number
  renderInFooter?: boolean
  renderInHeader?: boolean
  usedBoxes?: number
  key?: string
  isDraggable?: boolean
  isInDraggableView?: boolean
  helper?: {
    text?: string
    translationOption?: FormTranslationOptions
  }
  onFieldChange?: (value: any) => void
  hidden?: boolean | MappedFormItemsFunction<T, boolean>
}

export interface ErrorComponentProps {
  message?: string
  fieldName?: string
}

export interface FormContainerProps {
  className?: string
  children: React.ReactNode
}

export interface FormFieldProps<T extends FieldValues> {
  config: FormFieldConfig<T>
  onFieldChange?: (value: T) => void
  ns?: string
  globalErrorNs?: string
  container?: React.FC<PropsWithChildren>
}
