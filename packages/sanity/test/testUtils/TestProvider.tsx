import React from 'react'
import {SanityClient} from '@sanity/client'
import {LayerProvider, studioTheme, ThemeProvider, ToastProvider} from '@sanity/ui'
import {
  LocaleProviderBase,
  ResourceCacheProvider,
  SingleWorkspace,
  SourceProvider,
  usEnglishLocale,
  WorkspaceProvider,
} from '../../src/core'
import {prepareI18n} from '../../src/core/i18n/i18nConfig'
import {studioDefaultLocaleResources} from '../../src/core/i18n/bundles/studio'
import {getMockWorkspace} from './getMockWorkspaceFromConfig'

interface TestProviderOptions {
  config?: SingleWorkspace
  client?: SanityClient
}

export async function createTestProvider({client, config}: TestProviderOptions = {}) {
  const workspace = await getMockWorkspace({client, config})

  const locales = [usEnglishLocale]
  const {i18next} = prepareI18n({
    name: 'test',
    i18n: {bundles: [studioDefaultLocaleResources]},
  })

  await i18next.init()

  function TestProvider({children}: {children: React.ReactNode}) {
    return (
      <ThemeProvider theme={studioTheme}>
        <WorkspaceProvider workspace={workspace}>
          <LocaleProviderBase locales={locales} i18next={i18next} workspaceName="test">
            <ToastProvider>
              <LayerProvider>
                <SourceProvider source={workspace.unstable_sources[0]}>
                  <ResourceCacheProvider>{children}</ResourceCacheProvider>
                </SourceProvider>
              </LayerProvider>
            </ToastProvider>
          </LocaleProviderBase>
        </WorkspaceProvider>
      </ThemeProvider>
    )
  }

  return TestProvider
}
