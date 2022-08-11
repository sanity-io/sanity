import React from 'react'
import {SanityClient} from '@sanity/client'
import {LayerProvider, studioTheme, ThemeProvider, ToastProvider} from '@sanity/ui'
import {createWorkspaceFromConfig, SingleWorkspace} from '../../src/config'
import {SourceProvider, WorkspaceProvider} from '../../src/studio'
import {ResourceCacheProvider} from '../../src/datastores/ResourceCacheProvider'

interface TestProviderOptions {
  config: SingleWorkspace
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
