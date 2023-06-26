import {SanityClient} from '@sanity/client'
import {Card, LayerProvider, studioTheme, ThemeProvider, ToastProvider} from '@sanity/ui'
import React, {ReactNode, useEffect, useState} from 'react'
import {
  ResourceCacheProvider,
  SchemaTypeDefinition,
  SourceProvider,
  Workspace,
  WorkspaceProvider,
} from '../exports'
import {createMockSanityClient} from '../test/mocks/mockSanityClient'
import {getMockWorkspace} from '../test/testUtils/getMockWorkspaceFromConfig'

/**
 * @description This component is used to wrap all tests in the providers it needs to be able to run successfully.
 * It provides a mock Sanity client and a mock workspace.
 */
export const Wrapper = ({
  children,
  schemaTypes,
}: {
  children: ReactNode
  schemaTypes: SchemaTypeDefinition[]
}) => {
  const [mockWorkspace, setMockWorkspace] = useState<Workspace | null>(null)

  useEffect(() => {
    const getWorkspace = async () => {
      const client = createMockSanityClient() as unknown as SanityClient
      const config = {
        name: 'default',
        projectId: 'test',
        dataset: 'test',
        schema: {
          types: schemaTypes,
        },
      }
      const workspace = await getMockWorkspace({client, config})
      setMockWorkspace(workspace)
      return workspace
    }

    getWorkspace()
  }, [schemaTypes])

  if (!mockWorkspace) {
    return null
  }

  return (
    <ThemeProvider theme={studioTheme}>
      <ToastProvider>
        <LayerProvider>
          <WorkspaceProvider workspace={mockWorkspace}>
            <ResourceCacheProvider>
              <SourceProvider source={mockWorkspace.unstable_sources[0]}>
                <Card tone="default" padding={3}>
                  {children}
                </Card>
              </SourceProvider>
            </ResourceCacheProvider>
          </WorkspaceProvider>
        </LayerProvider>
      </ToastProvider>
    </ThemeProvider>
  )
}
