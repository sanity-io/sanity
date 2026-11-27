import {lazy, Suspense} from 'react'

import {useRenderingContextStore} from '../../store/datastores'

// Only a studio running inside a dashboard host syncs its route, and the SDK's dashboard export
// that does it brings the module federation runtime along, so it loads in its own chunk
const RouteSync = lazy(() => import('./DashboardRouteSync'))

export function DashboardRouteHandler() {
  const hasDashboardHost = useRenderingContextStore().getCapabilities()?.dashboard === true
  if (!hasDashboardHost) return null

  return (
    // The SDK's navigate hook suspends until the host connects.
    <Suspense fallback={null}>
      <RouteSync />
    </Suspense>
  )
}
