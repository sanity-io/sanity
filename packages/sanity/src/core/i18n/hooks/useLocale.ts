import {useContext} from 'react'
import {LocaleContext, type LocaleContextValue} from '../LocaleContext'
import type {Locale} from '../types'

/**
 * Returns the currently active locale
 *
 * @public
 */
export function useCurrentLocale(): Locale {
  return useLocale().currentLocale
}

/**
 * @hidden
 * @internal
 */
export function useLocale(): LocaleContextValue {
  const context = useContext(LocaleContext)
  if (!context) {
    throw new Error(
      'Sanity LocaleContext value missing. Is this hook being used outside LocaleContext.Provider?',
    )
  }

  return context
}
