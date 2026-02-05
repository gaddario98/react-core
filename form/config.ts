import { atomStateGenerator } from '@gaddario98/react-state'
import type { PropsWithChildren } from 'react'

export interface FormNotificationMessage {
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
  autoHideDuration?: number
  textTransOption?: Record<string, unknown>
  ns?: string
}
export interface FormTranslationOptions {
  [key: string]: string | number | boolean | undefined
  ns?: string
}
export interface FormConfigProps {
  formFieldContainer: React.FC<PropsWithChildren>
  showNotification?: (notification: FormNotificationMessage) => void
  translateText?: (key: string, options?: FormTranslationOptions) => string
}

const DefaultContainer = ({ children }: PropsWithChildren) => {
  return children
}
// Lazy initialization to avoid side effects at module load time
const _formConfig: FormConfigProps = {
  formFieldContainer: DefaultContainer,
}

export const {
  atom: formConfigAtom,
  useValue: useFormConfigValue,
  useState: useFormConfigState,
  useReset: useFormConfigReset,
} = atomStateGenerator<FormConfigProps>({
  key: 'formConfig',
  defaultValue: _formConfig,
  persist: false,
})
