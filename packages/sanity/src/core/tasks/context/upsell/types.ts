import {type ObservablePromise} from 'react-rx'

import {type UpsellDialogViewedInfo} from '../../../studio/upsell/__telemetry__/upsell.telemetry'
import {type UpsellDataResult} from '../../../studio/upsell/types'

export interface TasksUpsellContextValue {
  upsellDialogOpen: boolean
  handleOpenDialog: (source: UpsellDialogViewedInfo['source']) => void
  handleClose: () => void
  /**
   * The upsell content, settled once its request has answered, or `null` outside the provider.
   * Read it with `use()` in the leaf that renders the content, under a `Suspense` boundary.
   */
  upsellDataPromise: ObservablePromise<UpsellDataResult> | null
  telemetryLogs: {
    dialogSecondaryClicked: () => void
    dialogPrimaryClicked: () => void
    panelViewed: (source: UpsellDialogViewedInfo['source']) => void
    panelDismissed: () => void
    panelPrimaryClicked: () => void
    panelSecondaryClicked: () => void
  }
}
