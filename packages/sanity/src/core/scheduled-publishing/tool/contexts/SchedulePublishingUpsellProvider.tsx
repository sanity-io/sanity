import {useContext} from 'react'
import {
  SchedulePublishUpsellContext,
  type SchedulePublishUpsellContextValue,
} from 'sanity/_singletons'

import {getDialogPropsFromContext, useUpsellContext} from '../../../hooks/useUpsellContext'
import {UpsellDialog} from '../../../studio/upsell/UpsellDialog'

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
      <UpsellDialog {...getDialogPropsFromContext(contextValue)} />
    </SchedulePublishUpsellContext.Provider>
  )
}

export function useSchedulePublishingUpsell(): SchedulePublishUpsellContextValue {
  const context = useContext(SchedulePublishUpsellContext)
  return context
}
