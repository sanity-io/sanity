import React from 'react'
import {SanityClient} from '@sanity/client'
import {LayerProvider, studioTheme, ThemeProvider, ToastProvider} from '@sanity/ui'
import {createWorkspaceFromConfig, WorkspaceOptions} from '../../src/config'
import {SourceProvider, WorkspaceProvider} from '../../src/studio'

interface TestProviderOptions {
  config: WorkspaceOptions
  client: SanityClient
}

export async function createTestProvider({client, config}: TestProviderOptions) {
  const currentUser = {
    id: 'doug',
    name: 'Doug',
    email: 'doug@sanity.io',
    role: 'admin',
    roles: [{name: 'admin', title: 'Admin'}],
  }
  const workspace = await createWorkspaceFromConfig({...config, currentUser, client})

  function TestProvider({children}: {children: React.ReactNode}) {
    return (
      <ThemeProvider theme={studioTheme}>
        <ToastProvider>
          <LayerProvider>
            <WorkspaceProvider workspace={workspace}>
              <SourceProvider source={workspace.unstable_sources[0]}>{children}</SourceProvider>
            </WorkspaceProvider>
          </LayerProvider>
        </ToastProvider>
      </ThemeProvider>
    )
  }

  return TestProvider
}
