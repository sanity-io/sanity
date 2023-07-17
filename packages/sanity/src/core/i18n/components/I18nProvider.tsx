// eslint-disable-next-line import/no-extraneous-dependencies
import type {InitOptions, i18n} from 'i18next'
// eslint-disable-next-line import/no-extraneous-dependencies
import {I18nextProvider} from 'react-i18next'
import React, {PropsWithChildren, startTransition, Suspense, useEffect, useState} from 'react'
import {useSource} from '../../studio'
import {studioLocaleNamespace} from '../localeNamespaces'
import {LoadingScreen} from '../../studio/screens'
import {defaultLocale} from '../locales'
import {getPreferredLocale} from '../localeStore'
import type {LocaleDefinition} from '../types'
import {LocaleProvider} from './LocaleProvider'

const defaultI18nOptions: InitOptions = {
  partialBundledLanguages: true,
  defaultNS: studioLocaleNamespace,
  lng: defaultLocale.id,
  fallbackLng: defaultLocale.id,
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
  locales: LocaleDefinition[],
): InitOptions {
  const langId = getPreferredLocale(projectId, sourceId)
  const preferredLang = locales.find((l) => l.id === langId)
  const lng = preferredLang?.id ?? locales[0]?.id ?? defaultI18nOptions.lng
  return {
    ...defaultI18nOptions,
    lng,
    supportedLngs: locales.map((def) => def.id),
  }
}

/**
 * @todo figure out if we can simplify this
 * @todo align/merge with `LocaleProvider`?
 * @internal
 */
// eslint-disable-next-line @typescript-eslint/ban-types
export function I18nProvider(props: PropsWithChildren<{}>) {
  const {i18n, projectId, name: sourceName} = useSource()
  const [i18nInstance, setI18nInstance] = useState<i18n | undefined>()
  const [locale, setLocale] = useState('unknown')

  const initOptions = getInitialI18nOptions(projectId, sourceName, i18n.locales)

  useEffect(
    () => {
      const lang = initOptions?.lng ?? defaultLocale.id
      const options = initOptions ?? defaultI18nOptions
      let mounted = true
      i18n.i18next.init(options).then(() => {
        if (!mounted) return
        startTransition(() => {
          setI18nInstance(i18n.i18next)
          setLocale(lang)
        })
      })
      return () => {
        mounted = false
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [] /* intentionally empty: we only want this to fire once, to async init i18n initial instance */,
  )

  if (!i18nInstance) {
    return <LoadingScreen />
  }

  return (
    <Suspense fallback={<LoadingScreen />}>
      <I18nextProvider i18n={i18nInstance}>
        <LocaleProvider locale={locale} setLocale={setLocale} i18nInstance={i18nInstance}>
          {props.children}
        </LocaleProvider>
      </I18nextProvider>
    </Suspense>
  )
}
