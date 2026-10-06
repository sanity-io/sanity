import {type ObservablePromise} from 'react-rx'

import {type UpsellDialogViewedInfo} from '../../../studio/upsell/__telemetry__/upsell.telemetry'
import {type UpsellDataResult} from '../../../studio/upsell/types'

export interface CommentsUpsellContextValue {
  upsellDialogOpen: boolean
  handleOpenDialog: (source: UpsellDialogViewedInfo['source']) => void
  handleClose: () => void
  upsellDataPromise: ObservablePromise<UpsellDataResult>
  telemetryLogs: {
    dialogSecondaryClicked: () => void
    dialogPrimaryClicked: () => void
    panelViewed: (source: UpsellDialogViewedInfo['source']) => void
    panelDismissed: () => void
    panelPrimaryClicked: () => void
    panelSecondaryClicked: () => void
  }
}
