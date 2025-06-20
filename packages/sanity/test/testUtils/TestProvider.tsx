import {type SanityClient} from '@sanity/client'
import {LayerProvider, studioTheme, ThemeProvider, ToastProvider} from '@sanity/ui'
import {createMemoryHistory} from 'history'
import {noop} from 'lodash'
import {type ReactNode} from 'react'
import {AddonDatasetContext, PerspectiveContext} from 'sanity/_singletons'

import {CopyPasteProvider} from '../../src/core/studio/copyPaste/CopyPasteProvider'
import type {LocaleResourceBundle} from '../../src/core/i18n/types'
import {ResourceCacheProvider} from '../../src/core/store/_legacy/ResourceCacheProvider'
import {type SingleWorkspace, type WorkspaceSummary} from '../../src/core/config/types'
import {SourceProvider} from '../../src/core/studio/source'
import {WorkspaceProvider} from '../../src/core/studio/workspace'
import {studioDefaultLocaleResources} from '../../src/core/i18n/bundles/studio'
import {LocaleProviderBase} from '../../src/core/i18n/components/LocaleProvider'
import {prepareI18n} from '../../src/core/i18n/i18nConfig'
import {usEnglishLocale} from '../../src/core/i18n/locales'
import {perspectiveContextValueMock} from '../../src/core/perspective/__mocks__/usePerspective.mock'
import {ActiveWorkspaceMatcherProvider} from '../../src/core/studio/activeWorkspaceMatcher/ActiveWorkspaceMatcherProvider'
import {route} from '../../src/router/route'
import {RouterProvider} from '../../src/router/RouterProvider'
import {getMockWorkspace} from './getMockWorkspaceFromConfig'

export interface TestProviderOptions {
  config?: Partial<SingleWorkspace>
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
            <ResourceCacheProvider>
              <ToastProvider>
                <LayerProvider>
                  <WorkspaceProvider workspace={workspace}>
                    <SourceProvider source={workspace.unstable_sources[0]}>
                      <ActiveWorkspaceMatcherProvider
                        activeWorkspace={{name: 'default'} as WorkspaceSummary}
                        setActiveWorkspace={noop}
                        history={createMemoryHistory()}
                      >
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
                              <PerspectiveContext.Provider value={perspectiveContextValueMock}>
                                {children}
                              </PerspectiveContext.Provider>
                            </AddonDatasetContext.Provider>
                          </ResourceCacheProvider>
                        </CopyPasteProvider>
                      </ActiveWorkspaceMatcherProvider>
                    </SourceProvider>
                  </WorkspaceProvider>
                </LayerProvider>
              </ToastProvider>
            </ResourceCacheProvider>
          </LocaleProviderBase>
        </ThemeProvider>
      </RouterProvider>
    )
  }

  return TestProvider
}
