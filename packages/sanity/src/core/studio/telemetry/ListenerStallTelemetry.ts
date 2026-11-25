import {type TelemetryLogger} from '@sanity/telemetry'
import {useTelemetry} from '@sanity/telemetry/react'
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
import {ListenerStallDetected} from '../__telemetry__/listeners.telemetry'

const workspaceStallLogger: {logger: TelemetryLogger<unknown> | undefined} = {logger: undefined}
let lastReportedStallOccurrence = 0

/**
 * Classifies each listener stall detected in this tab and logs `ListenerStallDetected` once per
 * occurrence. It mounts under `DeferredTelemetryProvider` so a boot stall (on `/users/me`, before
 * any workspace mounts) is buffered until a workspace's telemetry store mounts.
 *
 * @internal
 */
export function ListenerStallTelemetry(): null {
  const deferredTelemetry = useTelemetry()

  useEffect(
    () =>
      subscribeListenerStall((stall) => {
        void reportListenerStall({
          stall,
          resolveTelemetry: () => workspaceStallLogger.logger ?? deferredTelemetry,
        })
      }),
    [deferredTelemetry],
  )

  return null
}

/**
 * Hands `ListenerStallTelemetry`'s reporter the workspace logger while mounted. The workspace
 * `TelemetryProvider` drains the deferred buffer only when its store changes, so events buffered
 * afterwards would never send.
 *
 * @internal
 */
export function ListenerStallWorkspaceLogger(props: {telemetry: TelemetryLogger<unknown>}): null {
  const {telemetry} = props

  useEffect(() => {
    workspaceStallLogger.logger = telemetry
    return () => {
      if (workspaceStallLogger.logger === telemetry) workspaceStallLogger.logger = undefined
    }
  }, [telemetry])

  return null
}

async function reportListenerStall(options: {
  stall: DetectedStall
  resolveTelemetry: () => TelemetryLogger<unknown>
}): Promise<void> {
  const {stall, resolveTelemetry} = options
  if (stall.stallOccurrence <= lastReportedStallOccurrence) return
  lastReportedStallOccurrence = stall.stallOccurrence

  const ledgerSnapshot = await snapshot(stall.host)
  const protocol = getMeasuredApiProtocol(stall.host)
  // Picks up a workspace logger that mounted during the snapshot.
  const telemetry = resolveTelemetry()

  telemetry.log(ListenerStallDetected, {
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
