import {ToastProvider} from '@sanity/ui'
import {type ReactNode, useMemo} from 'react'
import Refractor from 'react-refractor'
import bash from 'refractor/lang/bash.js'
import javascript from 'refractor/lang/javascript.js'
import json from 'refractor/lang/json.js'
import jsx from 'refractor/lang/jsx.js'
import typescript from 'refractor/lang/typescript.js'

import {LoadingBlock} from '../components/loadingBlock'
import {ErrorLogger} from '../error/ErrorLogger'
import {errorReporter} from '../error/errorReporter'
import {LocaleProvider} from '../i18n'
import {GlobalPerspectiveProvider} from '../perspective/GlobalPerspectiveProvider'
import {ResourceCacheProvider} from '../store'
import {UserColorManagerProvider} from '../user-color'
import {ActiveWorkspaceMatcher} from './activeWorkspaceMatcher'
import {AuthBoundary} from './AuthBoundary'
import {ColorSchemeProvider} from './colorScheme'
import {Z_OFFSET} from './constants'
import {MaybeEnableErrorReporting} from './MaybeEnableErrorReporting'
import {PackageVersionStatusProvider} from './packageVersionStatus/PackageVersionStatusProvider'
import {
  AuthenticateScreen,
  ConfigErrorsScreen,
  NotAuthenticatedScreen,
  NotFoundScreen,
} from './screens'
import {type StudioProps} from './Studio'
import {StudioAnnouncementsProvider} from './studioAnnouncements/StudioAnnouncementsProvider'
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
  // We initialize the error reporter as early as possible in order to catch anything that could
  // occur during configuration loading, React rendering etc. StudioProvider is often the highest
  // mounted React component that is shared across embedded and standalone studios.
  errorReporter.initialize()

  const _children = useMemo(
    () => (
      <WorkspaceLoader LoadingComponent={LoadingBlock} ConfigErrorsComponent={ConfigErrorsScreen}>
        <StudioTelemetryProvider config={config}>
          <LocaleProvider>
            <PackageVersionStatusProvider>
              <MaybeEnableErrorReporting errorReporter={errorReporter} />
              <ResourceCacheProvider>
                <StudioAnnouncementsProvider>
                  <GlobalPerspectiveProvider>{children}</GlobalPerspectiveProvider>
                </StudioAnnouncementsProvider>
              </ResourceCacheProvider>
            </PackageVersionStatusProvider>
          </LocaleProvider>
        </StudioTelemetryProvider>
      </WorkspaceLoader>
    ),
    [children, config],
  )

  return (
    <ColorSchemeProvider onSchemeChange={onSchemeChange} scheme={scheme}>
      <ToastProvider paddingY={7} zOffset={Z_OFFSET.toast}>
        <ErrorLogger />
        <StudioErrorBoundary>
          <WorkspacesProvider config={config} basePath={basePath} LoadingComponent={LoadingBlock}>
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
