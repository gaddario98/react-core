import { useCallback } from 'react'
import { useTranslation } from './hooks'
import type { TranslationOptions } from './types'

// Mantengo l'interfaccia TranslationFunction per compatibilità
export type TranslationFunction = (
  key: string,
  options?: TranslationOptions,
) => string

/**
 * Hook per tradurre testi che si adatta al sistema di traduzione interno.
 * Wrapper di retro-compatibilità per useTranslation.
 *
 * @param ns - Namespace opzionale (ignorato nella nuova implementazione)
 * @returns Un oggetto con la funzione traslateText (e alias t)
 */
export const useTranslatedText = (ns?: string) => {
  const { t } = useTranslation(ns)

  const traslateText = useCallback(
    (text: string, options?: TranslationOptions) => {
      if (!text) return ''
      return t(text, options)
    },
    [t],
  )

  return { traslateText, t: traslateText }
}
