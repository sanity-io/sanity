import {type SanityClient} from '@sanity/client'
import {LayerProvider, studioTheme, ThemeProvider, ToastProvider} from '@sanity/ui'
import {noop} from 'lodash'
import {type ReactNode} from 'react'

import {
  AddonDatasetProvider,
  CopyPasteProvider,
  LocaleProviderBase,
  type LocaleResourceBundle,
  ResourceCacheProvider,
  type SingleWorkspace,
  SourceProvider,
  usEnglishLocale,
  WorkspaceProvider,
} from '../../src/core'
import {studioDefaultLocaleResources} from '../../src/core/i18n/bundles/studio'
import {prepareI18n} from '../../src/core/i18n/i18nConfig'
import {route, RouterProvider} from '../../src/router'
import {getMockWorkspace} from './getMockWorkspaceFromConfig'

export interface TestProviderOptions {
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

  const router = route.create('/')

  await i18next.init()

  function TestProvider({children}: {children: ReactNode}) {
    return (
      <RouterProvider router={router} state={{}} onNavigate={noop}>
        <ThemeProvider theme={studioTheme}>
          <LocaleProviderBase locales={locales} i18next={i18next} projectId="test" sourceId="test">
            <ToastProvider>
              <LayerProvider>
                <WorkspaceProvider workspace={workspace}>
                  <SourceProvider source={workspace.unstable_sources[0]}>
                    <CopyPasteProvider>
                      <ResourceCacheProvider>
                        <AddonDatasetProvider>{children}</AddonDatasetProvider>
                      </ResourceCacheProvider>
                    </CopyPasteProvider>
                  </SourceProvider>
                </WorkspaceProvider>
              </LayerProvider>
            </ToastProvider>
          </LocaleProviderBase>
        </ThemeProvider>
      </RouterProvider>
    )
  }

  return TestProvider
}
