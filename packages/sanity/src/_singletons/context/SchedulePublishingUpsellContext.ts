import {createContext} from 'sanity/_createContext'

import type {UpsellDialogViewedInfo} from '../../core/studio/upsell/__telemetry__/upsell.telemetry'
import type {UpsellData} from '../../core/studio/upsell/types'

/**
 * @internal
 */
export interface SchedulePublishUpsellContextValue {
  upsellDialogOpen: boolean
  handleOpenDialog: (source: UpsellDialogViewedInfo['source']) => void
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
export const SchedulePublishUpsellContext = createContext<SchedulePublishUpsellContextValue>(
  'sanity/_singletons/context/schedule-publish-upsell',
  {
    upsellData: null,
    handleOpenDialog: () => null,
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
