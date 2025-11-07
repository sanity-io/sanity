import {createContext} from 'sanity/_createContext'

import type {UpsellDialogViewedInfo} from '../../core/studio/upsell'
import type {UpsellData} from '../../core/studio/upsell/types'

/**
 * @internal
 */
export interface AssetLimitUpsellContextValue {
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
export const AssetLimitUpsellContext = createContext<AssetLimitUpsellContextValue | null>(
  'sanity/_singletons/context/asset-limit-upsell',
  null,
)
