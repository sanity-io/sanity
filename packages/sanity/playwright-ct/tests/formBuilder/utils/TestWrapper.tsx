import {type SanityClient} from '@sanity/client'
import {Card, LayerProvider, ThemeProvider, ToastProvider} from '@sanity/ui'
import {buildTheme, type RootTheme} from '@sanity/ui/theme'
import {noop} from 'lodash'
import {type ReactNode, Suspense, useEffect, useState} from 'react'
import {
  ChangeConnectorRoot,
  ColorSchemeProvider,
  CopyPasteProvider,
  defineConfig,
  ResourceCacheProvider,
  type SchemaTypeDefinition,
  SourceProvider,
  UserColorManagerProvider,
  type Workspace,
  type WorkspaceOptions,
  WorkspaceProvider,
} from 'sanity'
import {Pane, PaneContent, PaneLayout} from 'sanity/structure'
import {styled} from 'styled-components'

import {route} from '../../../../src/router'
import {RouterProvider} from '../../../../src/router/RouterProvider'
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

/**
 * @description This component is used to wrap all tests in the providers it needs to be able to run successfully.
 * It provides a mock Sanity client and a mock workspace.
 */
export const TestWrapper = (props: TestWrapperProps): JSX.Element | null => {
  const {children, schemaTypes, betaFeatures} = props
  const [mockWorkspace, setMockWorkspace] = useState<Workspace | null>(null)

  useEffect(() => {
    const getWorkspace = async () => {
      const client = createMockSanityClient() as unknown as SanityClient
      const config = defineConfig({
        name: 'default',
        projectId: 'test',
        dataset: 'test',
        schema: {
          types: schemaTypes,
        },

        beta: betaFeatures,
      })

      const workspace = await getMockWorkspace({client, config})
      setMockWorkspace(workspace)
      return workspace
    }

    getWorkspace()
  }, [schemaTypes, betaFeatures])

  if (!mockWorkspace) {
    return null
  }

  return (
    <Suspense fallback={null}>
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
                            onOpenReviewChanges={() => {}}
                            onSetFocus={() => {}}
                          >
                            <PaneLayout height="fill">
                              <Pane id="test-pane">
                                <PaneContent>
                                  <Card padding={3}>{children}</Card>
                                </PaneContent>
                              </Pane>
                            </PaneLayout>
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
    </Suspense>
  )
}
