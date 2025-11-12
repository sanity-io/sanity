import {createContext} from 'sanity/_createContext'

import type {UpsellDialogViewedInfo} from '../../core/studio/upsell'
import type {UpsellData} from '../../core/studio/upsell/types'

/**
 * @internal
 */
export interface DocumentLimitUpsellContextValue {
  upsellDialogOpen: boolean
  handleOpenDialog: (source: UpsellDialogViewedInfo['source']) => void
  handleClose: () => void
  upsellData: UpsellData | null
  telemetryLogs: {
    dialogSecondaryClicked: () => void
    dialogPrimaryClicked: () => void
    panelPrimaryClicked: () => void
    panelSecondaryClicked: () => void
  }
}

/**
 * @internal
 */
export const DocumentLimitUpsellContext = createContext<DocumentLimitUpsellContextValue | null>(
  'sanity/_singletons/context/document-limit-upsell',
  null,
)
