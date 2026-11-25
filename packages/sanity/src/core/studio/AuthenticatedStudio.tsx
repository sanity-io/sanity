import {type ReactNode} from 'react'

import {LoadingBlock} from '../components/loadingBlock/LoadingBlock'
import {LocaleProvider} from '../i18n/components/LocaleProvider'
import {AssetLimitUpsellProvider} from '../limits/context/assets/AssetLimitUpsellProvider'
import {DocumentLimitUpsellProvider} from '../limits/context/documents/DocumentLimitUpsellProvider'
import {GlobalPerspectiveProvider} from '../perspective/GlobalPerspectiveProvider'
import {ResourceCacheProvider} from '../store/ResourceCacheProvider'
import {AppIdCacheProvider} from '../store/studio-app/AppIdCacheProvider'
import {UserApplicationCacheProvider} from '../store/userApplications'
import {DashboardRouteHandler} from './components/DashboardRouteHandler'
import {ListenerGateController} from './listenerGate/ListenerGateController'
import {LiveUserApplicationProvider} from './liveUserApplication/LiveUserApplicationProvider'
import {LiveManifestRegisterProvider} from './manifest'
import {PackageVersionStatusProvider} from './packageVersionStatus/PackageVersionStatusProvider'
import {PluginProviders} from './PluginProviders'
import {PreloadStudioShell} from './preloadStudioShell'
import {ConfigErrorsScreen} from './screens/ConfigErrorsScreen'
import {StudioAnnouncementsProvider} from './studioAnnouncements/StudioAnnouncementsProvider'
import {StudioTelemetryProvider} from './telemetry/StudioTelemetryProvider'
import {UnclaimedProjectProvider} from './unclaimedProject/UnclaimedProjectProvider'
import {WorkspaceLoader} from './workspaceLoader/WorkspaceLoader'

/**
 * The part of the studio tree that only renders once the user is signed in (or when the studio
 * runs without an auth boundary). `StudioProvider` loads it lazily, so the login screen does not
 * download the workspace, the stores and the plugins.
 */
export default function AuthenticatedStudio({
  children,
  importMapUrl,
}: {
  children: ReactNode
  importMapUrl?: string
}) {
  return (
    <UserApplicationCacheProvider>
      <LiveUserApplicationProvider>
        <LiveManifestRegisterProvider />
        <PreloadStudioShell />
        <WorkspaceLoader LoadingComponent={LoadingBlock} ConfigErrorsComponent={ConfigErrorsScreen}>
          <LocaleProvider>
            <PackageVersionStatusProvider importMapUrl={importMapUrl}>
              <ResourceCacheProvider>
                <StudioTelemetryProvider>
                  <AppIdCacheProvider>
                    <ListenerGateController />
                    <DashboardRouteHandler />
                    <StudioAnnouncementsProvider>
                      <GlobalPerspectiveProvider>
                        <DocumentLimitUpsellProvider>
                          <AssetLimitUpsellProvider>
                            <UnclaimedProjectProvider>
                              <PluginProviders>{children}</PluginProviders>
                            </UnclaimedProjectProvider>
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
  )
}
