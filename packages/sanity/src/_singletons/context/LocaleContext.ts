import type {i18n} from 'i18next'
import {createContext} from 'sanity/_createContext'

import type {Locale} from '../../core/i18n/types'

/**
 * @internal
 * @hidden
 */
export interface LocaleContextValue {
  locales: Locale[]
  currentLocale: Locale
  __internal: {
    i18next: i18n
  }
  changeLocale: (newLocale: string) => Promise<void>
}

/**
 * @internal
 * @hidden
 */
export const LocaleContext = createContext<LocaleContextValue | undefined>(
  'sanity/_singletons/context/locale',
  undefined,
)
