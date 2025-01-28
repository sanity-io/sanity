import {type UpsellDialogViewedInfo} from '../../../studio'
import {type UpsellData} from '../../../studio/upsell/types'

export interface ReleasesUpsellContextValue {
  upsellDialogOpen: boolean
  handleOpenDialog: (source: UpsellDialogViewedInfo['source']) => void
  execIfNotUpsell: (callback: () => void) => Promise<boolean>
  upsellData: UpsellData | null
  telemetryLogs: {
    dialogSecondaryClicked: () => void
    dialogPrimaryClicked: () => void
    panelViewed: (source: UpsellDialogViewedInfo['source']) => void
    panelDismissed: () => void
    panelPrimaryClicked: () => void
    panelSecondaryClicked: () => void
  }
}
