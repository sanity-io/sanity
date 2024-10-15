import {type SanityClient} from '@sanity/client'
import {LayerProvider, studioTheme, ThemeProvider, ToastProvider} from '@sanity/ui'
import {noop} from 'lodash'
import {type ReactNode} from 'react'
import {AddonDatasetContext} from 'sanity/_singletons'

import {
  CopyPasteProvider,
  type LocaleResourceBundle,
  ResourceCacheProvider,
  type SingleWorkspace,
  SourceProvider,
  WorkspaceProvider,
} from '../../src/core'
import {studioDefaultLocaleResources} from '../../src/core/i18n/bundles/studio'
import {LocaleProviderBase} from '../../src/core/i18n/components/LocaleProvider'
import {prepareI18n} from '../../src/core/i18n/i18nConfig'
import {usEnglishLocale} from '../../src/core/i18n/locales'
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
                        <AddonDatasetContext.Provider
                          value={{
                            createAddonDataset: async () => Promise.resolve(null),
                            isCreatingDataset: false,
                            client: null,
                            ready: true,
                          }}
                        >
                          {children}
                        </AddonDatasetContext.Provider>
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
