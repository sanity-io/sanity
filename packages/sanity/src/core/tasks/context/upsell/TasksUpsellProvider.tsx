import {useCallback, useMemo, useState} from 'react'
import {TasksUpsellContext} from 'sanity/_singletons'

import {useUpsellData} from '../../../hooks'
import {type UpsellDialogViewedInfo} from '../../../studio'
import {UpsellDialog} from '../../../studio/upsell/UpsellDialog'
import {type TasksUpsellContextValue} from './types'

// Date when the change from array to object in the data returned was introduced.
const API_VERSION = '2024-04-19'

/**
 * @beta
 * @hidden
 */
export function TasksUpsellProvider(props: {children: React.ReactNode}) {
  const [upsellDialogOpen, setUpsellDialogOpen] = useState(false)
  const {upsellData, telemetryLogs} = useUpsellData({
    dataUri: '/journey/tasks',
    feature: 'tasks',
    clientOptions: {apiVersion: API_VERSION},
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

  const ctxValue = useMemo<TasksUpsellContextValue>(
    () => ({
      upsellDialogOpen,
      handleOpenDialog,
      upsellData,
      telemetryLogs,
    }),
    [handleOpenDialog, upsellDialogOpen, upsellData, telemetryLogs],
  )

  return (
    <TasksUpsellContext.Provider value={ctxValue}>
      {props.children}
      {upsellData && upsellDialogOpen && (
        <UpsellDialog
          data={upsellData}
          onClose={handleClose}
          onPrimaryClick={handlePrimaryButtonClick}
          onSecondaryClick={handleSecondaryButtonClick}
        />
      )}
    </TasksUpsellContext.Provider>
  )
}
