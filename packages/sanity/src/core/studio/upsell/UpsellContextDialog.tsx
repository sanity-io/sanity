import {use} from 'react'

import {type UpsellContextValue} from '../../hooks/useUpsellContext'
import {UpsellDialog} from './UpsellDialog'

interface UpsellContextDialogProps {
  contextValue: UpsellContextValue
}

/**
 * The `UpsellDialog` of a `useUpsellContext` provider. Closed, it renders nothing and never
 * touches the upsell data; `handleOpenDialog` opens it only once that data has settled, so the
 * `use()` below reads synchronously. Render it under a `Suspense` boundary next to the provider's
 * children all the same, so a wait, should one ever happen, stays out of the provider's subtree.
 *
 * @internal
 */
export function UpsellContextDialog({contextValue}: UpsellContextDialogProps) {
  if (!contextValue.upsellDialogOpen) return null
  return <OpenUpsellContextDialog contextValue={contextValue} />
}

function OpenUpsellContextDialog({contextValue}: UpsellContextDialogProps) {
  const {handleClose, telemetryLogs, upsellDataPromise} = contextValue
  const {upsellData} = use(upsellDataPromise)

  return (
    <UpsellDialog
      data={upsellData}
      onClose={handleClose}
      onPrimaryClick={telemetryLogs.dialogPrimaryClicked}
      onSecondaryClick={telemetryLogs.dialogSecondaryClicked}
    />
  )
}
