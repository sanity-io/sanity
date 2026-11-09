import {type SanityClient} from '@sanity/client'
import {type TelemetryLogger} from '@sanity/telemetry'
import {useEffect} from 'react'

import {getApiProtocol} from '../../network/isUsingLegacyHttp'
import {getListenerCounts} from '../../network/listenerCount'
import {getPeakStudioTabCount, startTrackingStudioTabs} from '../../network/studioTabs'
import {ListenerPeakMeasured} from '../__telemetry__/listeners.telemetry'

// Studio remounts its telemetry provider on every workspace switch, so the page reports once
// and each mount only points it at its own logger.
const page: {
  telemetry?: TelemetryLogger<unknown>
  protocol: string
  isStarted: boolean
  isReported: boolean
} = {
  protocol: 'unknown',
  isStarted: false,
  isReported: false,
}

function reportListenerPeak(): void {
  if (page.isReported) return
  page.isReported = true
  page.telemetry?.log(ListenerPeakMeasured, {
    peakListenerCount: getListenerCounts().peak,
    peakStudioTabCount: getPeakStudioTabCount() ?? null,
    protocol: page.protocol,
    sessionDurationMs: Math.round(performance.now()),
  })
}

// On module load so it runs before the telemetry store's beacon; optional for the schema manifest worker.
globalThis.addEventListener?.('pagehide', reportListenerPeak, {capture: true})

/**
 * Reports one `Listener Peak Measured` event per page load, when the page is hidden for good.
 *
 * @internal
 */
export function useListenerPeakTelemetry(
  telemetry: TelemetryLogger<unknown>,
  protocolCheckClient: SanityClient,
): void {
  useEffect(() => {
    page.telemetry = telemetry
  }, [telemetry])

  useEffect(() => {
    if (page.isStarted) return
    page.isStarted = true
    startTrackingStudioTabs()
    getApiProtocol(protocolCheckClient).subscribe((protocol) => {
      page.protocol = protocol
    })
  }, [protocolCheckClient])
}
