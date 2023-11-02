import React from 'react'
import {SanityClient} from '@sanity/client'
import {LayerProvider, studioTheme, ThemeProvider, ToastProvider} from '@sanity/ui'
import {
  LocaleProviderBase,
  LocaleResourceBundle,
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
  resources?: LocaleResourceBundle[]
}

export async function createTestProvider({
  client,
  config,
  resources = [studioDefaultLocaleResources],
}: TestProviderOptions = {}) {
  const workspace = await getMockWorkspace({client, config})

  const locales = [usEnglishLocale]
  const {i18next} = prepareI18n({
    projectId: 'test',
    dataset: 'test',
    name: 'test',
    i18n: {bundles: resources},
  })

  await i18next.init()

  function TestProvider({children}: {children: React.ReactNode}) {
    return (
      <ThemeProvider theme={studioTheme}>
        <LocaleProviderBase locales={locales} i18next={i18next} projectId="test" sourceId="test">
          <ToastProvider>
            <LayerProvider>
              <WorkspaceProvider workspace={workspace}>
                <SourceProvider source={workspace.unstable_sources[0]}>
                  <ResourceCacheProvider>{children}</ResourceCacheProvider>
                </SourceProvider>
              </WorkspaceProvider>
            </LayerProvider>
          </ToastProvider>
        </LocaleProviderBase>
      </ThemeProvider>
    )
  }

  return TestProvider
}
