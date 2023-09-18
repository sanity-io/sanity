import {createContext} from 'react'
import {i18n} from 'i18next'

/**
 * @internal
 */
export const LocaleContext = createContext<LocaleContextValue | undefined>(undefined)

/**
 * @internal
 */
export interface LocaleContextValue {
  locales: {id: string; title: string}[]
  currentLocale: string
  __internal: {i18next: i18n}
  changeLocale: (newLocale: string) => Promise<void>
}
