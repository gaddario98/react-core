/* eslint-disable react-hooks/refs */
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useFormConfigValue } from './config'
import type { FieldValues, FormFieldProps } from './types'

export const FormField = <T extends FieldValues>({
  config,
  onFieldChange,
  ns: globalNs,
  globalErrorNs,
}: FormFieldProps<T>) => {
  const ns = config.ns ?? globalNs
  const errorNs = config.errorNs ?? globalErrorNs
  const { formFieldContainer, translateText } = useFormConfigValue()

  // TanStack Form uses field.state.meta.errors which is an array of ValidationError
  const firstError =
    config.field.state.meta.errors.length > 0
      ? config.field.state.meta.errors[0]
      : undefined
  const errorMessageStr = firstError ? String(firstError) : undefined

  const errorMessage = useMemo(() => {
    if (!errorMessageStr) return undefined
    return errorNs
      ? translateText?.(errorMessageStr, {
          ns: errorNs || '',
          defaultValue: '',
        })
      : errorMessageStr
  }, [errorMessageStr, errorNs, translateText])

  const label = useMemo(
    () => (ns ? translateText?.(config.label ?? '') : config.label),
    [ns, config.label, translateText],
  )

  const helperMessage = useMemo(
    () =>
      config.helper?.text
        ? translateText?.(config.helper.text, config.helper.translationOption)
        : '',
    [config.helper, translateText],
  )

  const ref = useRef({ onFieldChange, handleChange: config.field.handleChange })

  useEffect(() => {
    ref.current = {
      onFieldChange,
      handleChange: config.field.handleChange,
    }
  }, [config.field.handleChange, onFieldChange])

  const handleChange = useCallback((value: T) => {
    // TanStack Form handleChange usually expects just the value for input
    // but if we are manually calling it we should pass the value.
    ref.current.handleChange(value)
    ref.current.onFieldChange?.(value)
  }, [])

  const handleBlur = useCallback(() => {
    config.field.handleBlur()
  }, [config.field])

  const baseProps = useMemo(
    () => ({
      value: config.field.state.value,
      onChange: handleChange,
      onBlur: handleBlur,
      error: config.field.state.meta.errors.length > 0,
      errorMessage,
      label,
      helperMessage,
    }),
    [
      config.field.state.value,
      handleChange,
      handleBlur,
      config.field.state.meta.errors.length,
      errorMessage,
      label,
      helperMessage,
    ],
  )

  const ConfigContainer = useMemo(() => config.container, [config.container])
  const FormFieldContainer = useMemo(
    () => formFieldContainer,
    [formFieldContainer],
  )

  if (ConfigContainer) {
    return (
      <ConfigContainer>
        {config.component(baseProps)}
      </ConfigContainer>
    )
  }
  return (
    <FormFieldContainer>
      {config.component(baseProps)}
    </FormFieldContainer>
  )
}
