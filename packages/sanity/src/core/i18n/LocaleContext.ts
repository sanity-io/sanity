import {createContext} from 'react'

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
  changeLocale: (newLocale: string) => Promise<void>
}
