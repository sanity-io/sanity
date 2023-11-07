import {useContext} from 'react'
import {LocaleContext, type LocaleContextValue} from '../LocaleContext'

/**
 * @internal
 */
export function useCurrentLocale(): string {
  return useLocale().currentLocale
}

/**
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
