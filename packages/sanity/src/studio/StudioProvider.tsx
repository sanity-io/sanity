import React, {Fragment, useMemo} from 'react'
import Refractor from 'react-refractor'
import bash from 'refractor/lang/bash'
import javascript from 'refractor/lang/javascript'
import json from 'refractor/lang/json'
import jsx from 'refractor/lang/jsx'
import typescript from 'refractor/lang/typescript'
import {History} from 'history'
import {ThemeColorSchemeKey, ToastProvider} from '@sanity/ui'
import {Config} from '../config'
import {UserColorManagerProvider} from '../user-color'
import {ResourceCacheProvider} from '../datastores/ResourceCacheProvider'
import {ColorSchemeProvider} from './colorScheme'
import {ActiveWorkspaceMatcher} from './activeWorkspaceMatcher'
import {StudioThemeProvider} from './StudioThemeProvider'
import {StudioErrorBoundary} from './StudioErrorBoundary'
import {WorkspaceLoader} from './workspaceLoader'
import {
  ConfigErrorsScreen,
  LoadingScreen,
  AuthenticateScreen,
  NotFoundScreen,
  NotAuthenticatedScreen,
} from './screens'
import {WorkspacesProvider} from './workspaces'
import {AuthBoundary} from './AuthBoundary'
import {Z_OFFSET} from './constants'

Refractor.registerLanguage(bash)
Refractor.registerLanguage(javascript)
Refractor.registerLanguage(json)
Refractor.registerLanguage(jsx)
Refractor.registerLanguage(typescript)

export interface StudioProviderProps {
  children: React.ReactNode
  config: Config
  onSchemeChange?: (nextScheme: ThemeColorSchemeKey) => void
  scheme?: ThemeColorSchemeKey
  unstable_history?: History
  unstable_noAuthBoundary?: boolean
}

export function StudioProvider({
  children,
  config,
  onSchemeChange,
  scheme,
  unstable_history: history,
  unstable_noAuthBoundary: noAuthBoundary,
}: StudioProviderProps) {
  const ConditionalAuthBoundary = useMemo(
    () => (noAuthBoundary ? Fragment : AuthBoundary),
    [noAuthBoundary]
  )

  return (
    <ColorSchemeProvider onSchemeChange={onSchemeChange} scheme={scheme}>
      <ToastProvider paddingY={7} zOffset={Z_OFFSET.toast}>
        <StudioErrorBoundary>
          <WorkspacesProvider config={config}>
            <ActiveWorkspaceMatcher
              unstable_history={history}
              NotFoundComponent={NotFoundScreen}
              LoadingComponent={LoadingScreen}
            >
              <StudioThemeProvider>
                <UserColorManagerProvider>
                  <ConditionalAuthBoundary
                    LoadingComponent={LoadingScreen}
                    AuthenticateComponent={AuthenticateScreen}
                    NotAuthenticatedComponent={NotAuthenticatedScreen}
                  >
                    <WorkspaceLoader
                      LoadingComponent={LoadingScreen}
                      ConfigErrorsComponent={ConfigErrorsScreen}
                    >
                      <ResourceCacheProvider>{children}</ResourceCacheProvider>
                    </WorkspaceLoader>
                  </ConditionalAuthBoundary>
                </UserColorManagerProvider>
              </StudioThemeProvider>
            </ActiveWorkspaceMatcher>
          </WorkspacesProvider>
        </StudioErrorBoundary>
      </ToastProvider>
    </ColorSchemeProvider>
  )
}
