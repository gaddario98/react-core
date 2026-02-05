import { resolveTranslation } from './core'
import type { Locale, TranslateFunction, TranslationResources } from './types'

/**
 * Crea un'istanza di traduzione per l'uso lato server (o fuori dai componenti React).
 */
export const createServerTranslator = (
  resources: TranslationResources,
  locale: Locale = 'it', // Default locale hardcoded per ora, o passato come argomento
): { t: TranslateFunction; locale: Locale } => {
  const t: TranslateFunction = (key, options) => {
    return resolveTranslation(key, resources, options)
  }

  return { t, locale }
}
