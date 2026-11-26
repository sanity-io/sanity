import {DeferredTelemetryProvider} from '@sanity/telemetry/react'
import {ToastProvider} from '@sanity/ui/toast'
import {lazy, type ReactNode, Suspense, useEffect, useMemo} from 'react'

import {LoadingBlock} from '../components/loadingBlock/LoadingBlock'
import {preloadWorkspaceSourceResolver} from '../config/prepareConfig'
import {errorReporter} from '../error/errorReporter'
import {
  ActiveWorkspaceLocaleProvider,
  FallbackLocaleProvider,
} from '../i18n/components/LocaleProvider'
import {UserColorManagerProvider} from '../user-color/provider'
import {ActiveWorkspaceMatcher} from './activeWorkspaceMatcher/ActiveWorkspaceMatcher'
import {AuthBoundary} from './AuthBoundary'
import {ColorSchemeProvider} from './colorScheme'
import {Z_OFFSET} from './constants'
import {AuthenticateScreen} from './screens/AuthenticateScreen'
import {NotAuthenticatedScreen} from './screens/NotAuthenticatedScreen'
import {NotFoundScreen} from './screens/NotFoundScreen'
import {type StudioProps} from './Studio'
import {StudioErrorBoundary} from './StudioErrorBoundary'
import {StudioRootErrorHandler} from './StudioRootErrorHandler'
import {StudioThemeProvider} from './StudioThemeProvider'
import {ListenerStallTelemetry} from './telemetry/ListenerStallTelemetry'
import {ConfigErrorGate} from './workspaces/ConfigErrorGate'
import {VisibleWorkspacesProvider} from './workspaces/VisibleWorkspacesProvider'
import {WorkspacesProvider} from './workspaces/WorkspacesProvider'

const AuthenticatedStudio = lazy(() => import('./AuthenticatedStudio'))

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
  unstable_importMapUrl: importMapUrl,
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
      <>
        <PreloadWorkspaceSourceResolver />
        <Suspense fallback={<LoadingBlock />}>
          <AuthenticatedStudio importMapUrl={importMapUrl}>{children}</AuthenticatedStudio>
        </Suspense>
      </>
    ),
    [children, importMapUrl],
  )

  return (
    <DeferredTelemetryProvider>
      <ListenerStallTelemetry />
      <ColorSchemeProvider onSchemeChange={onSchemeChange} scheme={scheme}>
        <ToastProvider paddingY={7} zOffset={Z_OFFSET.toast}>
          <FallbackLocaleProvider>
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
                      <ActiveWorkspaceLocaleProvider>
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
                      </ActiveWorkspaceLocaleProvider>
                    </ActiveWorkspaceMatcher>
                  </VisibleWorkspacesProvider>
                </WorkspacesProvider>
              </StudioRootErrorHandler>
            </StudioErrorBoundary>
          </FallbackLocaleProvider>
        </ToastProvider>
      </ColorSchemeProvider>
    </DeferredTelemetryProvider>
  )
}

/**
 * Renders next to the lazily loaded authenticated tree, so the workspace source resolver it needs
 * right away loads in parallel with it rather than after it.
 */
function PreloadWorkspaceSourceResolver(): null {
  useEffect(() => {
    preloadWorkspaceSourceResolver()
  }, [])
  return null
}

let _refractorRegistered = false

async function registerRefractorLanguages() {
  const [{default: registerLanguage}, languages] = await Promise.all([
    import('./registerRefractorLanguage.lazy'),
    Promise.all([
      import('refractor/bash'),
      import('refractor/javascript'),
      import('refractor/json'),
      import('refractor/jsx'),
      import('refractor/typescript'),
      import('./refractorGroq.lazy'),
    ]),
  ])

  languages.forEach((language) => registerLanguage(language.default))
}

function ensureRefractorLanguages() {
  if (_refractorRegistered) return
  _refractorRegistered = true

  void registerRefractorLanguages().catch((error) =>
    console.warn('Failed to load syntax highlighting languages for code blocks', error),
  )
}
