import {useToast} from '@sanity/ui/toast'
import {useCallback, useEffect, useMemo, useState} from 'react'
import {type ObservablePromise, preloadObservablePromise, useObservablePromise} from 'react-rx'

import {useTranslation} from '../i18n/hooks/useTranslation'
import {type UpsellDialogViewedInfo} from '../studio/upsell/__telemetry__/upsell.telemetry'
import {type UpsellDataResult} from '../studio/upsell/types'
import {type UpsellTelemetryLogs, useUpsellData} from './useUpsellData'

interface UseUpsellContextOptions {
  dataUri: string
  feature: string
}

export interface UpsellContextValue {
  upsellDialogOpen: boolean
  handleOpenDialog: (source: UpsellDialogViewedInfo['source']) => void
  handleClose: () => void
  /**
   * The upsell content, settled once its request has answered. Read it with `use()` in the leaf
   * that renders the content, under a `Suspense` boundary, or await it in an event handler; never
   * on a path whose suspension would hold up a layout.
   */
  upsellDataPromise: ObservablePromise<UpsellDataResult>
  telemetryLogs: UpsellTelemetryLogs
}

/**
 * Creates context value for simple upsell providers.
 * Handles data fetching, dialog state management, and error handling with toast notifications.
 *
 * The request starts when the provider commits (`preloadObservablePromise` in an effect, which
 * also keeps the answer cached across a remount) and is only awaited where its answer is needed:
 * `handleOpenDialog` waits for it before opening (so the dialog never renders empty, and a failed
 * request becomes a toast), and `UpsellContextDialog` / the upsell panels read it with `use()`.
 * The provider itself never suspends on it and does not re-render when it arrives.
 *
 * For complex providers with custom logic, use useUpsellData directly.
 *
 * @internal
 */
export function useUpsellContext({dataUri, feature}: UseUpsellContextOptions): UpsellContextValue {
  const [upsellDialogOpen, setUpsellDialogOpen] = useState(false)
  const {upsellData$, telemetryLogs} = useUpsellData({dataUri, feature})
  const upsellDataPromise = useObservablePromise(upsellData$)
  useEffect(() => {
    void preloadObservablePromise(upsellData$)
  }, [upsellData$])
  const toast = useToast()
  const {t} = useTranslation()

  const handleClose = useCallback(() => {
    setUpsellDialogOpen(false)
    telemetryLogs.dialogDismissed()
  }, [telemetryLogs])

  const handleOpenDialog = useCallback(
    (source: UpsellDialogViewedInfo['source']) => {
      void upsellDataPromise.then(({hasError}) => {
        if (hasError) {
          toast.push({
            status: 'error',
            title: t('errors.unable-to-perform-action'),
            closable: true,
          })
          return
        }
        setUpsellDialogOpen(true)
        telemetryLogs.dialogViewed(source)
      })
    },
    [upsellDataPromise, toast, t, telemetryLogs],
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
