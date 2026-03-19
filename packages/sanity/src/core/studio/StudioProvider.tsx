import {DeferredTelemetryProvider} from '@sanity/telemetry/react'
import {ToastProvider} from '@sanity/ui'
import {type ReactNode, useMemo} from 'react'

import {LoadingBlock} from '../components/loadingBlock/LoadingBlock'
import {errorReporter} from '../error/errorReporter'
import {LocaleProvider} from '../i18n/components/LocaleProvider'
import {AssetLimitUpsellProvider} from '../limits/context/assets/AssetLimitUpsellProvider'
import {DocumentLimitUpsellProvider} from '../limits/context/documents/DocumentLimitUpsellProvider'
import {GlobalPerspectiveProvider} from '../perspective/GlobalPerspectiveProvider'
import {ResourceCacheProvider} from '../store/_legacy/ResourceCacheProvider'
import {AppIdCacheProvider} from '../store/studio-app/AppIdCacheProvider'
import {UserApplicationCacheProvider} from '../store/userApplications/UserApplicationCacheProvider'
import {UserColorManagerProvider} from '../user-color/provider'
import {ActiveWorkspaceMatcher} from './activeWorkspaceMatcher/ActiveWorkspaceMatcher'
import {AuthBoundary} from './AuthBoundary'
import {ColorSchemeProvider} from './colorScheme'
import {ComlinkRouteHandler} from './components/ComlinkRouteHandler'
import {Z_OFFSET} from './constants'
import {LiveUserApplicationProvider} from './liveUserApplication/LiveUserApplicationProvider'
import {LiveManifestRegisterProvider} from './manifest/LiveManifestRegisterProvider'
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
import {WorkspaceLoader} from './workspaceLoader/WorkspaceLoader'
import {WorkspacesProvider} from './workspaces/WorkspacesProvider'

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

  // Register refractor languages on first render (deferred from module scope for faster import)
  ensureRefractorLanguages()

  // Extract the first workspace's projectId for use in error screens
  const primaryProjectId = useMemo(() => {
    const workspace = Array.isArray(config) ? config[0] : config
    return workspace?.projectId
  }, [config])

  const _children = useMemo(
    () => (
      <UserApplicationCacheProvider>
        <LiveUserApplicationProvider>
          <LiveManifestRegisterProvider />
          <WorkspaceLoader
            LoadingComponent={LoadingBlock}
            ConfigErrorsComponent={ConfigErrorsScreen}
          >
            <LocaleProvider>
              <PackageVersionStatusProvider>
                <MaybeEnableErrorReporting errorReporter={errorReporter} />
                <ResourceCacheProvider>
                  <StudioTelemetryProvider>
                    <AppIdCacheProvider>
                      <ComlinkRouteHandler />
                      <StudioAnnouncementsProvider>
                        <GlobalPerspectiveProvider>
                          <DocumentLimitUpsellProvider>
                            <AssetLimitUpsellProvider>{children}</AssetLimitUpsellProvider>
                          </DocumentLimitUpsellProvider>
                        </GlobalPerspectiveProvider>
                      </StudioAnnouncementsProvider>
                    </AppIdCacheProvider>
                  </StudioTelemetryProvider>
                </ResourceCacheProvider>
              </PackageVersionStatusProvider>
            </LocaleProvider>
          </WorkspaceLoader>
        </LiveUserApplicationProvider>
      </UserApplicationCacheProvider>
    ),
    [children],
  )

  return (
    <DeferredTelemetryProvider>
      <ColorSchemeProvider onSchemeChange={onSchemeChange} scheme={scheme}>
        <ToastProvider paddingY={7} zOffset={Z_OFFSET.toast}>
          <StudioErrorBoundary primaryProjectId={primaryProjectId}>
            <StudioRootErrorHandler primaryProjectId={primaryProjectId}>
              <WorkspacesProvider
                config={config}
                basePath={basePath}
                LoadingComponent={LoadingBlock}
              >
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
    </DeferredTelemetryProvider>
  )
}

let _refractorRegistered = false

function ensureRefractorLanguages() {
  if (_refractorRegistered) return
  _refractorRegistered = true
  void import('react-refractor').then(({registerLanguage}) =>
    Promise.all([
      import('refractor/bash'),
      import('refractor/javascript'),
      import('refractor/json'),
      import('refractor/jsx'),
      import('refractor/typescript'),
    ])
      .then((languages) => languages.forEach((lang) => registerLanguage(lang.default)))
      .catch((error) =>
        console.warn('Failed to load syntax highlighting languages for code blocks', error),
      ),
  )
}
