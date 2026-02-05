import type {  TranslationOptions, TranslationResources } from './types'

/**
 * Risolve una chiave di traduzione dalle risorse fornite.
 * Supporta la notazione punto per oggetti annidati (es. 'common.buttons.save').
 */
const getNestedValue = (obj: any, key: string): string | undefined => {
  return key.split('.').reduce((acc, part) => {
    return acc && acc[part] !== undefined ? acc[part] : undefined
  }, obj)
}

/**
 * Formatta un numero secondo le opzioni specificate
 */
const formatNumber = (
  value: number,
  locale: string = 'en-US',
  formatOptions?: Intl.NumberFormatOptions
): string => {
  try {
    return new Intl.NumberFormat(locale, formatOptions).format(value)
  } catch {
    return String(value)
  }
}

/**
 * Formatta una data secondo le opzioni specificate
 */
const formatDate = (
  value: Date | number | string,
  locale: string = 'en-US',
  formatOptions?: Intl.DateTimeFormatOptions
): string => {
  try {
    const date = value instanceof Date ? value : new Date(value)
    return new Intl.DateTimeFormat(locale, formatOptions).format(date)
  } catch {
    return String(value)
  }
}

/**
 * Formatta una valuta secondo le opzioni specificate
 */
const formatCurrency = (
  value: number,
  locale: string = 'en-US',
  currency: string = 'USD',
  formatOptions?: Intl.NumberFormatOptions
): string => {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      ...formatOptions,
    }).format(value)
  } catch {
    return String(value)
  }
}

/**
 * Gestisce la pluralizzazione secondo ICU MessageFormat
 * Formato: {{count, plural, =0{nessuno} one{un elemento} other{# elementi}}}
 */
const handlePlural = (count: number, pattern: string): string => {
  // Estrae le varie forme: =0{...} one{...} few{...} many{...} other{...}
  const forms: Record<string, string> = {}
  const regex = /(=\d+|zero|one|two|few|many|other)\{([^}]*)\}/g
  let match: RegExpExecArray | null

  while ((match = regex.exec(pattern)) !== null) {
    forms[match[1]] = match[2]
  }

  // Controlla forme esatte prima (=0, =1, etc.)
  const exactForm = forms[`=${count}`]
  if (exactForm !== undefined) {
    return exactForm.replace(/#/g, String(count))
  }

  // Regole di pluralizzazione semplificate (inglese-based)
  let pluralForm: string
  if (count === 0 && forms.zero) {
    pluralForm = forms.zero
  } else if (count === 1 && forms.one) {
    pluralForm = forms.one
  } else if (count === 2 && forms.two) {
    pluralForm = forms.two
  } else if (forms.other) {
    pluralForm = forms.other
  } else {
    pluralForm = pattern
  }

  // Sostituisce # con il conteggio
  return pluralForm.replace(/#/g, String(count))
}

/**
 * Gestisce la selezione secondo ICU MessageFormat
 * Formato: {{gender, select, male{lui} female{lei} other{loro}}}
 */
const handleSelect = (value: string, pattern: string): string => {
  const forms: Record<string, string> = {}
  const regex = /(\w+)\{([^}]*)\}/g
  let match: RegExpExecArray | null

  while ((match = regex.exec(pattern)) !== null) {
    forms[match[1]] = match[2]
  }

  return forms[value] || forms.other || pattern
}

/**
 * Effettua l'interpolazione avanzata dei parametri nella stringa di traduzione.
 * Supporta:
 * - Interpolazione semplice: {{name}}
 * - Formattazione numeri: {{count, number}}
 * - Formattazione date: {{date, date}}
 * - Formattazione valuta: {{price, currency}}
 * - Pluralizzazione: {{count, plural, =0{nessuno} one{un elemento} other{# elementi}}}
 * - Selezione: {{gender, select, male{lui} female{lei} other{loro}}}
 */
const interpolate = (
  text: string,
  options?: TranslationOptions,
  locale: string = 'en-US'
): string => {
  if (!options) return text

  // Pattern per catturare interpolazioni complesse: {{key}} o {{key, format, pattern}}
  return text.replace(/\{\{([^}]+)\}\}/g, (match, content) => {
    const parts = content.split(',').map((p: string) => p.trim())
    const key = parts[0]
    const value = options[key]

    if (value === undefined) {
      return match // Mantiene il placeholder se il valore non esiste
    }

    // Nessun formato specificato - interpolazione semplice
    if (parts.length === 1) {
      return String(value)
    }

    const format = parts[1]
    const formatOpts = options.formatOptions?.[key]

    switch (format) {
      case 'number': {
        if (typeof value !== 'number') return String(value)
        return formatNumber(value, locale, formatOpts?.number)
      }

      case 'date': {
        return formatDate(value, locale, formatOpts?.date)
      }

      case 'currency': {
        if (typeof value !== 'number') return String(value)
        const currency = formatOpts?.currency?.currency || 'USD'
        return formatCurrency(value, locale, currency, formatOpts?.currency)
      }

      case 'plural': {
        if (typeof value !== 'number') return String(value)
        const pattern = parts.slice(2).join(',').trim()
        return handlePlural(value, pattern)
      }

      case 'select': {
        const pattern = parts.slice(2).join(',').trim()
        return handleSelect(String(value), pattern)
      }

      default:
        return String(value)
    }
  })
}

/**
 * Funzione core per risolvere una traduzione.
 */
export const resolveTranslation = (
  key: string,
  resources: TranslationResources,
  options?: TranslationOptions,
  locale: string = 'en-US'
): string => {
  const rawValue = getNestedValue(resources, key)

  // Se non trovato, usa defaultValue se presente, altrimenti la chiave stessa
  if (rawValue === undefined) {
    if (options && options.defaultValue) {
      return interpolate(options.defaultValue, options, locale)
    }
    return key
  }

  return interpolate(String(rawValue), options, locale)
}
