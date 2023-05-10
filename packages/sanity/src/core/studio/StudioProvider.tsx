import {ToastProvider} from '@sanity/ui'
import React from 'react'
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
import {I18nProvider} from './i18n'

Refractor.registerLanguage(bash)
Refractor.registerLanguage(javascript)
Refractor.registerLanguage(json)
Refractor.registerLanguage(jsx)
Refractor.registerLanguage(typescript)

/**
 * @hidden
 * @beta */
export interface StudioProviderProps extends StudioProps {
  children: React.ReactNode
}

/**
 * @hidden
 * @beta */
export function StudioProvider({
  children,
  config,
  basePath,
  onSchemeChange,
  scheme,
  unstable_history: history,
  unstable_noAuthBoundary: noAuthBoundary,
}: StudioProviderProps) {
  const _children = (
    <WorkspaceLoader LoadingComponent={LoadingScreen} ConfigErrorsComponent={ConfigErrorsScreen}>
      <I18nProvider>
        <ResourceCacheProvider>{children}</ResourceCacheProvider>
      </I18nProvider>
    </WorkspaceLoader>
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
                  {noAuthBoundary ? (
                    _children
                  ) : (
                    <AuthBoundary
                      LoadingComponent={LoadingScreen}
                      AuthenticateComponent={AuthenticateScreen}
                      NotAuthenticatedComponent={NotAuthenticatedScreen}
                    >
                      {_children}
                    </AuthBoundary>
                  )}
                </UserColorManagerProvider>
              </StudioThemeProvider>
            </ActiveWorkspaceMatcher>
          </WorkspacesProvider>
        </StudioErrorBoundary>
      </ToastProvider>
    </ColorSchemeProvider>
  )
}
