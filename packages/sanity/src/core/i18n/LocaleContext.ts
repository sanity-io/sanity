import {createContext} from 'react'
import {i18n} from 'i18next'
import type {Locale} from './types'

/**
 * @internal
 */
export const LocaleContext = createContext<LocaleContextValue | undefined>(undefined)

/**
 * @internal
 */
export interface LocaleContextValue {
  locales: Locale[]
  currentLocale: Locale
  __internal: {i18next: i18n}
  changeLocale: (newLocale: string) => Promise<void>
}
