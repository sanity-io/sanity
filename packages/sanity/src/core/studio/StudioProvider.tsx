import {ToastProvider} from '@sanity/ui'
import React from 'react'
import Refractor from 'react-refractor'
import bash from 'refractor/lang/bash'
import javascript from 'refractor/lang/javascript'
import json from 'refractor/lang/json'
import jsx from 'refractor/lang/jsx'
import typescript from 'refractor/lang/typescript'
import {LoadingBlock} from '../../ui/loadingBlock'
import {UserColorManagerProvider} from '../user-color'
import {ErrorLogger} from '../error/ErrorLogger'
import {ResourceCacheProvider} from '../store'
import {LocaleProvider} from '../i18n'
import {AuthBoundary} from './AuthBoundary'
import {StudioProps} from './Studio'
import {StudioThemeProvider} from './StudioThemeProvider'
import {StudioErrorBoundary} from './StudioErrorBoundary'
import {ActiveWorkspaceMatcher} from './activeWorkspaceMatcher'
import {ColorSchemeProvider} from './colorScheme'
import {Z_OFFSET} from './constants'
import {
  ConfigErrorsScreen,
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
    <WorkspaceLoader LoadingComponent={LoadingBlock} ConfigErrorsComponent={ConfigErrorsScreen}>
      <LocaleProvider>
        <ResourceCacheProvider>{children}</ResourceCacheProvider>
      </LocaleProvider>
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
              LoadingComponent={LoadingBlock}
            >
              <StudioThemeProvider>
                <UserColorManagerProvider>
                  {noAuthBoundary ? (
                    _children
                  ) : (
                    <AuthBoundary
                      LoadingComponent={LoadingBlock}
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
