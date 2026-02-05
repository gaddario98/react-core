import { useEffect } from 'react'
import { useFormConfigState } from '../form'
import { useLocalizationConfigState } from '../localization'
import { usePageConfigState } from '../pages'
import { useApiConfigState } from '../queries'
import type { FormConfigProps } from '../form'
import type { LocalizationConfigProps } from '../localization'
import type { PageConfigProps } from '../pages'
import type { ApiConfig } from '../queries'

/**
 * Interfaccia che raccoglie tutte le configurazioni dei plugin di core
 */
export interface CoreConfig {
  form?: Partial<FormConfigProps>
  localization?: LocalizationConfigProps
  pages?: Partial<PageConfigProps>
  apiConfig?: Partial<ApiConfig>
}

/**
 * Hook per accedere a tutte le configurazioni dei plugin di core
 * Fornisce un'interfaccia centralizzata per le impostazioni dell'applicazione
 */
export const useCoreConfig = ({
  form,
  localization,
  pages,
  apiConfig,
}: CoreConfig) => {
  const [currentFormConfig, setFormConfig] = useFormConfigState()
  const [currentLocalizationConfig, setLocalizationConfig] =
    useLocalizationConfigState()
  const [currentPageConfig, setPageConfig] = usePageConfigState()
  const [currentApiConfig, setApiConfig] = useApiConfigState()

  useEffect(() => {
    setFormConfig({ ...currentFormConfig, ...form })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form])

  useEffect(() => {
    setLocalizationConfig({ ...currentLocalizationConfig, ...localization })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(localization)])

  useEffect(() => {
    setPageConfig({ ...currentPageConfig, ...pages })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pages])

  useEffect(() => {
    setApiConfig({
      ...currentApiConfig,
      ...apiConfig,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiConfig])
}
