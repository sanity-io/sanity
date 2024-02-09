import {ToastProvider} from '@sanity/ui'
import {type ReactNode} from 'react'
import Refractor from 'react-refractor'
import bash from 'refractor/lang/bash'
import javascript from 'refractor/lang/javascript'
import json from 'refractor/lang/json'
import jsx from 'refractor/lang/jsx'
import typescript from 'refractor/lang/typescript'

import {LoadingBlock} from '../components/loadingBlock'
import {ErrorLogger} from '../error/ErrorLogger'
import {LocaleProvider} from '../i18n'
import {ResourceCacheProvider} from '../store'
import {UserColorManagerProvider} from '../user-color'
import {ActiveWorkspaceMatcher} from './activeWorkspaceMatcher'
import {AuthBoundary} from './AuthBoundary'
import {ColorSchemeProvider} from './colorScheme'
import {Z_OFFSET} from './constants'
import {
  AuthenticateScreen,
  ConfigErrorsScreen,
  NotAuthenticatedScreen,
  NotFoundScreen,
} from './screens'
import {type StudioProps} from './Studio'
import {StudioErrorBoundary} from './StudioErrorBoundary'
import {StudioTelemetryProvider} from './StudioTelemetryProvider'
import {StudioThemeProvider} from './StudioThemeProvider'
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
  children: ReactNode
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
      <StudioTelemetryProvider config={config}>
        <LocaleProvider>
          <ResourceCacheProvider>{children}</ResourceCacheProvider>
        </LocaleProvider>
      </StudioTelemetryProvider>
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
