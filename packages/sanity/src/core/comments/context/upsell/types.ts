import {type UpsellDialogViewedInfo} from '../../../studio'
import {type UpsellData} from '../../../studio/upsell/types'

/**
 * @beta
 * @hidden
 */
export interface CommentsUpsellContextValue {
  upsellDialogOpen: boolean
  /**
   * @internal
   */
  handleOpenDialog: (source: UpsellDialogViewedInfo['source']) => void
  upsellData: UpsellData | null
  telemetryLogs: {
    dialogSecondaryClicked: () => void
    dialogPrimaryClicked: () => void
    /**
     * @internal
     */
    panelViewed: (source: UpsellDialogViewedInfo['source']) => void
    panelDismissed: () => void
    panelPrimaryClicked: () => void
    panelSecondaryClicked: () => void
  }
}
