import {Suspense, use, useContext} from 'react'
import {
  ScheduledPublishingModePromiseContext,
  SchedulePublishUpsellContext,
  type SchedulePublishUpsellContextValue,
} from 'sanity/_singletons'

import {type UpsellContextValue, useUpsellContext} from '../../../hooks/useUpsellContext'
import {UpsellContextDialog} from '../../../studio/upsell/UpsellContextDialog'

/**
 * Mounted in both plan modes by the plugin's studio provider, so the studio never waits for the
 * feature check. The UI that opens the dialog already knows it is in upsell mode; the dialog leaf
 * below checks once more, at the leaf, so a plan that has the feature never shows it.
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
  const modePromise = use(ScheduledPublishingModePromiseContext)
  const mode = modePromise ? use(modePromise) : null
  // Only the upsell mode has a dialog to show; a plan with the feature, or a failed check, never does
  if (mode !== 'upsell') return null
  return <UpsellContextDialog contextValue={contextValue} />
}

export function useSchedulePublishingUpsell(): SchedulePublishUpsellContextValue {
  const context = useContext(SchedulePublishUpsellContext)
  return context
}
