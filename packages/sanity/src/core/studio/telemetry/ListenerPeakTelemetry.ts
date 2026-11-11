import {type SanityClient} from '@sanity/client'
import {type TelemetryLogger} from '@sanity/telemetry'
import {useEffect} from 'react'

import {getApiProtocol} from '../../network/isUsingLegacyHttp'
import {getListenerCounts} from '../../network/listenerCount'
import {
  getPeakStudioTabCount,
  getStudioTabScope,
  startTrackingStudioTabs,
} from '../../network/studioTabs'
import {ListenerPeakMeasured} from '../__telemetry__/listeners.telemetry'

/**
 * Reports the tab's peak listener count when the tab closes. Render it inside the
 * `TelemetryProvider` it logs to: React runs a child's effects first, so this pagehide listener
 * runs before the provider's own, which sends the store's closing beacon.
 *
 * @internal
 */
export function ListenerPeakTelemetry(props: {
  telemetry: TelemetryLogger<unknown>
  protocolCheckClient: SanityClient
}): null {
  const {telemetry, protocolCheckClient} = props

  useEffect(() => {
    startTrackingStudioTabs(getStudioTabScope(protocolCheckClient.config().apiHost))
    let protocol = 'unknown'
    const protocolSubscription = getApiProtocol(protocolCheckClient).subscribe((detected) => {
      protocol = detected
    })

    function reportPeak() {
      telemetry.log(ListenerPeakMeasured, {
        peakListenerCount: getListenerCounts().peak,
        peakStudioTabCount: getPeakStudioTabCount() ?? null,
        protocol,
        sessionDurationMs: Math.round(performance.now()),
      })
    }

    window.addEventListener('pagehide', reportPeak, {capture: true})
    return () => {
      window.removeEventListener('pagehide', reportPeak, {capture: true})
      protocolSubscription.unsubscribe()
    }
  }, [telemetry, protocolCheckClient])

  return null
}
