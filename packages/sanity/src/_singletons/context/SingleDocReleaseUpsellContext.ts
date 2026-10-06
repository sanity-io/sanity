import type {ObservablePromise} from 'react-rx'
import {createContext} from 'sanity/_createContext'

import type {UpsellDialogViewedInfo} from '../../core/studio/upsell/__telemetry__/upsell.telemetry'
import type {UpsellDataResult} from '../../core/studio/upsell/types'

/**
 * @internal
 */
export interface SingleDocReleaseUpsellContextValue {
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

/**
 * @internal
 */
export const SingleDocReleaseUpsellContext = createContext<SingleDocReleaseUpsellContextValue>(
  'sanity/_singletons/context/single-doc-release-upsell',
  {
    upsellDataPromise: null,
    handleOpenDialog: () => null,
    handleClose: () => null,
    upsellDialogOpen: false,
    telemetryLogs: {
      dialogSecondaryClicked: () => null,
      dialogPrimaryClicked: () => null,
      panelViewed: () => null,
      panelDismissed: () => null,
      panelPrimaryClicked: () => null,
      panelSecondaryClicked: () => null,
    },
  },
)
