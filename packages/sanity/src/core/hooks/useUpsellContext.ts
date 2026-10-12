import {useCallback, useEffect, useMemo, useState} from 'react'
import {type ObservablePromise, preloadObservablePromise, useObservablePromise} from 'react-rx'
import {catchError, from, of, switchMap} from 'rxjs'

import {type UpsellDialogViewedInfo} from '../studio/upsell/__telemetry__/upsell.telemetry'
import {type UpsellDataResult} from '../studio/upsell/types'
import {NO_UPSELL_DATA, type UpsellTelemetryLogs, useUpsellData} from './useUpsellData'

interface UseUpsellContextOptions {
  dataUri: string
  feature: string
  /**
   * The feature's mode promise, for a provider that is mounted in every mode (`useTasksMode()`,
   * `useCommentsMode()`). The content is only requested once the mode has settled as `'upsell'`;
   * in `'default'` mode and after a failed check (`null`) the promise the context hands out
   * settles as `NO_UPSELL_DATA` without a request. Omit it where the content is always needed.
   */
  mode?: Promise<'default' | 'upsell' | null>
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
 * Creates context value for simple upsell providers.
 * Handles data fetching, dialog state management, and error handling with toast notifications.
 *
 * The request starts when the provider commits (`preloadObservablePromise` in an effect, which
 * also keeps the answer cached across a remount), or, when `mode` is given, once that mode has
 * settled as `'upsell'`, so a plan that has the feature never requests the content. It is read
 * with `use()` where its answer is rendered: `UpsellContextDialog` (which reports a failed request
 * with a toast and closes again) and the upsell panels. The provider itself never suspends on it
 * and does not re-render when it arrives.
 *
 * For complex providers with custom logic, use useUpsellData directly.
 *
 * @internal
 */
export function useUpsellContext({
  dataUri,
  feature,
  mode,
}: UseUpsellContextOptions): UpsellContextValue {
  const [upsellDialogOpen, setUpsellDialogOpen] = useState(false)
  const {upsellData$: requested$, telemetryLogs} = useUpsellData({dataUri, feature})
  // Derived inside the observable (not with `.then()` on the mode promise), so the promise the
  // context hands out is the one react-rx fulfils in place once the content, or the answer that
  // none is needed, is in
  const upsellData$ = useMemo(() => {
    if (!mode) return requested$
    return from(mode).pipe(
      switchMap((settledMode) => (settledMode === 'upsell' ? requested$ : of(NO_UPSELL_DATA))),
      catchError(() => of(NO_UPSELL_DATA)),
    )
  }, [mode, requested$])
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
