import {Suspense} from 'react'

import {useRenderingContextStore} from '../../store/datastores'
import {useDashboardRouteHandler} from '../hooks/useDashboardRouteHandler'

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

function RouteSync(): null {
  useDashboardRouteHandler()
  return null
}
