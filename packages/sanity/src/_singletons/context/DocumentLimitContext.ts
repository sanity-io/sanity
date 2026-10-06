import type {ObservablePromise} from 'react-rx'
import {createContext} from 'sanity/_createContext'

import type {UpsellDialogViewedInfo} from '../../core/studio/upsell/__telemetry__/upsell.telemetry'
import type {UpsellDataResult} from '../../core/studio/upsell/types'

/**
 * @internal
 */
export interface DocumentLimitUpsellContextValue {
  upsellDialogOpen: boolean
  handleOpenDialog: (source: UpsellDialogViewedInfo['source']) => void
  handleClose: () => void
  upsellDataPromise: ObservablePromise<UpsellDataResult>
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
