import React, {PropsWithChildren, useEffect, useState} from 'react'
import {LanguageLoader} from '../../config'
import {useSource} from '../source'
import {LoadingScreen} from '../screens'
import {useLoadedLanguages, useSanityI18n} from './I18nProvider'

interface TranslationProps {
  languageLoader: LanguageLoader
}

export function TranslationLoader(props: PropsWithChildren<TranslationProps>) {
  const {children} = props
  const {i18n} = useSource()
  const {language} = useSanityI18n()
  const {setLangLoaded} = useLoadedLanguages()
  const [loading, setLoading] = useState(true)
  // defensive dependency / we dont support changing the loader
  const [languageLoader] = useState(() => props.languageLoader)

  useEffect(() => {
    let mounted = true
    if (!setLangLoaded(language)) {
      setLoading(false)
      return
    }
    setLoading(true)
    languageLoader(language, {i18n: i18n.i18next})
      .then((bundles) => {
        if (bundles?.length) {
          bundles.forEach((bundle) => {
            i18n.i18next.addResourceBundle(
              language,
              bundle.namespace,
              bundle.resources,
              true /* deep*/,
              false /* overwrite*/
            )
          })
        }
      })
      .catch((e) => console.error(e))
      .finally(() => {
        if (mounted) {
          setLoading(true)
        }
      })
    // eslint-disable-next-line consistent-return
    return () => {
      mounted = false
    }
  }, [languageLoader, i18n, language, setLangLoaded, setLoading])

  if (loading) {
    return <LoadingScreen />
  }

  return <>{children}</>
}
