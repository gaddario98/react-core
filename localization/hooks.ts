import { useMemo } from 'react'
import { useLocalizationConfigValue } from './config'
import { resolveTranslation } from './core';
import type { Locale, TranslateFunction } from './types'

export const useTranslation = (
  _ns?: string,
): { t: TranslateFunction; locale: Locale } => {
  const { currentLocale, locales } = useLocalizationConfigValue()
  const resources = useMemo(
    () => locales[currentLocale],
    [locales, currentLocale],
  )

  const t = useMemo<TranslateFunction>(() => {
    return (key, options) =>
      resolveTranslation(
        _ns ? `${_ns}.${key}` : key,
        resources,
        options,
        currentLocale,
      )
  }, [resources, currentLocale, _ns])

  return { t, locale: currentLocale }
}
