import {createContext} from 'sanity/_createContext'

import type {UpsellDialogViewedInfo} from '../../core/studio/upsell'
import type {UpsellData} from '../../core/studio/upsell/types'

/**
 * @internal
 */
export interface DocumentLimitUpsellContextValue {
  upsellDialogOpen: boolean
  handleOpenDialog: (source: UpsellDialogViewedInfo['source']) => void
  upsellData: UpsellData | null
  telemetryLogs: {
    dialogSecondaryClicked: () => void
    dialogPrimaryClicked: () => void
  }
}

/**
 * @internal
 */
export const DocumentLimitUpsellContext = createContext<DocumentLimitUpsellContextValue>(
  'sanity/_singletons/context/document-limit-upsell',
  {
    upsellData: null,
    handleOpenDialog: () => null,
    upsellDialogOpen: false,
    telemetryLogs: {
      dialogPrimaryClicked: () => null,
      dialogSecondaryClicked: () => null,
    },
  },
)
