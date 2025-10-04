import {type ReactNode, useMemo} from 'react'
import {registerLanguage} from 'react-refractor'
import bash from 'refractor/bash'
import javascript from 'refractor/javascript'
import json from 'refractor/json'
import jsx from 'refractor/jsx'
import typescript from 'refractor/typescript'

import {LoadingBlock} from '../components/loadingBlock'
import {AppIdCacheProvider} from '../create/studio-app/AppIdCacheProvider'
import {errorReporter} from '../error/errorReporter'
import {LocaleProvider} from '../i18n'
import {DocumentLimitUpsellProvider} from '../limits/context/documents/DocumentLimitUpsellProvider'
import {GlobalPerspectiveProvider} from '../perspective/GlobalPerspectiveProvider'
import {ResourceCacheProvider} from '../store'
import {UserColorManagerProvider} from '../user-color'
import {ActiveWorkspaceMatcher} from './activeWorkspaceMatcher'
import {AuthBoundary} from './AuthBoundary'
import {ComlinkRouteHandler} from './components/ComlinkRouteHandler'
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
import {StudioRootErrorHandler} from './StudioRootErrorHandler'
import {StudioTelemetryProvider} from './telemetry/StudioTelemetryProvider'
import {WorkspaceLoader} from './workspaceLoader'
import {WorkspacesProvider} from './workspaces'

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
  // onSchemeChange,
  // scheme,
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
                    <GlobalPerspectiveProvider>
                      <DocumentLimitUpsellProvider>{children}</DocumentLimitUpsellProvider>
                    </GlobalPerspectiveProvider>
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
    <StudioErrorBoundary>
      <StudioRootErrorHandler>
        <WorkspacesProvider config={config} basePath={basePath} LoadingComponent={LoadingBlock}>
          <ActiveWorkspaceMatcher
            unstable_history={history}
            NotFoundComponent={NotFoundScreen}
            LoadingComponent={LoadingBlock}
          >
            {/* <StudioThemeProvider> */}
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
            {/* </StudioThemeProvider> */}
          </ActiveWorkspaceMatcher>
        </WorkspacesProvider>
      </StudioRootErrorHandler>
    </StudioErrorBoundary>
  )
}
