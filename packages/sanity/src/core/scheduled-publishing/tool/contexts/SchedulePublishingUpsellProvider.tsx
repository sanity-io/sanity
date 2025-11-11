import {useContext} from 'react'
import {
  SchedulePublishUpsellContext,
  type SchedulePublishUpsellContextValue,
} from 'sanity/_singletons'

import {useUpsellDialog} from '../../../hooks/useUpsellDialog'

/**
 * @beta
 */
export function SchedulePublishingUpsellProvider(props: {children: React.ReactNode}) {
  const {DialogComponent, contextValue} = useUpsellDialog({
    dataUri: '/journey/scheduled-publishing',
    feature: 'scheduled_publishing',
  })

  return (
    <SchedulePublishUpsellContext.Provider value={contextValue}>
      {props.children}
      <DialogComponent />
    </SchedulePublishUpsellContext.Provider>
  )
}

export function useSchedulePublishingUpsell(): SchedulePublishUpsellContextValue {
  const context = useContext(SchedulePublishUpsellContext)
  return context
}
