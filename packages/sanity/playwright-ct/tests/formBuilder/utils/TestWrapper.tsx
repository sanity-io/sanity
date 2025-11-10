import {type SanityClient} from '@sanity/client'
import {Card, LayerProvider, ThemeProvider, ToastProvider} from '@sanity/ui'
import {buildTheme, type RootTheme} from '@sanity/ui/theme'
import {memoize, noop} from 'lodash'
import {type ReactNode, Suspense, use, useState} from 'react'
import {
  ChangeConnectorRoot,
  ColorSchemeProvider,
  CopyPasteProvider,
  defineConfig,
  EMPTY_ARRAY,
  ResourceCacheProvider,
  type SchemaTypeDefinition,
  SourceProvider,
  UserColorManagerProvider,
  type WorkspaceOptions,
  WorkspaceProvider,
} from 'sanity'
import {styled} from 'styled-components'

import {PerspectiveProvider} from '../../../../src/core/perspective/PerspectiveProvider'
import {route} from '../../../../src/router'
import {RouterProvider} from '../../../../src/router/RouterProvider'
import {Pane, PaneContent, PaneLayout} from '../../../../src/structure/components/pane'
import {createMockSanityClient} from '../../../../test/mocks/mockSanityClient'
import {getMockWorkspace} from '../../../../test/testUtils/getMockWorkspaceFromConfig'

interface TestWrapperProps {
  children?: ReactNode
  betaFeatures?: WorkspaceOptions['beta']
  schemaTypes: SchemaTypeDefinition[]
}
const studioThemeConfig: RootTheme = buildTheme()

const StyledChangeConnectorRoot = styled(ChangeConnectorRoot)`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  min-width: 0;
`

const router = route.create('/')
const getCachedMockWorkspace = memoize(
  (
    client: SanityClient,
    schemaTypes: SchemaTypeDefinition[],
    betaFeatures: WorkspaceOptions['beta'] | undefined,
  ) => {
    const config = defineConfig({
      name: 'default',
      projectId: 'test',
      dataset: 'test',
      schema: {
        types: schemaTypes,
      },

      beta: {
        form: {
          enhancedObjectDialog: {
            enabled: true,
          },
        },
        ...betaFeatures,
      },
    })

    return getMockWorkspace({client, config})
  },
)

/**
 * @description This component is used to wrap all tests in the providers it needs to be able to run successfully.
 * It provides a mock Sanity client and a mock workspace.
 */
export const TestWrapper = (props: TestWrapperProps): React.JSX.Element | null => {
  const {children, schemaTypes, betaFeatures} = props
  const [client] = useState(() => createMockSanityClient() as unknown as SanityClient)

  return (
    <Suspense fallback={null}>
      <TestWrapperContents client={client} schemaTypes={schemaTypes} betaFeatures={betaFeatures}>
        {children}
      </TestWrapperContents>
    </Suspense>
  )
}

export const TestWrapperContents = (
  props: TestWrapperProps & {
    client: SanityClient
  },
): React.JSX.Element | null => {
  const {children, schemaTypes, betaFeatures, client} = props
  const mockWorkspace = use(getCachedMockWorkspace(client, schemaTypes, betaFeatures))

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
                </SourceProvider>
              </ResourceCacheProvider>
            </WorkspaceProvider>
          </LayerProvider>
        </ToastProvider>
      </ThemeProvider>
    </RouterProvider>
  )
}
