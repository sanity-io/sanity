import {type UpsellDialogViewedInfo} from '../../../studio'

export interface ReleasesUpsellContextValue {
  upsellDialogOpen: boolean
  guardWithReleaseLimitUpsell: (callback: () => void, throwError?: boolean) => false | void
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
