import {useCallback, useContext, useSyncExternalStore} from 'react'
import {LocaleContext, LocaleContextValue} from '../LocaleContext'
import {useSource} from '../../studio'

/**
 * @internal
 */
export function useCurrentLocale(): string {
  const i18next = useSource().__internal.i18next

  const subscribe = useCallback(
    (callback: () => void) => {
      i18next.on('languageChanged', callback)
      return () => i18next.off('languageChanged', callback)
    },
    [i18next],
  )

  return useSyncExternalStore(subscribe, () => i18next.language)
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
