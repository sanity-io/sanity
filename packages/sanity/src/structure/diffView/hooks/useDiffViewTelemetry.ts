import {useTelemetry} from '@sanity/telemetry/react'
import {useCallback, useMemo} from 'react'

import {
  DiffViewDocumentSelectionChanged,
  type DiffViewDocumentSelectionChangedInfo,
  type DiffViewDocumentSelectionInfo,
  DiffViewEntered,
  DiffViewExited,
} from '../__telemetry__/diffView.telemetry'

interface DiffViewTelemetryHookValue {
  diffViewEntered: (info: DiffViewDocumentSelectionInfo) => void
  diffViewExited: (info: DiffViewDocumentSelectionInfo) => void
  diffViewDocumentSelectionChanged: (info: DiffViewDocumentSelectionChangedInfo) => void
}

/** @internal */
export function useDiffViewTelemetry(): DiffViewTelemetryHookValue {
  const telemetry = useTelemetry()

  const diffViewEntered = useCallback(
    (info: DiffViewDocumentSelectionInfo) => {
      telemetry.log(DiffViewEntered, info)
    },
    [telemetry],
  )

  const diffViewExited = useCallback(
    (info: DiffViewDocumentSelectionInfo) => {
      telemetry.log(DiffViewExited, info)
    },
    [telemetry],
  )

  const diffViewDocumentSelectionChanged = useCallback(
    (info: DiffViewDocumentSelectionChangedInfo) => {
      telemetry.log(DiffViewDocumentSelectionChanged, info)
    },
    [telemetry],
  )

  return useMemo(
    (): DiffViewTelemetryHookValue => ({
      diffViewEntered,
      diffViewExited,
      diffViewDocumentSelectionChanged,
    }),
    [diffViewEntered, diffViewExited, diffViewDocumentSelectionChanged],
  )
}
