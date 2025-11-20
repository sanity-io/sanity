import {type SanityClient} from '@sanity/client'
import {LayerProvider, studioTheme, ThemeProvider, ToastProvider} from '@sanity/ui'
import {createMemoryHistory} from 'history'
import {noop} from 'lodash'
import {type ReactNode} from 'react'
import {AddonDatasetContext, PerspectiveContext} from 'sanity/_singletons'
import {vi} from 'vitest'

import {ResolvedPanesProvider} from '../../src/_singletons/context/ResolvedPanesContext'
import {
  CopyPasteProvider,
  type LocaleResourceBundle,
  ResourceCacheProvider,
  type SingleWorkspace,
  SourceProvider,
  WorkspaceProvider,
  type WorkspaceSummary,
} from '../../src/core'
import {studioDefaultLocaleResources} from '../../src/core/i18n/bundles/studio'
import {LocaleProviderBase} from '../../src/core/i18n/components/LocaleProvider'
import {prepareI18n} from '../../src/core/i18n/i18nConfig'
import {usEnglishLocale} from '../../src/core/i18n/locales'
import {AssetLimitUpsellProvider} from '../../src/core/limits/context/assets/AssetLimitUpsellProvider'
import {DocumentLimitUpsellProvider} from '../../src/core/limits/context/documents/DocumentLimitUpsellProvider'
import {perspectiveContextValueMock} from '../../src/core/perspective/__mocks__/usePerspective.mock'
import {ActiveWorkspaceMatcherProvider} from '../../src/core/studio/activeWorkspaceMatcher/ActiveWorkspaceMatcherProvider'
import {route, RouterProvider} from '../../src/router'
import {type Panes} from '../../src/structure/structureResolvers'
import {getMockWorkspace} from './getMockWorkspaceFromConfig'

// Mock the useUpsellData hook to prevent API calls in tests
vi.mock('../../src/core/hooks/useUpsellData', () => ({
  useUpsellData: vi.fn(() => ({
    upsellData: null,
    telemetryLogs: {
      dialogViewed: vi.fn(),
      dialogDismissed: vi.fn(),
      dialogPrimaryClicked: vi.fn(),
      dialogSecondaryClicked: vi.fn(),
      panelViewed: vi.fn(),
      panelDismissed: vi.fn(),
      panelPrimaryClicked: vi.fn(),
      panelSecondaryClicked: vi.fn(),
    },
  })),
}))

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

  const resolvedPanes: Panes = {
    paneDataItems: [],
    routerPanes: [],
    resolvedPanes: [],
    focusedPane: null,
    setFocusedPane: noop,
  }

  const locales = [usEnglishLocale]
  const {i18next} = prepareI18n({
    projectId: 'test',
    dataset: 'test',
    name: 'test',
    i18n: {bundles: resources},
  })

  const router = route.create('/')

  await i18next.init()

  const routerState = {}
  const activeWorkspace = {name: 'default'} as WorkspaceSummary
  const history = createMemoryHistory()
  const addonDatasetContextValue = {
    createAddonDataset: async () => Promise.resolve(null),
    isCreatingDataset: false,
    client: null,
    ready: true,
  }

  function TestProvider({children}: {children: ReactNode}) {
    return (
      <RouterProvider router={router} state={routerState} onNavigate={noop}>
        <ThemeProvider theme={studioTheme}>
          <LocaleProviderBase locales={locales} i18next={i18next} projectId="test" sourceId="test">
            <ResourceCacheProvider>
              <ToastProvider>
                <LayerProvider>
                  <WorkspaceProvider workspace={workspace}>
                    <SourceProvider source={workspace.unstable_sources[0]}>
                      <ActiveWorkspaceMatcherProvider
                        activeWorkspace={activeWorkspace}
                        setActiveWorkspace={noop}
                        history={history}
                      >
                        <ResolvedPanesProvider value={resolvedPanes}>
                          <CopyPasteProvider>
                            <ResourceCacheProvider>
                              <AddonDatasetContext.Provider value={addonDatasetContextValue}>
                                <PerspectiveContext.Provider value={perspectiveContextValueMock}>
                                  <DocumentLimitUpsellProvider>
                                    <AssetLimitUpsellProvider>{children}</AssetLimitUpsellProvider>
                                  </DocumentLimitUpsellProvider>
                                </PerspectiveContext.Provider>
                              </AddonDatasetContext.Provider>
                            </ResourceCacheProvider>
                          </CopyPasteProvider>
                        </ResolvedPanesProvider>
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
