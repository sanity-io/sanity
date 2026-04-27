import {useTelemetry} from '@sanity/telemetry/react'
import {useCallback, useMemo} from 'react'

import {
  ActedOnDivergence,
  type ActedOnDivergenceInfo,
  InspectedDivergence,
  type InspectedDivergenceInfo,
} from '../__telemetry__/divergence.telemetry'

interface DivergenceTelemetryHookValue {
  divergenceInspected: (info: InspectedDivergenceInfo) => void
  divergenceActed: (info: ActedOnDivergenceInfo) => void
}

/** @internal */
export function useDivergenceTelemetry(): DivergenceTelemetryHookValue {
  const telemetry = useTelemetry()

  const divergenceInspected = useCallback(
    (info: InspectedDivergenceInfo) => {
      telemetry.log(InspectedDivergence, info)
    },
    [telemetry],
  )

  const divergenceActed = useCallback(
    (info: ActedOnDivergenceInfo) => {
      telemetry.log(ActedOnDivergence, info)
    },
    [telemetry],
  )

  return useMemo(
    (): DivergenceTelemetryHookValue => ({divergenceInspected, divergenceActed}),
    [divergenceInspected, divergenceActed],
  )
}
