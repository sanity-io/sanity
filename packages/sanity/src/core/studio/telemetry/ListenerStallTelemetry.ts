import {type SanityClient} from '@sanity/client'
import {type TelemetryLogger} from '@sanity/telemetry'
import {useEffect} from 'react'

import {classifyStall, LISTENER_STALL_BUDGET} from '../../network/classifyStall'
import {getMeasuredApiProtocol} from '../../network/isUsingLegacyHttp'
import {countStalledRequests} from '../../network/listenerCount'
import {snapshot} from '../../network/listenerLedger'
import {
  type DetectedStall,
  LISTENER_STALL_TRIGGER_MS,
  subscribeListenerStall,
} from '../../network/listenerStall'
import {getStudioTabScope} from '../../network/studioTabs'
import {ListenerLimitMessageShown} from '../__telemetry__/listeners.telemetry'

/**
 * Classifies each listener stall detected in this tab and logs `ListenerLimitMessageShown` once
 * per occurrence. Render it inside the `TelemetryProvider` it logs to, alongside
 * `ListenerPeakTelemetry` - both read the same `protocolCheckClient`.
 *
 * @internal
 */
export function ListenerStallTelemetry(props: {
  telemetry: TelemetryLogger<unknown>
  protocolCheckClient: SanityClient
}): null {
  const {telemetry, protocolCheckClient} = props

  useEffect(() => {
    const scope = getStudioTabScope(protocolCheckClient.config().apiHost)
    return subscribeListenerStall((stall) => {
      void reportListenerStall({stall, scope, telemetry})
    })
  }, [telemetry, protocolCheckClient])

  return null
}

async function reportListenerStall(options: {
  stall: DetectedStall
  scope: string
  telemetry: TelemetryLogger<unknown>
}): Promise<void> {
  const {stall, scope, telemetry} = options
  const ledgerSnapshot = await snapshot(scope)
  const protocol = getMeasuredApiProtocol(scope)

  telemetry.log(ListenerLimitMessageShown, {
    kind: classifyStall({snapshot: ledgerSnapshot, protocol}),
    listenersAllTabs: ledgerSnapshot?.total ?? 0,
    listenersThisTab: ledgerSnapshot?.self?.count ?? 0,
    listenersOtherTabs: ledgerSnapshot?.othersTotal ?? 0,
    knownStudioTabs: ledgerSnapshot?.liveTabCount ?? 0,
    unknownStudioTabs: ledgerSnapshot?.unknownTabCount ?? 0,
    stalledListenersThisTab: countStalledRequests(LISTENER_STALL_TRIGGER_MS),
    stalledOtherTabs: ledgerSnapshot?.stalledOtherTabCount ?? 0,
    isBootStall: stall.isBootStall,
    stallOccurrence: stall.stallOccurrence,
    stalledForMs: stall.stalledForMs,
    protocol: protocol ?? 'unknown',
    budget: LISTENER_STALL_BUDGET,
  })
}
