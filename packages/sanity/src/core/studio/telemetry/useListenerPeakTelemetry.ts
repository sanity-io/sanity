import {type SanityClient} from '@sanity/client'
import {type TelemetryLogger} from '@sanity/telemetry'
import {useEffect} from 'react'

import {getApiProtocol} from '../../network/isUsingLegacyHttp'
import {getListenerCounts} from '../../network/listenerCount'
import {getPeakStudioTabCount, startTrackingStudioTabs} from '../../network/studioTabs'
import {ListenerPeakMeasured} from '../__telemetry__/listeners.telemetry'

const REPORT_INTERVAL_MS = 5 * 60_000

// Module scope so a workspace switch, which remounts the telemetry provider, does not report the same peak again.
let lastReportedPeak = 0

/**
 * Reports the tab's peak listener count every five minutes, whenever it has risen since the last report.
 *
 * @internal
 */
export function useListenerPeakTelemetry(
  telemetry: TelemetryLogger<unknown>,
  protocolCheckClient: SanityClient,
): void {
  useEffect(() => {
    startTrackingStudioTabs()
    let protocol = 'unknown'
    const protocolSubscription = getApiProtocol(protocolCheckClient).subscribe((detected) => {
      protocol = detected
    })

    const interval = setInterval(() => {
      const {peak} = getListenerCounts()
      if (peak > lastReportedPeak) {
        lastReportedPeak = peak
        telemetry.log(ListenerPeakMeasured, {
          peakListenerCount: peak,
          peakStudioTabCount: getPeakStudioTabCount() ?? null,
          protocol,
          sessionDurationMs: Math.round(performance.now()),
        })
      }
    }, REPORT_INTERVAL_MS)

    return () => {
      clearInterval(interval)
      protocolSubscription.unsubscribe()
    }
  }, [telemetry, protocolCheckClient])
}
