import {type UpsellDialogViewedInfo} from '../../../studio'
import {type UpsellData} from '../../../studio/upsell/types'

export interface DocumentLimitUpsellContextValue {
  upsellDialogOpen: boolean
  handleOpenDialog: (source: UpsellDialogViewedInfo['source']) => void
  upsellData: UpsellData | null
  telemetryLogs: {
    dialogSecondaryClicked: () => void
    dialogPrimaryClicked: () => void
  }
}
