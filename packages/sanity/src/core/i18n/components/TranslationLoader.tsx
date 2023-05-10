import React, {PropsWithChildren, useEffect, useState} from 'react'
import {LanguageLoader} from '../../config'
import {useSource} from '../../studio'
import {LoadingScreen} from '../../studio/screens'
import {runLanguageLoaders, useLoadedLanguages, useLoadLanguage} from '../i18nHooks'
import {useLanguage} from './LanguageContext'

/**
 * @alpha
 */
export interface TranslationProps {
  /**
   * Loader to run when the component is mounted.
   *
   * Note:
   * The prop is frozen: changing it after initial render will have no effect.
   * It is recommended to define the loader statically function outside any React component.
   *
   * Consider using a cache for the loader result.
   */
  languageLoader: LanguageLoader
}

/**
 * Loads a language bundle after the studio has been initialized.
 * This is useful for plugins which use lazy-loaded components that wish to load
 * language bundles just-in-time, instead of on startup.
 *
 * Note:
 * This component will run a provided language loader when mounted.
 * Multiple instances of the same component will not share state.
 * Loader function should cache any results to prevent unnecessary network traffic.
 *
 * @alpha
 */
export function TranslationLoader(props: PropsWithChildren<TranslationProps>) {
  const {children, languageLoader} = props
  // frozen dependency
  const [languageLoaders] = useState(() => [languageLoader])

  const {i18n} = useSource()
  const {language} = useLanguage()

  const setLangLoaded = useLoadedLanguages()
  const loadLanguage = useLoadLanguage(setLangLoaded, languageLoaders)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!setLangLoaded(language)) {
      setLoading(false)
      return
    }
    setLoading(true)

    runLanguageLoaders(language, i18n.i18next, languageLoaders).catch((e) => console.error(e))
  }, [loadLanguage, i18n, language, setLangLoaded, setLoading, languageLoaders])

  if (loading) {
    return <LoadingScreen />
  }

  return <React.Fragment key={language + loading}>{children}</React.Fragment>
}
