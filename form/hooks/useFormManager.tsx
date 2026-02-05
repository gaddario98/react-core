import { useCallback, useEffect, useMemo, useRef } from 'react'
import { FormField } from '../FormField'
import { useSetFormState } from '../atoms'
import { useFormConfigValue } from '../config'
import { useFormValues } from './useFormValues'
import { useJotaiForm } from './useJotaiForm'
import type { FormNotificationMessage } from '../config'
import type { DeepKeys, DeepValue, Updater } from '@tanstack/react-form'
import type {
  FieldValues,
  FormFieldConfig,
  FormManagerConfig,
  FormManagerProps,
  GenericFieldApi,
  GenericFieldState,
  GenericFormApi,
  SetValueFunction,
  Submit,
  SubmitKeysArg,
  SubmitPayload,
  UseFormManagerProps,
} from '../types'
import type { JSX } from 'react'

export interface FormElements {
  index: number
  element: JSX.Element
  renderInFooter: boolean
  renderInHeader: boolean
  isSubmit?: boolean
}

type PayloadOf<
  F extends FieldValues,
  S extends Submit<F, SubmitKeysArg<F>>,
> = SubmitPayload<F, S extends Submit<F, infer K> ? K : undefined>

const trimObject = <T extends object>(obj?: T): T =>
  Object.entries(obj ?? {}).reduce(
    (prev, [key, val]) => ({
      ...prev,
      [key]:
        typeof val === 'string' && !['password', 'pPassword'].includes(key)
          ? val.trim()
          : val,
    }),
    {} as T,
  )
const RenderField = <F extends FieldValues = FieldValues>({
  field,
  fieldState,
  fieldProps,
  onFieldChange,
}: {
  field: GenericFieldApi<F>
  fieldState: GenericFieldState<F>
  fieldProps: FormManagerConfig<F>
  onFieldChange?: (value: F) => void
}) => {
  const config: FormFieldConfig<F> = useMemo(
    () => ({
      ...fieldProps,
      field,
      fieldState,
    }),
    [fieldProps, field, fieldState],
  )
  return (
    <FormField<F>
      config={config}
      ns={fieldProps.ns}
      globalErrorNs={fieldProps.errorNs}
      onFieldChange={onFieldChange}
    />
  )
}

const DynamicFieldItem = <F extends FieldValues>({
  item,
  form,
  globalErrorNs,
  formId,
}: {
  item: FormManagerProps<F>['data'][number]
  form: GenericFormApi<F>
  globalErrorNs?: string
  formId: string
}) => {
  const { get, set } = useFormValues<F>({ formId })

  const fieldProps = useMemo(() => {
    if (typeof item === 'function') {
      return item({ get, set })
    } else {
      return item
    }
  }, [get, set, item])

  const isHidden = useMemo(() => {
    if (!fieldProps.hidden) {
      return false
    } else if (typeof fieldProps.hidden === 'function') {
      return fieldProps.hidden({ get, set })
    } else {
      return !!fieldProps.hidden
    }
  }, [get, set, fieldProps])

  const rules = useMemo(() => {
    if (!fieldProps.rules) {
      return undefined
    } else if (typeof fieldProps.rules === 'function') {
      return fieldProps.rules({ get, set })
    } else {
      return fieldProps.rules
    }
  }, [get, set, fieldProps])

  const props = useMemo(() => {
    return {
      ...fieldProps,
      errorNs: fieldProps.errorNs ?? globalErrorNs,
    }
  }, [fieldProps, globalErrorNs])

  if (isHidden) {
    return <></>
  }

  return (
    <form.Field
      name={props.name}
      validators={rules}
      // eslint-disable-next-line react/no-children-prop
      children={(field) => (
        <RenderField<F>
          field={field}
          fieldState={field.state}
          fieldProps={props}
          onFieldChange={props.onFieldChange}
        />
      )}
    />
  )
}

