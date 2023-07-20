import {createContext} from 'react'

/**
 * @internal
 */
export const LocaleContext = createContext<LocaleContextValue | undefined>(undefined)

/**
 * @internal
 */
export interface LocaleContextValue {
  currentLocale: string
  changeLocale: (newLocale: string) => Promise<void>
}
