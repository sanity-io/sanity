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
  /**
   * Start the content request when the provider commits. Pass `true` only once the feature check
   * has settled as upsell, where a panel or the dialog will show the content. With `false` nothing
   * is requested until `handleOpenDialog` or `requestUpsellData` runs, and the dialog shows a
   * loading state until the content arrives.
   */
  preLoadData: boolean
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
  /** Starts the content request when it was not preloaded. `UpsellPanel` calls it when it mounts. */
  requestUpsellData: () => void
  telemetryLogs: UpsellTelemetryLogs
}

/**
 * Shared upsell dialog state: the content request, open and close, and telemetry.
 * A failed request is reported from `UpsellContextDialog`, which toasts and closes again.
 *
 * With `preLoadData` the request starts when the provider commits (`preloadObservablePromise` in
 * an effect, which also keeps the answer cached across a remount); without it, the observable is
 * not subscribed until the dialog opens or an `UpsellPanel` mounts, so a plan that has the feature
 * never calls `/journey/*`. The answer is read with `use()` where it is rendered, and both readers
 * show a loading state while they wait: `UpsellContextDialog` (which reports a failed request with
 * a toast and closes again) and `UpsellPanel`. The provider itself never suspends on it and does
 * not re-render when it arrives.
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
  preLoadData,
}: UseUpsellContextOptions): UpsellContextValue {
  const [upsellDialogOpen, setUpsellDialogOpen] = useState(false)
  const [requested, setRequested] = useState(false)
  const {upsellData$, telemetryLogs} = useUpsellData({dataUri, feature, enabled, fallbackData})
  const shouldLoad = preLoadData || requested
  // The hook subscribes on commit by itself, so it has to be disabled to keep the request cold
  const upsellDataPromise = useObservablePromise(upsellData$, {disabled: !shouldLoad})
  useEffect(() => {
    if (shouldLoad) void preloadObservablePromise(upsellData$)
  }, [shouldLoad, upsellData$])

  const requestUpsellData = useCallback(() => {
    setRequested(true)
  }, [])

  const handleClose = useCallback(() => {
    setUpsellDialogOpen(false)
    telemetryLogs.dialogDismissed()
  }, [telemetryLogs])

  const handleOpenDialog = useCallback(
    (source: UpsellDialogViewedInfo['source']) => {
      setRequested(true)
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
      requestUpsellData,
      telemetryLogs,
    }),
    [
      upsellDialogOpen,
      handleOpenDialog,
      handleClose,
      upsellDataPromise,
      requestUpsellData,
      telemetryLogs,
    ],
  )
}
