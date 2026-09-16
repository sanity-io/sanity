import {type SanityClient} from '@sanity/client'
import {Card, LayerProvider, ThemeProvider} from '@sanity/ui'
import {buildTheme, type RootTheme} from '@sanity/ui/theme'
import {ToastProvider} from '@sanity/ui/toast'
import {clsx} from 'clsx'
import memoize from 'lodash-es/memoize.js'
import noop from 'lodash-es/noop.js'
import {type ComponentProps, type ReactNode, Suspense, use, useState} from 'react'
import {
  ChangeConnectorRoot,
  ColorSchemeProvider,
  CopyPasteProvider,
  defineConfig,
  EMPTY_ARRAY,
  type LocaleResourceBundle,
  ResourceCacheProvider,
  type SchemaTypeDefinition,
  type SingleWorkspace,
  SourceProvider,
  UserColorManagerProvider,
  type WorkspaceOptions,
  WorkspaceProvider,
} from 'sanity'

import {AssetLimitUpsellProvider} from '../../src/core/limits/context/assets/AssetLimitUpsellProvider'
import {PerspectiveProvider} from '../../src/core/perspective/PerspectiveProvider'
import {route} from '../../src/router/route'
import {RouterProvider} from '../../src/router/RouterProvider'
import {Pane} from '../../src/structure/components/pane/Pane'
import {PaneContent} from '../../src/structure/components/pane/PaneContent'
import {PaneLayout} from '../../src/structure/components/pane/PaneLayout'
import {structureUsEnglishLocaleBundle} from '../../src/structure/i18n'
import {createMockSanityClient} from '../../test/mocks/mockSanityClient'
import {getMockWorkspace} from '../../test/testUtils/getMockWorkspaceFromConfig'
import {changeConnectorRoot} from './TestWrapper.css'

interface TestWrapperProps {
  children?: ReactNode
  betaFeatures?: WorkspaceOptions['beta']
  schemaTypes: SchemaTypeDefinition[]
  /**
   * Plugin locale bundles (e.g. presentation, variants) to load alongside the
   * structure bundle the wrapper always provides — mirrors
   * `createTestProvider({resources})`.
   */
  i18nBundles?: LocaleResourceBundle[]
}
const studioThemeConfig: RootTheme = buildTheme()

function StyledChangeConnectorRoot(props: ComponentProps<typeof ChangeConnectorRoot>) {
  const {className, ...restProps} = props

  return <ChangeConnectorRoot {...restProps} className={clsx(changeConnectorRoot, className)} />
}

// Include intent routes so always-mounted Menu content (e.g. reference
// "Open in new tab" IntentLinks kept mounted by @sanity/ui Activity) can
// resolve hrefs without throwing during render.
const router = route.create('/', [route.intents('/intent')])
const getCachedMockWorkspace = memoize(
  (
    client: SanityClient,
    schemaTypes: SchemaTypeDefinition[],
    betaFeatures: WorkspaceOptions['beta'] | undefined,
    i18nBundles: LocaleResourceBundle[] = EMPTY_ARRAY,
  ) => {
    const config = defineConfig({
      name: 'default',
      projectId: 'test',
      dataset: 'test',
      schema: {
        types: schemaTypes,
      },
      // The wrapper renders structure chrome (Pane/PaneLayout), so structure
      // locale resources belong in the mock workspace by default.
      i18n: {bundles: [structureUsEnglishLocaleBundle, ...i18nBundles]},
      ...(betaFeatures ? {beta: betaFeatures} : {}),
    }) as SingleWorkspace

    return getMockWorkspace({client, config})
  },
)

/**
 * Wraps tests in the providers they need to run successfully, with a mock
 * Sanity client and a mock workspace.
 */
export const TestWrapper = (props: TestWrapperProps): React.JSX.Element | null => {
  const {children, schemaTypes, betaFeatures, i18nBundles} = props
  const [client] = useState(() => createMockSanityClient() as unknown as SanityClient)

  return (
    <Suspense fallback={null}>
      <TestWrapperContents
        client={client}
        schemaTypes={schemaTypes}
        betaFeatures={betaFeatures}
        i18nBundles={i18nBundles}
      >
        {children}
      </TestWrapperContents>
    </Suspense>
  )
}

const TestWrapperContents = (
  props: TestWrapperProps & {
    client: SanityClient
  },
): React.JSX.Element | null => {
  const {children, schemaTypes, betaFeatures, i18nBundles, client} = props
  const mockWorkspace = use(getCachedMockWorkspace(client, schemaTypes, betaFeatures, i18nBundles))

  if (!mockWorkspace) {
    return null
  }

  return (
    <RouterProvider router={router} state={{}} onNavigate={noop}>
      <ThemeProvider theme={studioThemeConfig}>
        <ToastProvider>
          <LayerProvider>
            <WorkspaceProvider workspace={mockWorkspace}>
              <ResourceCacheProvider>
                <SourceProvider source={mockWorkspace.unstable_sources[0]}>
                  <AssetLimitUpsellProvider>
                    <CopyPasteProvider>
                      <ColorSchemeProvider>
                        <UserColorManagerProvider>
                          <StyledChangeConnectorRoot
                            isReviewChangesOpen={false}
                            onOpenReviewChanges={noop}
                            onSetFocus={noop}
                          >
                            <PerspectiveProvider
                              selectedPerspectiveName={undefined}
                              excludedPerspectives={EMPTY_ARRAY}
                            >
                              <PaneLayout height="fill">
                                <Pane id="test-pane">
                                  <PaneContent>
                                    <Card padding={3}>{children}</Card>
                                  </PaneContent>
                                </Pane>
                              </PaneLayout>
                            </PerspectiveProvider>
                          </StyledChangeConnectorRoot>
                        </UserColorManagerProvider>
                      </ColorSchemeProvider>
                    </CopyPasteProvider>
                  </AssetLimitUpsellProvider>
                </SourceProvider>
              </ResourceCacheProvider>
            </WorkspaceProvider>
          </LayerProvider>
        </ToastProvider>
      </ThemeProvider>
    </RouterProvider>
  )
}
