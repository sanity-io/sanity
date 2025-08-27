import {type PropsWithChildren, useCallback, useContext, useMemo, useState} from 'react'
import {DocumentLimitUpsellContext, type DocumentLimitUpsellContextValue} from 'sanity/_singletons'

import {useUpsellData} from '../../../hooks/useUpsellData'
import {type UpsellDialogViewedInfo} from '../../../studio'
import {UpsellDialog} from '../../../studio/upsell/UpsellDialog'

export function DocumentLimitUpsellProvider({children}: PropsWithChildren) {
  const [upsellDialogOpen, setUpsellDialogOpen] = useState(false)
  const {upsellData, telemetryLogs} = useUpsellData({
    dataUri: '/journey/document-limit',
    feature: 'document-limits',
  })

  const handleOpenDialog = useCallback(
    (source: UpsellDialogViewedInfo['source']) => {
      setUpsellDialogOpen(true)
      telemetryLogs.dialogViewed(source)
    },
    [telemetryLogs],
  )

  const handleClose = useCallback(() => {
    setUpsellDialogOpen(false)
    telemetryLogs.dialogDismissed()
  }, [telemetryLogs])

  const handlePrimaryButtonClick = useCallback(() => {
    telemetryLogs.dialogPrimaryClicked()
  }, [telemetryLogs])

  const handleSecondaryButtonClick = useCallback(() => {
    telemetryLogs.dialogSecondaryClicked()
  }, [telemetryLogs])

  const ctxValue = useMemo<DocumentLimitUpsellContextValue>(
    () => ({
      upsellDialogOpen,
      handleOpenDialog,
      upsellData,
      telemetryLogs,
    }),
    [handleOpenDialog, upsellDialogOpen, upsellData, telemetryLogs],
  )

  return (
    <DocumentLimitUpsellContext.Provider value={ctxValue}>
      {children}
      {upsellData && upsellDialogOpen && (
        <UpsellDialog
          data={upsellData}
          onClose={handleClose}
          onPrimaryClick={handlePrimaryButtonClick}
          onSecondaryClick={handleSecondaryButtonClick}
        />
      )}
    </DocumentLimitUpsellContext.Provider>
  )
}

export const useDocumentLimitsUpsellContext = () => useContext(DocumentLimitUpsellContext)
