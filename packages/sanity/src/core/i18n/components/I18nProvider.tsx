// eslint-disable-next-line import/no-extraneous-dependencies
import {type i18n} from 'i18next'
// eslint-disable-next-line import/no-extraneous-dependencies
import {I18nextProvider} from 'react-i18next'
import React, {PropsWithChildren, startTransition, Suspense, useEffect, useState} from 'react'
import {useSource} from '../../studio'
import {LoadingScreen} from '../../studio/screens'
import {defaultI18nOptions} from '../i18nConfig'
import {useLoadedLanguages, useLoadLanguage} from '../i18nHooks'
import {defaultLanguage} from '../localizedLanguages'
import {LanguageProvider} from './LanguageContext'

// eslint-disable-next-line @typescript-eslint/ban-types
export function I18nProvider(props: PropsWithChildren<{}>) {
  const {i18n} = useSource()
  const {initOptions, languageLoaders} = i18n
  const [i18nInstance, setI18nInstance] = useState<i18n | undefined>()
  const [language, setLanguage] = useState('unknown')
  const setLangLoaded = useLoadedLanguages()
  const loadLanguage = useLoadLanguage(setLangLoaded, languageLoaders)

  useEffect(
    () => {
      const lang = initOptions?.lng ?? defaultLanguage.id
      const options = initOptions ?? defaultI18nOptions
      let mounted = true
      i18n.i18next.init(options).then(async () => {
        if (!mounted) return
        await loadLanguage(lang, i18n.i18next)
        if (!mounted) return
        startTransition(() => {
          setI18nInstance(i18n.i18next)
          setLanguage(lang)
        })
      })
      return () => {
        mounted = false
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [] /* intentionally empty: we only want this to fire once, to async init i18n initial instance */
  )

  if (!i18nInstance) {
    return <LoadingScreen />
  }
  return (
    <Suspense fallback={<LoadingScreen />}>
      <I18nextProvider i18n={i18nInstance}>
        <LanguageProvider
          language={language}
          setLanguage={setLanguage}
          loadLanguage={loadLanguage}
          i18nInstance={i18nInstance}
        >
          {props.children}
        </LanguageProvider>
      </I18nextProvider>
    </Suspense>
  )
}
