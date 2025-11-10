import {type PropsWithChildren, useCallback, useContext, useMemo, useState} from 'react'
import {AssetLimitUpsellContext, type AssetLimitUpsellContextValue} from 'sanity/_singletons'

import {useUpsellData} from '../../../hooks/useUpsellData'
import {type UpsellDialogViewedInfo} from '../../../studio'
import {UpsellDialog} from '../../../studio/upsell/UpsellDialog'

export function AssetLimitUpsellProvider({children}: PropsWithChildren) {
  const [upsellDialogOpen, setUpsellDialogOpen] = useState(false)
  const {upsellData, telemetryLogs} = useUpsellData({
    dataUri: '/journey/asset-limit',
    feature: 'asset-limits',
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

  const ctxValue = useMemo<AssetLimitUpsellContextValue>(
    () => ({
      upsellDialogOpen,
      handleOpenDialog,
      upsellData,
      telemetryLogs,
    }),
    [handleOpenDialog, upsellDialogOpen, upsellData, telemetryLogs],
  )

  return (
    <AssetLimitUpsellContext.Provider value={ctxValue}>
      {children}
      {upsellData && upsellDialogOpen && (
        <UpsellDialog
          data={upsellData}
          onClose={handleClose}
          onPrimaryClick={handlePrimaryButtonClick}
          onSecondaryClick={handleSecondaryButtonClick}
        />
      )}
    </AssetLimitUpsellContext.Provider>
  )
}

/**
 * @internal
 */
export const useAssetLimitsUpsellContext = (): AssetLimitUpsellContextValue => {
  const context = useContext(AssetLimitUpsellContext)
  if (!context) {
    throw new Error('useAssetLimitsUpsellContext must be used within a AssetLimitUpsellProvider')
  }
  return context
}
