import {Suspense, useContext} from 'react'
import {
  SchedulePublishUpsellContext,
  type SchedulePublishUpsellContextValue,
} from 'sanity/_singletons'

import {useUpsellContext} from '../../../hooks/useUpsellContext'
import {UpsellContextDialog} from '../../../studio/upsell/UpsellContextDialog'

/**
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
        <UpsellContextDialog contextValue={contextValue} />
      </Suspense>
    </SchedulePublishUpsellContext.Provider>
  )
}

export function useSchedulePublishingUpsell(): SchedulePublishUpsellContextValue {
  const context = useContext(SchedulePublishUpsellContext)
  return context
}
