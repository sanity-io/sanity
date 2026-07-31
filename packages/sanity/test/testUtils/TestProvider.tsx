import {type SanityClient} from '@sanity/client'
import {LayerProvider, studioTheme, ThemeProvider} from '@sanity/ui'
import {ToastProvider} from '@sanity/ui/toast'
import {createMemoryHistory} from 'history'
import noop from 'lodash-es/noop.js'
import {type ComponentType, type PropsWithChildren} from 'react'
import {AddonDatasetContext, PerspectiveContext} from 'sanity/_singletons'
import {vi} from 'vitest'

import {ResolvedPanesProvider} from '../../src/_singletons/context/ResolvedPanesContext'
import {type SingleWorkspace, type WorkspaceSummary} from '../../src/core/config/types'
import {studioDefaultLocaleResources} from '../../src/core/i18n/bundles/studio'
import {LocaleProviderBase} from '../../src/core/i18n/components/LocaleProvider'
import {prepareI18n} from '../../src/core/i18n/i18nConfig'
import {usEnglishLocale} from '../../src/core/i18n/locales'
import {type LocaleResourceBundle} from '../../src/core/i18n/types'
import {AssetLimitUpsellProvider} from '../../src/core/limits/context/assets/AssetLimitUpsellProvider'
import {DocumentLimitUpsellProvider} from '../../src/core/limits/context/documents/DocumentLimitUpsellProvider'
import {perspectiveContextValueMock} from '../../src/core/perspective/__mocks__/usePerspective.mock'
import {ResourceCacheProvider} from '../../src/core/store/ResourceCacheProvider'
import {ActiveWorkspaceMatcherProvider} from '../../src/core/studio/activeWorkspaceMatcher/ActiveWorkspaceMatcherProvider'
import {CopyPasteProvider} from '../../src/core/studio/copyPaste/CopyPasteProvider'
import {SourceProvider} from '../../src/core/studio/source'
import {WorkspaceProvider} from '../../src/core/studio/workspace'
import {route} from '../../src/router/route'
import {RouterProvider} from '../../src/router/RouterProvider'
import {type Panes} from '../../src/structure/structureResolvers/useResolvedPanes'
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
    maximizedPane: null,
    setMaximizedPane: noop,
  }

  const locales = [usEnglishLocale]
  const {i18next} = prepareI18n({
    projectId: 'test',
    dataset: 'test',
    name: 'test',
    i18n: {bundles: resources},
  })

  // Include intent routes so always-mounted Menu content can resolve IntentLinks.
  const router = route.create('/', [route.intents('/intent')])

  await i18next.init()

  const routerState = {}
  const activeWorkspace = {name: 'default'} as WorkspaceSummary
  const history = createMemoryHistory()
  const addonDatasetContextValue = {
    createAddonDataset: async () => Promise.resolve(null),
    isCreatingDataset: false,
    client: null,
    ready: true,
    error: null,
  }

  const TestProvider: ComponentType<PropsWithChildren> = ({children}) => (
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

  return TestProvider
}
