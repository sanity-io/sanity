import React from 'react'
import {SanityClient} from '@sanity/client'
import {LayerProvider, studioTheme, ThemeProvider, ToastProvider} from '@sanity/ui'
import {
  ResourceCacheProvider,
  SingleWorkspace,
  SourceProvider,
  WorkspaceProvider,
} from '../../src/core'
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
