import {useCallback, useMemo, useState} from 'react'
import {CommentsUpsellContext} from 'sanity/_singletons'

import {useUpsellData} from '../../../hooks/useUpsellData'
import {type UpsellDialogViewedInfo} from '../../../studio/upsell/__telemetry__/upsell.telemetry'
import {UpsellDialog} from '../../../studio/upsell/UpsellDialog'
import {type CommentsUpsellContextValue} from './types'

/**
 * @beta
 * @hidden
 */
export function CommentsUpsellProvider(props: {children: React.ReactNode}) {
  const [upsellDialogOpen, setUpsellDialogOpen] = useState(false)
  const {upsellData, telemetryLogs} = useUpsellData({
    dataUri: '/journey/comments',
    feature: 'comments',
  })

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
      setUpsellDialogOpen(true)
      telemetryLogs.dialogViewed(source)
    },
    [telemetryLogs],
  )

  const ctxValue = useMemo<CommentsUpsellContextValue>(
    () => ({
      upsellDialogOpen,
      handleOpenDialog,
      upsellData,
      telemetryLogs,
    }),
    [handleOpenDialog, upsellDialogOpen, upsellData, telemetryLogs],
  )

  return (
    <CommentsUpsellContext.Provider value={ctxValue}>
      {props.children}
      {upsellData && upsellDialogOpen && (
        <UpsellDialog
          data={upsellData}
          onClose={handleClose}
          onPrimaryClick={handlePrimaryButtonClick}
          onSecondaryClick={handleSecondaryButtonClick}
        />
      )}
    </CommentsUpsellContext.Provider>
  )
}
