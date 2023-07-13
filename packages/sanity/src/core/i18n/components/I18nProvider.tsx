// eslint-disable-next-line import/no-extraneous-dependencies
import type {InitOptions, i18n} from 'i18next'
// eslint-disable-next-line import/no-extraneous-dependencies
import {I18nextProvider} from 'react-i18next'
import React, {PropsWithChildren, startTransition, Suspense, useEffect, useState} from 'react'
import {useSource} from '../../studio'
import {studioI18nNamespace} from '../i18nNamespaces'
import {LoadingScreen} from '../../studio/screens'
import {defaultLanguage} from '../localizedLanguages'
import {getPreferredLang} from '../languageStore'
import type {LanguageDefinition} from '../types'
import {LanguageProvider} from './LanguageContext'

const defaultI18nOptions: InitOptions = {
  partialBundledLanguages: true,
  defaultNS: studioI18nNamespace,
  lng: defaultLanguage.id,
  fallbackLng: defaultLanguage.id,
  debug: false,
  initImmediate: false,

  interpolation: {
    escapeValue: false, // handled by i18next-react
  },
  react: {
    bindI18nStore: 'added',
  },
}

function getInitialI18nOptions(
  projectId: string,
  sourceId: string,
  languages: LanguageDefinition[]
): InitOptions {
  const langId = getPreferredLang(projectId, sourceId)
  const preferredLang = languages.find((l) => l.id === langId)
  const lng = preferredLang?.id ?? languages[0]?.id ?? defaultI18nOptions.lng
  return {
    ...defaultI18nOptions,
    lng,
    supportedLngs: languages.map((def) => def.id),
  }
}

/**
 * @todo figure out if we can simplify this
 * @internal
 */
// eslint-disable-next-line @typescript-eslint/ban-types
export function I18nProvider(props: PropsWithChildren<{}>) {
  const {i18n, projectId, name: sourceName} = useSource()
  const [i18nInstance, setI18nInstance] = useState<i18n | undefined>()
  const [language, setLanguage] = useState('unknown')

  const initOptions = getInitialI18nOptions(projectId, sourceName, i18n.languages)

  useEffect(
    () => {
      const lang = initOptions?.lng ?? defaultLanguage.id
      const options = initOptions ?? defaultI18nOptions
      let mounted = true
      i18n.i18next.init(options).then(() => {
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
        <LanguageProvider language={language} setLanguage={setLanguage} i18nInstance={i18nInstance}>
          {props.children}
        </LanguageProvider>
      </I18nextProvider>
    </Suspense>
  )
}
