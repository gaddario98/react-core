import { useCallback } from 'react'
import type { FieldValues, ViewSettingsContainerProps } from './types'

export interface DefaultFormContainerProps {
  children: React.ReactNode
}

const createDefaultContainer = () => {
  return ({ children }: ViewSettingsContainerProps) => {
    return children
  }
}

let DefaultContainer = createDefaultContainer()

const setDefaultFormContainer = (
  val: ({
    children,
  }: ViewSettingsContainerProps) => React.ReactNode,
) => {
  DefaultContainer = val
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const DefaultFormContainer = <_T extends FieldValues = FieldValues>({
  children,
}: ViewSettingsContainerProps) => {
  const handleSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const submitButton = form.querySelector('button[type="submit"]') as
      | HTMLButtonElement
      | undefined
    submitButton?.click()
  }, [])

  return (
    <form onSubmit={handleSubmit} className="gap-3 flex flex-col">
      {children}
    </form>
  )
}

export { DefaultContainer, setDefaultFormContainer, DefaultFormContainer }
