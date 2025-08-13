import {ToastProvider} from '@sanity/ui'
import {type ReactNode, useMemo} from 'react'
import {registerLanguage} from 'react-refractor'
import bash from 'refractor/bash'
import javascript from 'refractor/javascript'
import json from 'refractor/json'
import jsx from 'refractor/jsx'
import typescript from 'refractor/typescript'

import {LoadingBlock} from '../components/loadingBlock/LoadingBlock'
import {AppIdCacheProvider} from '../create/studio-app/AppIdCacheProvider'
import {errorReporter} from '../error/errorReporter'
import {LocaleProvider} from '../i18n/components/LocaleProvider'
import {GlobalPerspectiveProvider} from '../perspective/GlobalPerspectiveProvider'
import {ResourceCacheProvider} from '../store/_legacy/ResourceCacheProvider'
import {UserColorManagerProvider} from '../user-color/provider'
import {ActiveWorkspaceMatcher} from './activeWorkspaceMatcher/ActiveWorkspaceMatcher'
import {AuthBoundary} from './AuthBoundary'
import {ColorSchemeProvider} from './colorScheme'
import {ComlinkRouteHandler} from './components/ComlinkRouteHandler'
import {Z_OFFSET} from './constants'
import {MaybeEnableErrorReporting} from './MaybeEnableErrorReporting'
import {PackageVersionStatusProvider} from './packageVersionStatus/PackageVersionStatusProvider'
import {AuthenticateScreen} from './screens/AuthenticateScreen'
import {ConfigErrorsScreen} from './screens/ConfigErrorsScreen'
import {NotAuthenticatedScreen} from './screens/NotAuthenticatedScreen'
import {NotFoundScreen} from './screens/NotFoundScreen'
import {type StudioProps} from './Studio'
import {StudioAnnouncementsProvider} from './studioAnnouncements/StudioAnnouncementsProvider'
import {StudioErrorBoundary} from './StudioErrorBoundary'
import {StudioRootErrorHandler} from './StudioRootErrorHandler'
import {StudioThemeProvider} from './StudioThemeProvider'
import {StudioTelemetryProvider} from './telemetry/StudioTelemetryProvider'
import {WorkspaceLoader} from './workspaceLoader'
import {WorkspacesProvider} from './workspaces/WorkspacesProvider'

registerLanguage(bash)
registerLanguage(javascript)
registerLanguage(json)
registerLanguage(jsx)
registerLanguage(typescript)

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
                <AppIdCacheProvider>
                  <ComlinkRouteHandler />
                  <StudioAnnouncementsProvider>
                    <GlobalPerspectiveProvider>{children}</GlobalPerspectiveProvider>
                  </StudioAnnouncementsProvider>
                </AppIdCacheProvider>
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
        <StudioErrorBoundary>
          <StudioRootErrorHandler>
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
          </StudioRootErrorHandler>
        </StudioErrorBoundary>
      </ToastProvider>
    </ColorSchemeProvider>
  )
}
