import React, {createContext, PropsWithChildren, useContext, useMemo} from 'react'
import {type i18n} from 'i18next'
import {useSource} from '../../studio'
import {storePreferredLocale} from '../localeStore'

/**
 * @internal
 */
export interface LocaleContextValue {
  changeLocale: (locale: string) => Promise<void>
  locale: string
}

/**
 * @todo Automatically provide a context for ease-of-use/fallback for non-Sanity rendered apps
 */
const LocaleContext = createContext<LocaleContextValue | undefined>(undefined)

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

/**
 * @internal
 */
export interface LocaleProviderProps {
  locale: string
  setLocale: (locale: string) => void
  i18nInstance: i18n
}

/**
 * @internal
 */
export function LocaleProvider(props: PropsWithChildren<LocaleProviderProps>) {
  const {i18nInstance, setLocale, locale, children} = props
  const {projectId, name: sourceId} = useSource()
  const sanityContext: LocaleContextValue = useMemo(() => {
    return {
      changeLocale: async (lang: string) => {
        if (!i18nInstance) {
          return
        }
        await i18nInstance.changeLanguage(lang)
        storePreferredLocale(projectId, sourceId, lang)
        setLocale(lang)
      },
      locale,
    }
  }, [i18nInstance, locale, setLocale, projectId, sourceId])

  // Use language as key to force re-render of the whole studio, to update lazy getters
  return (
    <LocaleContext.Provider value={sanityContext} key={locale}>
      {children}
    </LocaleContext.Provider>
  )
}
