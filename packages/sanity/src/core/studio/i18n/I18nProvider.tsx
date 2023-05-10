// eslint-disable-next-line import/no-extraneous-dependencies
import i18nApi, {InitOptions, Resource, type i18n} from 'i18next'
// eslint-disable-next-line import/no-extraneous-dependencies
import {I18nextProvider, useTranslation} from 'react-i18next'
import React, {
  createContext,
  PropsWithChildren,
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {enStudioStrings} from './studio_en'
import {useSource} from '../source'
import {LoadingScreen} from '../screens'
import {I18nApi, LanguageLoader} from '../../config'

export {useTranslation}

export interface LoadLanguageContext {
  i18n: i18n
}

export interface SanityI18nContextValue {
  changeLanguage: (lang: string) => Promise<void>
  language: string
}

const NO_LANGS: string[] = []

const SanityI18nContext = createContext<SanityI18nContextValue | undefined>(undefined)

export function useSanityI18n(): SanityI18nContextValue {
  const context = useContext(SanityI18nContext)
  if (!context) {
    throw new Error(
      'SanityI18nContext value missing. Is this hook being used outside SanityI18nContext.Provider?'
    )
  }

  return context
}

const defaultLanguage = 'en' as const
const defaultNS = 'studio' as const

export const defaultI18nOptions: InitOptions = {
  partialBundledLanguages: true,
  resources: {
    en: {
      [defaultNS]: enStudioStrings,
    },
  },
  lng: defaultLanguage,
  fallbackLng: defaultLanguage,
  debug: false,
  defaultNS,

  interpolation: {
    escapeValue: false, // handled by i18next-react
  },
}

export function createI18nApi({
  initOptions,
  languageLoaders,
}: {
  initOptions: InitOptions
  languageLoaders: LanguageLoader[]
}): I18nApi {
  //we start out with an uninitialized instance
  // the async inic call happens in I18nProvider
  let i18nInstance = i18nApi.createInstance()
  return {
    initOptions,
    languageLoaders,
    get t() {
      return i18nInstance.t
    },
    get i18next() {
      return i18nInstance
    },
    set i18next(newInstance: i18n) {
      i18nInstance = newInstance
    },
  }
}

export function useLoadedLanguages() {
  const [loadedLangs, setLoadedLangs] = useState(NO_LANGS)

  const setLangLoaded = useCallback(
    (lang: string) => {
      if (loadedLangs.includes(lang)) {
        return false
      }
      setLoadedLangs((prev) => [...prev, lang])
      return true
    },
    [setLoadedLangs, loadedLangs]
  )

  return {
    loadedLangs,
    setLangLoaded,
  }
}

// eslint-disable-next-line @typescript-eslint/ban-types
export function I18nProvider(props: PropsWithChildren<{}>) {
  const {i18n} = useSource()
  const {initOptions, languageLoaders} = i18n
  const [i18nInstance, setI18nInstance] = useState<i18n | undefined>()
  const [language, setLanguage] = useState('unknown')
  const {setLangLoaded} = useLoadedLanguages()
  const loadLanguage = useCallback(
    async (lang: string, instance: i18n) => {
      if (!setLangLoaded(lang)) {
        return
      }

      if (languageLoaders) {
        const loading = languageLoaders.map((loader) =>
          loader(lang, {i18n: instance})
            .then((bundles) => {
              if (!bundles?.length) {
                return
              }
              // eslint-disable-next-line max-nested-callbacks
              bundles.forEach((bundle) => {
                instance.addResourceBundle(
                  lang,
                  bundle.namespace,
                  bundle.resources,
                  true /* deep*/,
                  false /* overwrite*/
                )
              })
            })
            .catch((e) => console.error(e))
        )
        await Promise.all(loading)
      }
    },
    [setLangLoaded, languageLoaders]
  )

  useEffect(
    () => {
      const lang = initOptions?.lng ?? defaultLanguage
      const options = initOptions ?? defaultI18nOptions

      i18n.i18next.init(options).then(async () => {
        await loadLanguage(lang, i18n.i18next)
        setLanguage(lang)
        setI18nInstance(i18n.i18next)
      })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [] /* intentionally empty: we only want this to fire once, to async init i18n initial instance */
  )

  const sanityContext: SanityI18nContextValue = useMemo(() => {
    return {
      changeLanguage: async (lang: string) => {
        if (!i18nInstance) {
          return
        }
        await loadLanguage(lang, i18nInstance)
        await i18nInstance.changeLanguage(lang)
        setLanguage(lang)
      },
      language,
    }
  }, [i18nInstance, loadLanguage, language])

  if (!i18nInstance) {
    return <LoadingScreen />
  }

  return (
    <Suspense fallback={<LoadingScreen />}>
      <I18nextProvider i18n={i18nInstance}>
        {/* Use language as key to force re-render of the whole studio, to update lazy getters*/}
        <SanityI18nContext.Provider value={sanityContext} key={language}>
          {props.children}
        </SanityI18nContext.Provider>
      </I18nextProvider>
    </Suspense>
  )
}
