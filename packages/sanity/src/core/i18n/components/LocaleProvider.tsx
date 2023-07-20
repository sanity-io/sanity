import {I18nextProvider} from 'react-i18next'
import React, {PropsWithChildren, Suspense, useMemo} from 'react'
import {useSource} from '../../studio'
import {LoadingScreen} from '../../studio/screens'
import {storePreferredLocale} from '../localeStore'
import {LocaleContext, LocaleContextValue} from '../LocaleContext'
import {useCurrentLocale} from '../hooks/useLocale'

/**
 * @internal
 */
// eslint-disable-next-line @typescript-eslint/ban-types
export function LocaleProvider(props: PropsWithChildren<{}>) {
  const {
    projectId,
    name: sourceId,
    __internal: {i18next},
  } = useSource()

  const currentLocale = useCurrentLocale()
  const context = useMemo<LocaleContextValue>(
    () => ({
      currentLocale,
      changeLocale: async (newLocale: string) => {
        storePreferredLocale(projectId, sourceId, newLocale)
        await i18next.changeLanguage(newLocale)
      },
    }),
    [i18next, currentLocale, projectId, sourceId],
  )

  return (
    <Suspense fallback={<LoadingScreen />}>
      <I18nextProvider i18n={i18next}>
        {/* Use locale as key to force re-render, updating non-reactive parts */}
        <LocaleContext.Provider value={context} key={currentLocale}>
          {props.children}
        </LocaleContext.Provider>
      </I18nextProvider>
    </Suspense>
  )
}
