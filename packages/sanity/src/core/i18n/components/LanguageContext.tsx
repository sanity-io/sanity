import React, {createContext, PropsWithChildren, useContext, useMemo} from 'react'
import {type i18n} from 'i18next'
import {useSource, useWorkspace} from '../../studio'
import {storePreferredLang} from '../languageStore'

/**
 * @internal
 */
export interface LanguageContextValue {
  changeLanguage: (lang: string) => Promise<void>
  language: string
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined)

/**
 * @internal
 */
export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error(
      'SanityI18nContext value missing. Is this hook being used outside SanityI18nContext.Provider?',
    )
  }

  return context
}

/**
 * @internal
 */
export interface LanguageProviderProps {
  language: string
  loadLanguage: (lang: string, instance: i18n) => Promise<void>
  setLanguage: (lang: string) => void
  i18nInstance: i18n
}

/**
 * @internal
 */
export function LanguageProvider(props: PropsWithChildren<LanguageProviderProps>) {
  const {i18nInstance, setLanguage, loadLanguage, language, children} = props
  const {projectId, name: sourceId} = useSource()
  const sanityContext: LanguageContextValue = useMemo(() => {
    return {
      changeLanguage: async (lang: string) => {
        if (!i18nInstance) {
          return
        }
        await loadLanguage(lang, i18nInstance)
        await i18nInstance.changeLanguage(lang)
        storePreferredLang(projectId, sourceId, lang)
        setLanguage(lang)
      },
      language,
    }
  }, [i18nInstance, loadLanguage, language, setLanguage, projectId, sourceId])

  /* Use language as key to force re-render of the whole studio, to update lazy getters*/
  return (
    <LanguageContext.Provider value={sanityContext} key={language}>
      {children}
    </LanguageContext.Provider>
  )
}
