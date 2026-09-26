import {DeferredTelemetryProvider} from '@sanity/telemetry/react'
import {ToastProvider} from '@sanity/ui/toast'
import {type ReactNode, Suspense, useEffect, useMemo} from 'react'

import {LoadingBlock} from '../components/loadingBlock/LoadingBlock'
import {errorReporter} from '../error/errorReporter'
import {LocaleProvider} from '../i18n/components/LocaleProvider'
import {AssetLimitUpsellProvider} from '../limits/context/assets/AssetLimitUpsellProvider'
import {DocumentLimitUpsellProvider} from '../limits/context/documents/DocumentLimitUpsellProvider'
import {GlobalPerspectiveProvider} from '../perspective/GlobalPerspectiveProvider'
import {ResourceCacheProvider} from '../store/ResourceCacheProvider'
import {AppIdCacheProvider} from '../store/studio-app/AppIdCacheProvider'
import {UserApplicationCacheProvider} from '../store/userApplications'
import {UserColorManagerProvider} from '../user-color/provider'
import {ActiveWorkspaceMatcher} from './activeWorkspaceMatcher/ActiveWorkspaceMatcher'
import {AuthBoundary} from './AuthBoundary'
import {ColorSchemeProvider} from './colorScheme'
import {ComlinkRouteHandler} from './components/ComlinkRouteHandler'
import {Z_OFFSET} from './constants'
import {PreloadStudioShell} from './lazy'
import {LiveUserApplicationProvider} from './liveUserApplication/LiveUserApplicationProvider'
import {LiveManifestRegisterProvider} from './manifest'
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
import {UnclaimedProjectProvider} from './unclaimedProject/UnclaimedProjectProvider'
import {WorkspaceLoader} from './workspaceLoader/WorkspaceLoader'
import {ConfigErrorGate} from './workspaces/ConfigErrorGate'
import {VisibleWorkspacesProvider} from './workspaces/VisibleWorkspacesProvider'
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
  // Run in an effect to keep render pure; both calls are idempotent and buffer/guard
  // their own work, so StrictMode's double mount is safe.
  useEffect(() => {
    errorReporter.initialize()
    ensureRefractorLanguages()
  }, [])

  // First workspace's projectId — used by CorsOriginErrorScreen to decide
  // whether to surface the "Register studio" option (only valid when the
  // failing project matches the studio's primary project).
  const primaryProjectId = useMemo(() => {
    const first = Array.isArray(config) ? config[0] : config
    return first?.projectId
  }, [config])

  const _children = useMemo(
    () => (
      <UserApplicationCacheProvider>
        <PreloadStudioShell config={config} />
        <LiveUserApplicationProvider>
          <LiveManifestRegisterProvider />
          <WorkspaceLoader
            LoadingComponent={LoadingBlock}
            ConfigErrorsComponent={ConfigErrorsScreen}
          >
            <LocaleProvider>
              <PackageVersionStatusProvider>
                <ResourceCacheProvider>
                  <StudioTelemetryProvider>
                    <AppIdCacheProvider>
                      <ComlinkRouteHandler />
                      <StudioAnnouncementsProvider>
                        <GlobalPerspectiveProvider>
                          <DocumentLimitUpsellProvider>
                            <AssetLimitUpsellProvider>
                              <UnclaimedProjectProvider>{children}</UnclaimedProjectProvider>
                            </AssetLimitUpsellProvider>
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
    [children, config],
  )

  return (
    <DeferredTelemetryProvider>
      <ColorSchemeProvider onSchemeChange={onSchemeChange} scheme={scheme}>
        <ToastProvider paddingY={7} zOffset={Z_OFFSET.toast}>
          {/* The studio's own locale bundle loads on demand, and `useTranslation` suspends until
              its namespace has arrived. `LocaleProvider` (mounted after authentication) has a
              boundary for everything below it; this one covers what renders before that — the
              login screen, the config, CORS and schema error screens — so a slow chunk shows
              the loading block instead of suspending the root. */}
          <Suspense fallback={<LoadingBlock />}>
            <StudioErrorBoundary>
              <StudioRootErrorHandler>
                <WorkspacesProvider
                  config={config}
                  basePath={basePath}
                  LoadingComponent={LoadingBlock}
                  primaryProjectId={primaryProjectId}
                >
                  <VisibleWorkspacesProvider>
                    <ActiveWorkspaceMatcher
                      unstable_history={history}
                      NotFoundComponent={NotFoundScreen}
                      LoadingComponent={LoadingBlock}
                    >
                      <StudioThemeProvider>
                        <UserColorManagerProvider>
                          <ConfigErrorGate>
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
                          </ConfigErrorGate>
                        </UserColorManagerProvider>
                      </StudioThemeProvider>
                    </ActiveWorkspaceMatcher>
                  </VisibleWorkspacesProvider>
                </WorkspacesProvider>
              </StudioRootErrorHandler>
            </StudioErrorBoundary>
          </Suspense>
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
      import('@sanity/prism-groq').then((m) => ({default: m.refractorGroq})),
    ])
      .then((languages) => languages.forEach((lang) => registerLanguage(lang.default)))
      .catch((error) =>
        console.warn('Failed to load syntax highlighting languages for code blocks', error),
      ),
  )
}
