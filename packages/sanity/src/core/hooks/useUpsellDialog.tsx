import {useToast} from '@sanity/ui'
import {useCallback, useMemo, useState} from 'react'

import {useTranslation} from '../i18n'
import {type UpsellDialogViewedInfo} from '../studio'
import {type UpsellData} from '../studio/upsell/types'
import {UpsellDialog} from '../studio/upsell/UpsellDialog'
import {useUpsellData} from './useUpsellData'

interface UseUpsellDialogOptions {
  dataUri: string
  feature: string
}

interface UseUpsellDialogReturn {
  /**
   * Component that renders the upsell dialog when open
   */
  DialogComponent: () => React.ReactNode | null
  /**
   * Values to provide to the context
   */
  contextValue: {
    upsellDialogOpen: boolean
    handleOpenDialog: (source: UpsellDialogViewedInfo['source']) => void
    upsellData: UpsellData | null
    telemetryLogs: {
      dialogSecondaryClicked: () => void
      dialogPrimaryClicked: () => void
      dialogViewed: (source: UpsellDialogViewedInfo['source']) => void
      dialogDismissed: () => void
      panelViewed: (source: UpsellDialogViewedInfo['source']) => void
      panelDismissed: () => void
      panelPrimaryClicked: () => void
      panelSecondaryClicked: () => void
    }
  }
}

/**
 * Hook that provides complete upsell dialog management for simple use cases.
 * Handles state, callbacks, toast notifications, and dialog rendering.
 *
 * @internal
 */
export function useUpsellDialog({
  dataUri,
  feature,
}: UseUpsellDialogOptions): UseUpsellDialogReturn {
  const [upsellDialogOpen, setUpsellDialogOpen] = useState(false)
  const {upsellData, telemetryLogs, hasError} = useUpsellData({
    dataUri,
    feature,
  })
  const toast = useToast()
  const {t} = useTranslation()

  const handlePrimaryButtonClick = useCallback(() => {
    telemetryLogs.dialogPrimaryClicked()
  }, [telemetryLogs])

  const handleSecondaryButtonClick = useCallback(() => {
    telemetryLogs.dialogSecondaryClicked()
  }, [telemetryLogs])

  const handleClose = useCallback(() => {
    setUpsellDialogOpen(false)
    telemetryLogs.dialogDismissed()
  }, [telemetryLogs])

  const handleOpenDialog = useCallback(
    (source: UpsellDialogViewedInfo['source']) => {
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
    },
    [hasError, toast, t, telemetryLogs],
  )

  const DialogComponent = useCallback(() => {
    if (!upsellData || !upsellDialogOpen) {
      return null
    }

    return (
      <UpsellDialog
        data={upsellData}
        onClose={handleClose}
        onPrimaryClick={handlePrimaryButtonClick}
        onSecondaryClick={handleSecondaryButtonClick}
      />
    )
  }, [upsellData, upsellDialogOpen, handleClose, handlePrimaryButtonClick, handleSecondaryButtonClick])

  const contextValue = useMemo(
    () => ({
      upsellDialogOpen,
      handleOpenDialog,
      upsellData,
      telemetryLogs,
    }),
    [upsellDialogOpen, handleOpenDialog, upsellData, telemetryLogs],
  )

  return {
    DialogComponent,
    contextValue,
  }
}
