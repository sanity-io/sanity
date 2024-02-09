import {type i18n} from 'i18next'
import {createContext} from 'react'

import {type Locale} from './types'

/**
 * @internal
 * @hidden
 */
export const LocaleContext = createContext<LocaleContextValue | undefined>(undefined)

/**
 * @internal
 * @hidden
 */
export interface LocaleContextValue {
  locales: Locale[]
  currentLocale: Locale
  __internal: {i18next: i18n}
  changeLocale: (newLocale: string) => Promise<void>
}
