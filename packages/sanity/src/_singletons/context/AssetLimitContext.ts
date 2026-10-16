import {createContext} from 'react'
import type {ObservablePromise} from 'react-rx'

import type {UpsellDialogViewedInfo} from '../../core/studio/upsell/__telemetry__/upsell.telemetry'
import type {UpsellDataResult} from '../../core/studio/upsell/types'

/**
 * @internal
 */
export interface AssetLimitUpsellContextValue {
  upsellDialogOpen: boolean
  handleOpenDialog: (source: UpsellDialogViewedInfo['source']) => void
  upsellDataPromise: ObservablePromise<UpsellDataResult>
  telemetryLogs: {
    dialogSecondaryClicked: () => void
    dialogPrimaryClicked: () => void
  }
}

/**
 * @internal
 */
export const AssetLimitUpsellContext = createContext<AssetLimitUpsellContextValue | null>(null)
