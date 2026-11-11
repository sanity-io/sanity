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
import {ListenerLimitMessageShown} from '../__telemetry__/listeners.telemetry'

const workspaceTelemetry: {logger: TelemetryLogger<unknown> | undefined} = {logger: undefined}

/**
 * Classifies each listener stall detected in this tab and logs `ListenerLimitMessageShown` once
 * per occurrence. Render it directly inside `DeferredTelemetryProvider`, above `AuthBoundary`, so
 * a stall during boot is buffered until a workspace's telemetry store mounts.
 *
 * @internal
 */
export function ListenerStallTelemetry(): null {
  const deferredTelemetry = useTelemetry()

  useEffect(
    () =>
      subscribeListenerStall((stall) => {
        void reportListenerStall({stall, fallbackTelemetry: deferredTelemetry})
      }),
    [deferredTelemetry],
  )

  return null
}

/**
 * Sends `ListenerStallTelemetry`'s events straight to `telemetry` while mounted. Render it inside
 * the workspace's `TelemetryProvider`: the deferred buffer is drained only once, when that
 * provider mounts, so later events logged to it would never send.
 *
 * @internal
 */
export function ListenerStallWorkspaceTelemetry(props: {
  telemetry: TelemetryLogger<unknown>
}): null {
  const {telemetry} = props

  useEffect(() => {
    workspaceTelemetry.logger = telemetry
    return () => {
      if (workspaceTelemetry.logger === telemetry) workspaceTelemetry.logger = undefined
    }
  }, [telemetry])

  return null
}

async function reportListenerStall(options: {
  stall: DetectedStall
  fallbackTelemetry: TelemetryLogger<unknown>
}): Promise<void> {
  const {stall, fallbackTelemetry} = options
  const ledgerSnapshot = await snapshot(stall.host)
  const protocol = getMeasuredApiProtocol(stall.host)
  const telemetry = workspaceTelemetry.logger ?? fallbackTelemetry

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
