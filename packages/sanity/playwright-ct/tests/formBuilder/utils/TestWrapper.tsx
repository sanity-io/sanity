import {type SanityClient} from '@sanity/client'
import {Card, LayerProvider, studioTheme, ThemeProvider, ToastProvider} from '@sanity/ui'
import {type ReactNode, Suspense, useEffect, useState} from 'react'
import {
  ColorSchemeProvider,
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

import {createMockSanityClient} from '../../../../test/mocks/mockSanityClient'
import {getMockWorkspace} from '../../../../test/testUtils/getMockWorkspaceFromConfig'

interface TestWrapperProps {
  children?: ReactNode
  features?: WorkspaceOptions['features']
  schemaTypes: SchemaTypeDefinition[]
}

/**
 * @description This component is used to wrap all tests in the providers it needs to be able to run successfully.
 * It provides a mock Sanity client and a mock workspace.
 */
export const TestWrapper = (props: TestWrapperProps): JSX.Element | null => {
  const {children, schemaTypes, features} = props
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

        features,
      })

      const workspace = await getMockWorkspace({client, config})
      setMockWorkspace(workspace)
      return workspace
    }

    getWorkspace()
  }, [schemaTypes, features])

  if (!mockWorkspace) {
    return null
  }

  return (
    <Suspense fallback={null}>
      <ThemeProvider theme={studioTheme}>
        <ToastProvider>
          <LayerProvider>
            <WorkspaceProvider workspace={mockWorkspace}>
              <ResourceCacheProvider>
                <SourceProvider source={mockWorkspace.unstable_sources[0]}>
                  <ColorSchemeProvider>
                    <UserColorManagerProvider>
                      <PaneLayout height="fill">
                        <Pane id="test-pane">
                          <PaneContent>
                            <Card padding={3}>{children}</Card>
                          </PaneContent>
                        </Pane>
                      </PaneLayout>
                    </UserColorManagerProvider>
                  </ColorSchemeProvider>
                </SourceProvider>
              </ResourceCacheProvider>
            </WorkspaceProvider>
          </LayerProvider>
        </ToastProvider>
      </ThemeProvider>
    </Suspense>
  )
}
