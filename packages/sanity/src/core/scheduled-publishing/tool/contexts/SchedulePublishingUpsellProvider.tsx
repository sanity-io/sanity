import {Suspense, use, useContext} from 'react'
import {
  SchedulePublishUpsellContext,
  type SchedulePublishUpsellContextValue,
} from 'sanity/_singletons'

import {type UpsellContextValue, useUpsellContext} from '../../../hooks/useUpsellContext'
import {SETTLED_WITHOUT_UPSELL_DATA} from '../../../hooks/useUpsellData'
import {useScheduledPublishingMode} from '../../../scheduledPublishing/contexts/useScheduledPublishingMode'
import {UpsellContextDialog} from '../../../studio/upsell/UpsellContextDialog'

/**
 * Mounted in both plan modes by `SchedulePublishingStudioProvider`, so the studio never waits for
 * the feature check or the usage probe. The UI that opens the dialog already knows it is in
 * upsell mode (it read `useScheduledPublishingMode()`); the dialog leaf below checks once more,
 * at the leaf, so a plan that has the feature never shows it.
 *
 * @beta
 */
export function SchedulePublishingUpsellProvider(props: {children: React.ReactNode}) {
  const contextValue = useUpsellContext({
    dataUri: '/journey/scheduled-publishing',
    feature: 'scheduled_publishing',
  })

  return (
    <SchedulePublishUpsellContext.Provider value={contextValue}>
      {props.children}
      <Suspense>
        <SchedulePublishingUpsellDialog contextValue={contextValue} />
      </Suspense>
    </SchedulePublishUpsellContext.Provider>
  )
}

function SchedulePublishingUpsellDialog({contextValue}: {contextValue: UpsellContextValue}) {
  // Only the upsell mode has a dialog to show; a plan with the feature, or a workspace where it
  // is not enabled, never does
  if (use(useScheduledPublishingMode()) !== 'upsell') return null
  return <UpsellContextDialog contextValue={contextValue} />
}

export function useSchedulePublishingUpsell(): SchedulePublishUpsellContextValue {
  // Without the plugin's provider the dialog can't open and there is no data, so consumers get an
  // inert value instead of a missing one.
  return useContext(SchedulePublishUpsellContext) ?? FALLBACK_CONTEXT_VALUE
}

const FALLBACK_CONTEXT_VALUE = {
  upsellDataPromise: SETTLED_WITHOUT_UPSELL_DATA,
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
} satisfies SchedulePublishUpsellContextValue
