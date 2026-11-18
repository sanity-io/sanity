import {useTelemetry} from '@sanity/telemetry/react'
import {useCallback, useMemo} from 'react'

import {
  VisionApiVersionChanged,
  VisionCopied,
  VisionDatasetChanged,
  VisionParamsUsed,
  VisionPerspectiveChanged,
  VisionQueryRun,
  type VisionQueryRunData,
} from './vision.telemetry'

export interface VisionTelemetry {
  queryRun: (data: VisionQueryRunData) => void
  datasetChanged: () => void
  perspectiveChanged: () => void
  apiVersionChanged: (custom: boolean) => void
  copied: (target: 'query' | 'url') => void
}

/** Adoption events for the Vision tool. See `vision.telemetry.ts`. */
export function useVisionTelemetry(): VisionTelemetry {
  const telemetry = useTelemetry()

  const queryRun = useCallback(
    (data: VisionQueryRunData) => {
      telemetry.log(VisionQueryRun, data)
      if (data.hasParams) telemetry.log(VisionParamsUsed, {mode: data.mode})
    },
    [telemetry],
  )

  const datasetChanged = useCallback(() => {
    telemetry.log(VisionDatasetChanged)
  }, [telemetry])

  const perspectiveChanged = useCallback(() => {
    telemetry.log(VisionPerspectiveChanged)
  }, [telemetry])

  const apiVersionChanged = useCallback(
    (custom: boolean) => {
      telemetry.log(VisionApiVersionChanged, {custom})
    },
    [telemetry],
  )

  const copied = useCallback(
    (target: 'query' | 'url') => {
      telemetry.log(VisionCopied, {target})
    },
    [telemetry],
  )

  return useMemo(
    (): VisionTelemetry => ({
      queryRun,
      datasetChanged,
      perspectiveChanged,
      apiVersionChanged,
      copied,
    }),
    [apiVersionChanged, copied, datasetChanged, perspectiveChanged, queryRun],
  )
}
