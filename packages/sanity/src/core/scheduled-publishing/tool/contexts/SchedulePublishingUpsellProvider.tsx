import {useCallback, useContext, useMemo, useState} from 'react'
import {
  SchedulePublishUpsellContext,
  type SchedulePublishUpsellContextValue,
} from 'sanity/_singletons'

import {useUpsellData} from '../../../hooks'
import {type UpsellDialogViewedInfo} from '../../../studio/upsell/__telemetry__/upsell.telemetry'
import {UpsellDialog} from '../../../studio/upsell/UpsellDialog'

/**
 * @beta
 */
export function SchedulePublishingUpsellProvider(props: {children: React.ReactNode}) {
  const [upsellDialogOpen, setUpsellDialogOpen] = useState(false)
  const {upsellData, telemetryLogs} = useUpsellData({
    dataUri: '/journey/scheduled-publishing',
    feature: 'scheduled_publishing',
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

  const ctxValue = useMemo<SchedulePublishUpsellContextValue>(
    () => ({
      upsellDialogOpen,
      handleOpenDialog,
      upsellData,
      telemetryLogs,
    }),
    [handleOpenDialog, upsellDialogOpen, upsellData, telemetryLogs],
  )

  return (
    <SchedulePublishUpsellContext.Provider value={ctxValue}>
      {props.children}
      {upsellData && upsellDialogOpen && (
        <UpsellDialog
          data={upsellData}
          onClose={handleClose}
          onPrimaryClick={handlePrimaryButtonClick}
          onSecondaryClick={handleSecondaryButtonClick}
        />
      )}
    </SchedulePublishUpsellContext.Provider>
  )
}

export function useSchedulePublishingUpsell(): SchedulePublishUpsellContextValue {
  const context = useContext(SchedulePublishUpsellContext)
  return context
}
