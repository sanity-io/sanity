import {createContext} from 'sanity/_createContext'

import type {UpsellDialogViewedInfo} from '../../core/studio/upsell'
import type {UpsellData} from '../../core/studio/upsell/types'

/**
 * @internal
 */
export interface SingleDocReleaseUpsellContextValue {
  upsellDialogOpen: boolean
  handleOpenDialog: (source: UpsellDialogViewedInfo['source']) => void
  handleClose: () => void
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

/**
 * @internal
 */
export const SingleDocReleaseUpsellContext = createContext<SingleDocReleaseUpsellContextValue>(
  'sanity/_singletons/context/single-doc-release-upsell',
  {
    upsellData: null,
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
