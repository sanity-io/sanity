import {useCallback, useContext, useMemo, useState} from 'react'
import {
  SingleDocReleaseUpsellContext,
  type SingleDocReleaseUpsellContextValue,
} from 'sanity/_singletons'

import {useUpsellData} from '../../hooks/useUpsellData'
import {type UpsellDialogViewedInfo} from '../../studio/upsell/__telemetry__/upsell.telemetry'
import {UpsellDialog} from '../../studio/upsell/UpsellDialog'

/**
 * @beta
 */
export function SingleDocReleaseUpsellProvider(props: {children: React.ReactNode}) {
  const [upsellDialogOpen, setUpsellDialogOpen] = useState(false)
  const {upsellData, telemetryLogs} = useUpsellData({
    dataUri: '/journey/scheduled-publishing',
    feature: 'single_doc_release',
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

  const ctxValue = useMemo<SingleDocReleaseUpsellContextValue>(
    () => ({
      upsellDialogOpen,
      handleOpenDialog,
      upsellData,
      telemetryLogs,
    }),
    [handleOpenDialog, upsellDialogOpen, upsellData, telemetryLogs],
  )

  return (
    <SingleDocReleaseUpsellContext.Provider value={ctxValue}>
      {props.children}
      {upsellData && upsellDialogOpen && (
        <UpsellDialog
          data={upsellData}
          onClose={handleClose}
          onPrimaryClick={handlePrimaryButtonClick}
          onSecondaryClick={handleSecondaryButtonClick}
        />
      )}
    </SingleDocReleaseUpsellContext.Provider>
  )
}

export function useSingleDocReleaseUpsell(): SingleDocReleaseUpsellContextValue {
  const context = useContext(SingleDocReleaseUpsellContext)
  return context
}
