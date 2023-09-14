import {I18nextProvider} from 'react-i18next'
import React, {PropsWithChildren, Suspense, useCallback, useMemo, useSyncExternalStore} from 'react'
import type {i18n} from 'i18next'
import {useSource} from '../../studio'
import {LoadingScreen} from '../../studio/screens'
import {storePreferredLocale} from '../localeStore'
import {LocaleContext, LocaleContextValue} from '../LocaleContext'

/**
 * @internal
 */
export function LocaleProvider(props: PropsWithChildren) {
  const {
    projectId,
    name: sourceId,

    i18n: {locales},
    __internal: {i18next},
  } = useSource()

  return (
    <LocaleProviderBase
      {...props}
      projectId={projectId}
      sourceId={sourceId}
      locales={locales}
      i18next={i18next}
    />
  )
}

/**
 * @internal
 */
export function LocaleProviderBase({
  projectId,
  sourceId,
  locales,
  i18next,
  children,
}: PropsWithChildren<{
  projectId: string
  sourceId: string
  locales: {id: string; title: string}[]
  i18next: i18n
}>) {
  const subscribe = useCallback(
    (callback: () => void) => {
      i18next.on('languageChanged', callback)
      return () => i18next.off('languageChanged', callback)
    },
    [i18next],
  )
  const currentLocale = useSyncExternalStore(subscribe, () => i18next.language)

  const context = useMemo<LocaleContextValue>(
    () => ({
      locales,
      currentLocale,
      __internal: {i18next},
      changeLocale: async (newLocale: string) => {
        storePreferredLocale(projectId, sourceId, newLocale)
        await i18next.changeLanguage(newLocale)
      },
    }),
    [currentLocale, i18next, locales, projectId, sourceId],
  )

  return (
    <Suspense fallback={<LoadingScreen />}>
      <I18nextProvider i18n={i18next}>
        {/* Use locale as key to force re-render, updating non-reactive parts */}
        <LocaleContext.Provider value={context} key={currentLocale}>
          {children}
        </LocaleContext.Provider>
      </I18nextProvider>
    </Suspense>
  )
}
