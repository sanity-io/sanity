import {type UpsellDialogViewedInfo} from '../../../studio'

export interface ReleasesUpsellContextValue {
  /**
   * Is upsell mode when the user has reached the release limit and there is upsell data available
   * Is disabled mode when the user has reached the release limit and there is no upsell data available due to some error in the journey api
   * Is default mode when the user has not reached the release limits
   */
  mode: 'upsell' | 'default' | 'disabled'
  upsellDialogOpen: boolean
  guardWithReleaseLimitUpsell: (callback: () => void, throwError?: boolean) => Promise<false | void>
  onReleaseLimitReached: (limit: number) => void
  telemetryLogs: {
    dialogSecondaryClicked: () => void
    dialogPrimaryClicked: () => void
    panelViewed: (source: UpsellDialogViewedInfo['source']) => void
    panelDismissed: () => void
    panelPrimaryClicked: () => void
    panelSecondaryClicked: () => void
  }
}
