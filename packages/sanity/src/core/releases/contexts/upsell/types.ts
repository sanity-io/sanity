import {type UpsellDialogViewedInfo} from '../../../studio'
import {type UpsellData} from '../../../studio/upsell/types'

export interface ReleasesUpsellContextValue {
  /**
   * Is upsell mode when the user has reached the release limit
   * Is default mode when the user has not reached the release limits
   */
  mode: 'upsell' | 'default'
  upsellDialogOpen: boolean
  upsellData: UpsellData | null
  guardWithReleaseLimitUpsell: (
    callback: () => void,
    throwError?: boolean,
    whenResolved?: (hasPassed: boolean) => void,
  ) => Promise<false | void>
  onReleaseLimitReached: (limit: number) => void
  handleOpenDialog: (source?: UpsellDialogViewedInfo['source']) => void
  telemetryLogs: {
    dialogSecondaryClicked: () => void
    dialogPrimaryClicked: () => void
    panelViewed: (source: UpsellDialogViewedInfo['source']) => void
    panelDismissed: () => void
    panelPrimaryClicked: () => void
    panelSecondaryClicked: () => void
  }
}
