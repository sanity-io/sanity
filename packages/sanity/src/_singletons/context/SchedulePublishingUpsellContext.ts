import {createContext} from 'sanity/_createContext'

import type {SchedulePublishUpsellContextValue} from '../../core/scheduledPublishing/tool/contexts/SchedulePublishingUpsellProvider'

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