const SubmitItem = <F extends FieldValues>({
  item,
  index,
  handlersRef,
}: {
  item: Submit<F>
  index: number
  handlersRef: React.MutableRefObject<{
    formControl: GenericFormApi<F>
    onInvalidHandle: (err: unknown, submitConfig: Submit<F>) => void
    createSubmitHandler: (
      submitConfig: Submit<F>,
    ) => (data: F) => Promise<unknown>
  }>
}) => {
  const handleClick = useCallback(async () => {
    const { formControl, createSubmitHandler, onInvalidHandle } =
      handlersRef.current

    // Partial or full validation logic
    let isValid = true

    const keys = item.values as ReadonlyArray<string> | undefined
    if (keys && keys.length > 0) {
      // Validate only specific fields
      await Promise.all(
        keys.map((key) => formControl.validateField(key, 'change')),
      )
      const hasError = keys.some((key) => {
        // This is a simplified check. TanStack form errors might be structured differently.
        // You might need deep checking if errors are nested objects.
        // For now assume flat or use lodash get if possible, but state.errors is usually flat-ish map in newer versions or object.
        // Checking standard TanStack: form.state.fieldMeta[key]?.errors
        const meta = formControl.getFieldMeta(key)
        return meta?.errors && meta.errors.length > 0
      })
      isValid = !hasError
    } else {
      // Validate all
      await formControl.validateAllFields('submit')
      isValid = formControl.state.isValid
    }

    if (!isValid) {
      onInvalidHandle(formControl.state.errors, item)
      return
    }

    const values = formControl.state.values
    // Call handlers
    await createSubmitHandler(item)(values)
  }, [item, handlersRef])

  const Component = useMemo(() => item.component, [item])
  if (item.hidden || !Component) return <></>

  return (
    <Component
      onClick={handleClick}
      index={index}
      key={`submit-${index}`}
      type={item.type || 'button'}
    />
  )
}

