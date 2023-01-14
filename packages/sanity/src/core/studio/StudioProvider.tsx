import {ToastProvider} from '@sanity/ui'
import React, {Fragment, useMemo} from 'react'
import Refractor from 'react-refractor'
import bash from 'refractor/lang/bash'
import javascript from 'refractor/lang/javascript'
import json from 'refractor/lang/json'
import jsx from 'refractor/lang/jsx'
import typescript from 'refractor/lang/typescript'
import {UserColorManagerProvider} from '../user-color'
import {ErrorLogger} from '../error/ErrorLogger'
import {ResourceCacheProvider} from '../store'
import {AuthBoundary} from './AuthBoundary'
import {StudioProps} from './Studio'
import {StudioThemeProvider} from './StudioThemeProvider'
import {StudioErrorBoundary} from './StudioErrorBoundary'
import {ActiveWorkspaceMatcher} from './activeWorkspaceMatcher'
import {ColorSchemeProvider} from './colorScheme'
import {Z_OFFSET} from './constants'
import {
  ConfigErrorsScreen,
  LoadingScreen,
  AuthenticateScreen,
  NotFoundScreen,
  NotAuthenticatedScreen,
} from './screens'
import {WorkspaceLoader} from './workspaceLoader'
import {WorkspacesProvider} from './workspaces'

Refractor.registerLanguage(bash)
Refractor.registerLanguage(javascript)
Refractor.registerLanguage(json)
Refractor.registerLanguage(jsx)
Refractor.registerLanguage(typescript)

/** @beta */
export interface StudioProviderProps extends StudioProps {
  children: React.ReactNode
}

/** @beta */
export function StudioProvider({
  children,
  config,
  basePath,
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
        <ErrorLogger />
        <StudioErrorBoundary>
          <WorkspacesProvider config={config} basePath={basePath}>
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
