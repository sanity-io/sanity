import {createContext} from 'react'

import type {SchedulePublishUpsellContextValue} from '../../../../core/scheduledPublishing/tool/contexts/SchedulePublishingUpsellProvider'

/**
 * @internal
 */
export const SchedulePublishUpsellContext = createContext<SchedulePublishUpsellContextValue>({
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
})
