import { atomStateGenerator } from '@gaddario98/react-state'
import type { Locale, TranslationResources } from './types'

export interface LocalizationConfigProps {
  currentLocale: Locale
  locales: Record<Locale, TranslationResources>
}

// Lazy initialization to avoid side effects at module load time
const _localizationConfig: LocalizationConfigProps = {
  currentLocale: 'it',
  locales: {
    it: {},
  },
}

export const {
  atom: localizationConfigAtom,
  useValue: useLocalizationConfigValue,
  useState: useLocalizationConfigState,
  useReset: useLocalizationConfigReset,
} = atomStateGenerator<LocalizationConfigProps>({
  key: 'localizationConfig',
  defaultValue: _localizationConfig,
  persist: true,
})

/**
 * Hook per gestire le operazioni di localization
 */
export const useLocalizationActions = () => {
  const [config, setConfig] = useLocalizationConfigState()
  return {
    /**
     * Aggiunge o aggiorna una locale con le sue risorse
     */
    addLocale: (locale: Locale, resources: TranslationResources) => {
      setConfig({
        ...config,
        locales: {
          ...config.locales,
          [locale]: resources,
        },
      })
    },

    /**
     * Switch alla locale specificata
     */
    switchLocale: (locale: Locale) => {
      setConfig({
        ...config,
        currentLocale: locale,
      })
    },

    /**
     * Inizializza con una locale di default
     */
    initializeLocale: (locale: Locale, resources: TranslationResources) => {
      setConfig({
        currentLocale: locale,
        locales: {
          [locale]: resources,
        },
      })
    },
  }
}
