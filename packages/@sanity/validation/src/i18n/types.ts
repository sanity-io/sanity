import {type TFunction} from 'i18next'

/**
 * Translation utilities accepted across compatible Studio and i18next versions.
 *
 * @beta
 */
export interface ValidationLocaleSource {
  /** The locale used for localized validation messages. */
  currentLocale: {id: string}
  /** Loads translation resources needed by built-in or custom validators. */
  loadNamespaces(namespaces: string[]): Promise<void>
  /** Translates a key with optional interpolation and formatting options. */
  t: (key: string, options?: Record<string, unknown>) => string
}

export interface LocaleSource extends ValidationLocaleSource {
  t: TFunction
}
