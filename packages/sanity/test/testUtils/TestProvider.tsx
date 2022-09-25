import React from 'react'
import {SanityClient} from '@sanity/client'
import {LayerProvider, studioTheme, ThemeProvider, ToastProvider} from '@sanity/ui'
import {SingleWorkspace} from '../../src/core/config'
import {SourceProvider, WorkspaceProvider} from '../../src/core/studio'
import {ResourceCacheProvider} from '../../src/_unstable/datastores/ResourceCacheProvider'
import {getMockWorkspace} from './getMockWorkspaceFromConfig'

interface TestProviderOptions {
  config?: SingleWorkspace
  client?: SanityClient
}

export async function createTestProvider({client, config}: TestProviderOptions = {}) {
  const workspace = await getMockWorkspace({client, config})

  function TestProvider({children}: {children: React.ReactNode}) {
    return (
      <ThemeProvider theme={studioTheme}>
        <ToastProvider>
          <LayerProvider>
            <WorkspaceProvider workspace={workspace}>
              <SourceProvider source={workspace.unstable_sources[0]}>
                <ResourceCacheProvider>{children}</ResourceCacheProvider>
              </SourceProvider>
            </WorkspaceProvider>
          </LayerProvider>
        </ToastProvider>
      </ThemeProvider>
    )
  }

  return TestProvider
}
