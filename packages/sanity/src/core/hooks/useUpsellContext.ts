import {useCallback, useEffect, useMemo, useState} from 'react'
import {type ObservablePromise, preloadObservablePromise, useObservablePromise} from 'react-rx'

import {type UpsellDialogViewedInfo} from '../studio/upsell/__telemetry__/upsell.telemetry'
import {type UpsellData, type UpsellDataResult} from '../studio/upsell/types'
import {type UpsellTelemetryLogs, useUpsellData} from './useUpsellData'

interface UseUpsellContextOptions {
  dataUri: string
  feature: string
  /** When `false`, the request is skipped and the upsellData$ observable settles with `fallbackData`. */
  enabled?: boolean
  /** Content used while `enabled` is `false`. */
  fallbackData?: UpsellData
}

export interface UpsellContextValue {
  upsellDialogOpen: boolean
  handleOpenDialog: (source: UpsellDialogViewedInfo['source']) => void
  handleClose: () => void
  /**
   * The upsell content, settled once its request has answered. Read it with `use()` in the leaf
   * that renders the content, under a `Suspense` boundary; never on a path whose suspension would
   * hold up a layout, and never awaited in an event handler.
   */
  upsellDataPromise: ObservablePromise<UpsellDataResult>
  telemetryLogs: UpsellTelemetryLogs
}

/**
 * Shared upsell dialog state: the content request, open and close, and telemetry.
 * A failed request is reported from `UpsellContextDialog`, which toasts and closes again.
 *
 * The request starts when the provider commits (`preloadObservablePromise` in an effect, which
 * also keeps the answer cached across a remount) and is read with `use()` where its answer is
 * rendered: `UpsellContextDialog` (which reports a failed request with a toast and closes again)
 * and the upsell panels. The provider itself never suspends on it and does not re-render when it
 * arrives.
 *
 * Providers with extra behavior compose this value with their own state. `ReleasesUpsellProvider`
 * does that for the release-limit guard, the misconfiguration dialog, and `{{releaseLimit}}` in
 * the copy.
 *
 * Pass `enabled: false` with `fallbackData` to settle that fixture. A leaf reads it the same way
 * it will read the endpoint once that is published.
 *
 * @internal
 */
export function useUpsellContext({
  dataUri,
  feature,
  enabled,
  fallbackData,
}: UseUpsellContextOptions): UpsellContextValue {
  const [upsellDialogOpen, setUpsellDialogOpen] = useState(false)
  const {upsellData$, telemetryLogs} = useUpsellData({dataUri, feature, enabled, fallbackData})
  const upsellDataPromise = useObservablePromise(upsellData$)
  useEffect(() => {
    void preloadObservablePromise(upsellData$)
  }, [upsellData$])

  const handleClose = useCallback(() => {
    setUpsellDialogOpen(false)
    telemetryLogs.dialogDismissed()
  }, [telemetryLogs])

  const handleOpenDialog = useCallback(
    (source: UpsellDialogViewedInfo['source']) => {
      setUpsellDialogOpen(true)
      telemetryLogs.dialogViewed(source)
    },
    [telemetryLogs],
  )

  return useMemo(
    () => ({
      upsellDialogOpen,
      handleOpenDialog,
      handleClose,
      upsellDataPromise,
      telemetryLogs,
    }),
    [upsellDialogOpen, handleOpenDialog, handleClose, upsellDataPromise, telemetryLogs],
  )
}
