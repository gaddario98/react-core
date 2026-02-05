export type Locale = string

export type TranslationResources = Record<string, any>

/**
 * Opzioni di formattazione per i diversi tipi di valori
 */
export interface FormatOptions {
  number?: Intl.NumberFormatOptions
  date?: Intl.DateTimeFormatOptions
  currency?: Intl.NumberFormatOptions & { currency?: string }
}

/**
 * Opzioni per la traduzione con supporto parametri avanzati
 */
export interface TranslationOptions {
  [key: string]: any
  defaultValue?: string
  /**
   * Opzioni di formattazione per i parametri specifici
   *
   * @example
   * ```ts
   * t('welcome', {
   *   price: 1234.56,
   *   formatOptions: {
   *     price: {
   *       currency: { currency: 'EUR', minimumFractionDigits: 2 }
   *     }
   *   }
   * })
   * ```
   */
  formatOptions?: Record<string, FormatOptions>
  ns?: string
}

/**
 * Funzione di traduzione con supporto parametri avanzati
 *
 * @example Interpolazione semplice
 * ```ts
 * t('welcome', { name: 'Mario' })
 * // "Benvenuto {{name}}" -> "Benvenuto Mario"
 * ```
 *
 * @example Formattazione numeri
 * ```ts
 * t('items_count', { count: 1000 })
 * // "Hai {{count, number}} elementi" -> "Hai 1,000 elementi"
 * ```
 *
 * @example Formattazione date
 * ```ts
 * t('last_login', { date: new Date() })
 * // "Ultimo accesso: {{date, date}}" -> "Ultimo accesso: 15/12/2025"
 * ```
 *
 * @example Formattazione valuta
 * ```ts
 * t('total', {
 *   price: 99.99,
 *   formatOptions: {
 *     price: { currency: { currency: 'EUR' } }
 *   }
 * })
 * // "Totale: {{price, currency}}" -> "Totale: €99.99"
 * ```
 *
 * @example Pluralizzazione
 * ```ts
 * t('items', { count: 0 })
 * // "{{count, plural, =0{Nessun elemento} one{Un elemento} other{# elementi}}}"
 * // -> "Nessun elemento"
 *
 * t('items', { count: 1 })
 * // -> "Un elemento"
 *
 * t('items', { count: 5 })
 * // -> "5 elementi"
 * ```
 *
 * @example Selezione
 * ```ts
 * t('greeting', { gender: 'male' })
 * // "{{gender, select, male{Benvenuto} female{Benvenuta} other{Benvenuto/a}}}"
 * // -> "Benvenuto"
 * ```
 */
export type TranslateFunction = (
  key: string,
  options?: TranslationOptions,
) => string

export interface I18nConfig {
  defaultLocale: Locale
  supportedLocales: Array<Locale>
}
