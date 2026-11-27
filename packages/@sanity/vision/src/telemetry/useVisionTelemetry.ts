import {useTelemetry} from '@sanity/telemetry/react'
import {useCallback, useMemo} from 'react'

import {VISION_VERSION} from '../version'
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

function withVisionVersion<Data extends object>(data: Data): Data & {visionVersion: string} {
  return {...data, visionVersion: VISION_VERSION}
}

/** Usage events for the Vision tool. See `vision.telemetry.ts`. */
export function useVisionTelemetry(): VisionTelemetry {
  const telemetry = useTelemetry()

  const opened = useCallback(
    (ui: VisionUi) => {
      telemetry.log(VisionOpened, withVisionVersion({ui}))
    },
    [telemetry],
  )

  const queryRun = useCallback(
    (data: VisionQueryRunData) => {
      telemetry.log(VisionQueryRun, withVisionVersion(data))
      if (data.hasParams) telemetry.log(VisionParamsUsed, withVisionVersion({mode: data.mode}))
    },
    [telemetry],
  )

  const queryCancelled = useCallback(
    (mode: VisionQueryMode) => {
      telemetry.log(VisionQueryCancelled, withVisionVersion({mode}))
    },
    [telemetry],
  )

  const datasetChanged = useCallback(() => {
    telemetry.log(VisionDatasetChanged, withVisionVersion({}))
  }, [telemetry])

  const perspectiveChanged = useCallback(() => {
    telemetry.log(VisionPerspectiveChanged, withVisionVersion({}))
  }, [telemetry])

  const apiVersionChanged = useCallback(
    (custom: boolean) => {
      telemetry.log(VisionApiVersionChanged, withVisionVersion({custom}))
    },
    [telemetry],
  )

  const copied = useCallback(
    (target: VisionCopyTarget) => {
      telemetry.log(VisionCopied, withVisionVersion({target}))
    },
    [telemetry],
  )

  const queryUrlPasted = useCallback(() => {
    telemetry.log(VisionQueryUrlPasted, withVisionVersion({}))
  }, [telemetry])

  const savedQueryUsed = useCallback(
    (action: VisionSavedQueryAction, shared: boolean) => {
      telemetry.log(VisionSavedQueryUsed, withVisionVersion({action, shared}))
    },
    [telemetry],
  )

  const savedQueriesFiltered = useCallback(
    (filter: VisionSavedQueriesFilter) => {
      telemetry.log(VisionSavedQueriesFiltered, withVisionVersion({filter}))
    },
    [telemetry],
  )

  const resultExported = useCallback(
    (format: VisionResultExportFormat) => {
      telemetry.log(VisionResultExported, withVisionVersion({format}))
    },
    [telemetry],
  )

  const documentOpened = useCallback(
    (source: VisionDocumentOpenSource) => {
      telemetry.log(VisionDocumentOpened, withVisionVersion({source}))
    },
    [telemetry],
  )

  const panelToggled = useCallback(
    (panel: VisionPanel, open: boolean) => {
      telemetry.log(VisionPanelToggled, withVisionVersion({panel, open}))
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
