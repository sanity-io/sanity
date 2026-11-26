import {useTelemetry} from '@sanity/telemetry/react'
import {useCallback, useMemo} from 'react'

import {
  VisionApiVersionChanged,
  VisionCopied,
  type VisionCopyTarget,
  VisionDatasetChanged,
  VisionDocumentOpened,
  type VisionDocumentOpenSource,
  VisionOpened,
  VisionPanelToggled,
  type VisionPanel,
  VisionParamsUsed,
  VisionPerspectiveChanged,
  VisionQueryCancelled,
  type VisionQueryMode,
  VisionQueryRun,
  type VisionQueryRunData,
  VisionQueryUrlPasted,
  VisionResultExported,
  type VisionResultExportFormat,
  VisionSavedQueriesFiltered,
  type VisionSavedQueriesFilter,
  VisionSavedQueryUsed,
  type VisionSavedQueryAction,
  type VisionUi,
} from './vision.telemetry'

export interface VisionTelemetry {
  opened: (ui: VisionUi) => void
  queryRun: (data: VisionQueryRunData) => void
  queryCancelled: (mode: VisionQueryMode) => void
  datasetChanged: () => void
  perspectiveChanged: () => void
  apiVersionChanged: (custom: boolean) => void
  copied: (target: VisionCopyTarget) => void
  queryUrlPasted: () => void
  savedQueryUsed: (action: VisionSavedQueryAction, shared: boolean) => void
  savedQueriesFiltered: (filter: VisionSavedQueriesFilter) => void
  resultExported: (format: VisionResultExportFormat) => void
  documentOpened: (source: VisionDocumentOpenSource) => void
  panelToggled: (panel: VisionPanel, open: boolean) => void
}

/** Usage events for the Vision tool. See `vision.telemetry.ts`. */
export function useVisionTelemetry(): VisionTelemetry {
  const telemetry = useTelemetry()

  const opened = useCallback(
    (ui: VisionUi) => {
      telemetry.log(VisionOpened, {ui})
    },
    [telemetry],
  )

  const queryRun = useCallback(
    (data: VisionQueryRunData) => {
      telemetry.log(VisionQueryRun, data)
      if (data.hasParams) telemetry.log(VisionParamsUsed, {mode: data.mode})
    },
    [telemetry],
  )

  const queryCancelled = useCallback(
    (mode: VisionQueryMode) => {
      telemetry.log(VisionQueryCancelled, {mode})
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
    (target: VisionCopyTarget) => {
      telemetry.log(VisionCopied, {target})
    },
    [telemetry],
  )

  const queryUrlPasted = useCallback(() => {
    telemetry.log(VisionQueryUrlPasted)
  }, [telemetry])

  const savedQueryUsed = useCallback(
    (action: VisionSavedQueryAction, shared: boolean) => {
      telemetry.log(VisionSavedQueryUsed, {action, shared})
    },
    [telemetry],
  )

  const savedQueriesFiltered = useCallback(
    (filter: VisionSavedQueriesFilter) => {
      telemetry.log(VisionSavedQueriesFiltered, {filter})
    },
    [telemetry],
  )

  const resultExported = useCallback(
    (format: VisionResultExportFormat) => {
      telemetry.log(VisionResultExported, {format})
    },
    [telemetry],
  )

  const documentOpened = useCallback(
    (source: VisionDocumentOpenSource) => {
      telemetry.log(VisionDocumentOpened, {source})
    },
    [telemetry],
  )

  const panelToggled = useCallback(
    (panel: VisionPanel, open: boolean) => {
      telemetry.log(VisionPanelToggled, {panel, open})
    },
    [telemetry],
  )

  return useMemo(
    (): VisionTelemetry => ({
      opened,
      queryRun,
      queryCancelled,
      datasetChanged,
      perspectiveChanged,
      apiVersionChanged,
      copied,
      queryUrlPasted,
      savedQueryUsed,
      savedQueriesFiltered,
      resultExported,
      documentOpened,
      panelToggled,
    }),
    [
      apiVersionChanged,
      copied,
      datasetChanged,
      documentOpened,
      opened,
      panelToggled,
      perspectiveChanged,
      queryCancelled,
      queryRun,
      queryUrlPasted,
      resultExported,
      savedQueriesFiltered,
      savedQueryUsed,
    ],
  )
}
