import {type ObservablePromise} from 'react-rx'

import {type UpsellDialogViewedInfo} from '../../../studio/upsell/__telemetry__/upsell.telemetry'
import {type UpsellDataResult} from '../../../studio/upsell/types'

export interface ReleasesUpsellContextValue {
  /**
   * Is upsell mode when the user has reached the release limit
   * Is default mode when the user has not reached the release limits
   */
  mode: 'upsell' | 'default'
  upsellDialogOpen: boolean
  /**
   * The upsell content, settled once its request has answered, or `null` outside the provider.
   * Read it with `use()` in the leaf that renders the content, under a `Suspense` boundary.
   */
  upsellDataPromise: ObservablePromise<UpsellDataResult> | null
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
