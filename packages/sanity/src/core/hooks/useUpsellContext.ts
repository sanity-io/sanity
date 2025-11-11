import {useToast} from '@sanity/ui'
import {useCallback, useMemo, useState} from 'react'

import {useTranslation} from '../i18n'
import {type UpsellDialogViewedInfo} from '../studio'
import {type UpsellData} from '../studio/upsell/types'
import {useUpsellData} from './useUpsellData'

interface UseUpsellContextOptions {
  dataUri: string
  feature: string
}

export interface UpsellContextValue {
  upsellDialogOpen: boolean
  handleOpenDialog: (source: UpsellDialogViewedInfo['source']) => void
  handleClose: () => void
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

/**
 * Transforms context value into props for UpsellDialog component.
 * Helper function to reduce boilerplate in simple providers.
 *
 * @internal
 */
export function getDialogPropsFromContext(contextValue: UpsellContextValue) {
  return {
    data: contextValue.upsellData,
    open: contextValue.upsellDialogOpen,
    onClose: contextValue.handleClose,
    onPrimaryClick: () => contextValue.telemetryLogs.dialogPrimaryClicked(),
    onSecondaryClick: () => contextValue.telemetryLogs.dialogSecondaryClicked(),
  }
}

/**
 * Creates context value for simple upsell providers.
 * Handles data fetching, dialog state management, and error handling with toast notifications.
 *
 * For complex providers with custom logic, use useUpsellData directly.
 *
 * @internal
 */
export function useUpsellContext({dataUri, feature}: UseUpsellContextOptions): UpsellContextValue {
  const [upsellDialogOpen, setUpsellDialogOpen] = useState(false)
  const {upsellData, telemetryLogs, hasError} = useUpsellData({
    dataUri,
    feature,
  })
  const toast = useToast()
  const {t} = useTranslation()

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

  return useMemo(
    () => ({
      upsellDialogOpen,
      handleOpenDialog,
      handleClose,
      upsellData,
      telemetryLogs,
    }),
    [upsellDialogOpen, handleOpenDialog, handleClose, upsellData, telemetryLogs],
  )
}