export const useFormManager = <F extends FieldValues = FieldValues>({
  data,
  onInvalid,
  submit = [],
  notification,
  formOptions,
  onValuesChange,
  globalErrorNs,
  id = 'form-manager',
}: UseFormManagerProps<F>) => {
  const formControl = useJotaiForm<F>(formOptions)
  const formState = useMemo(() => formControl.state, [formControl.state])
  const errors = useMemo(() => formState.errors, [formState.errors])
  const values = useMemo(() => formState.values, [formState.values])
  const setFormState = useSetFormState<F>(id)
  const { showNotification } = useFormConfigValue()

  const setValue = useCallback(
    <TField extends DeepKeys<F>>(
      field: TField,
      updater: Updater<DeepValue<F, TField>>,
    ) => formControl.setFieldValue(field, updater),
    [formControl],
  ) as SetValueFunction<F>

  useEffect(() => {
    setFormState({
      setValue,
      formValues: formState.values,
    })
    const unsubscribe = formControl.store.subscribe((store) => {
      setFormState({
        formValues: store.currentVal.values,
      })
    })

    return () => {
      unsubscribe()
    } /**/
  }, [formControl.store, setValue, formState.values, setFormState])

  const handleNotification = useCallback(
    (props: FormNotificationMessage) => {
      if (props.message) {
        showNotification?.(props)
      }
    },
    [showNotification],
  )

  const filterFormData = useCallback(
    <S extends Submit<F, SubmitKeysArg<F>>>(
      v: F,
      submitConfig: S,
    ): PayloadOf<F, S> => {
      const keys = submitConfig.values as ReadonlyArray<keyof F> | undefined
      if (!keys || keys.length === 0) {
        return v as PayloadOf<F, S>
      }

      const out = {} as Record<keyof F, F[keyof F]>
      for (const key of keys) {
        if (key in v) {
          out[key] = v[key]
        }
      }
      return out as PayloadOf<F, S>
    },
    [],
  )

  const processSubmit = useCallback(
    async <S extends Submit<F, SubmitKeysArg<F>>>(d: F, submitConfig: S) => {
      const filteredData = filterFormData(d, submitConfig)
      if (submitConfig.onSuccess) {
        return await submitConfig.onSuccess(filteredData)
      }
      throw new Error('No submit handler provided')
    },
    [filterFormData],
  )

  const handleError = useCallback(
    <S extends Submit<F, SubmitKeysArg<F>>>(
      error: unknown,
      submitConfig: S,
    ) => {
      if (submitConfig.onError) {
        submitConfig.onError(error as Error)
      }
      const notificationProps =
        typeof notification?.error === 'function'
          ? notification.error((error as Error).message)
          : notification?.error
      if (notificationProps?.message) {
        handleNotification(notificationProps)
      }
    },
    [handleNotification, notification],
  )

  const createSubmitHandler = useCallback(
    <S extends Submit<F, SubmitKeysArg<F>>>(submitConfig: S) =>
      async (dataSubmit: F) => {
        try {
          const res = await processSubmit(
            trimObject<F>(dataSubmit),
            submitConfig,
          )
          const notificationProps =
            typeof notification?.success === 'function'
              ? notification.success(res)
              : notification?.success
          if (notificationProps?.message) {
            handleNotification(notificationProps)
          }
          return res
        } catch (error) {
          handleError(error, submitConfig)
          throw error
        }
      },
    [processSubmit, notification, handleNotification, handleError],
  )

  const onInvalidHandle = useCallback(
    (err: unknown, submitConfig: Submit<F>) => {
      onInvalid?.(err)
      handleError(new Error('invalidData'), submitConfig)
    },
    [handleError, onInvalid],
  )

  const handlersRef = useRef({
    formControl,
    onInvalidHandle,
    createSubmitHandler,
    setValue: formControl.setFieldValue,
    trigger: formControl.validateField,
    onValuesChange,
  })

  useEffect(() => {
    handlersRef.current.onInvalidHandle = onInvalidHandle
    handlersRef.current.createSubmitHandler = createSubmitHandler
    handlersRef.current.setValue = formControl.setFieldValue
    handlersRef.current.trigger = formControl.validateField
    handlersRef.current.onValuesChange = onValuesChange
  }, [onInvalidHandle, createSubmitHandler, formControl, onValuesChange])

  const fields = useMemo(
    () =>
      data.map((item, index): FormElements => {
        const staticItem = typeof item === 'function' ? null : item
        return {
          index: staticItem?.index ?? index,
          element: (
            <DynamicFieldItem<F>
              key={staticItem?.name ?? index}
              item={item}
              form={formControl}
              globalErrorNs={globalErrorNs}
              formId={id}
            />
          ),
          renderInFooter: !!staticItem?.renderInFooter,
          renderInHeader: !!staticItem?.renderInHeader,
        }
      }),
    [data, formControl, globalErrorNs, id],
  )

  const submits = useMemo(
    () =>
      submit.map((submitConfig, index): FormElements => {
        return {
          index: submitConfig.index === undefined ? index : submitConfig.index,
          element: (
            <SubmitItem<F>
              key={`submit-${index}`}
              item={submitConfig}
              index={index}
              handlersRef={handlersRef}
            />
          ),
          renderInFooter: !!submitConfig.renderInFooter,
          renderInHeader: !!submitConfig.renderInHeader,
          isSubmit: true,
        }
      }),
    [submit],
  )

  const elements = useMemo(
    (): Array<FormElements> => fields.concat(submits),
    [fields, submits],
  )

  const formContents = useMemo(() => [...data, ...submit], [data, submit])

  useEffect(() => {
    handlersRef.current.onValuesChange?.(values, handlersRef.current.setValue)
  }, [values])

  return {
    elements,
    formContents,
    errors,
    formValues: values,
    setValue,
  }
}
