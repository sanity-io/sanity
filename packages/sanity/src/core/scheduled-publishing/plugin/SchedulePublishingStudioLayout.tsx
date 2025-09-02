import {ConditionalWrapper} from '../../../ui-components/conditionalWrapper/ConditionalWrapper'
import {type LayoutProps} from '../../config/studio/types'
import {
  ScheduledPublishingEnabledProvider,
  useScheduledPublishingEnabled,
} from '../../scheduledPublishing/contexts/ScheduledPublishingEnabledProvider'
import {SchedulePublishingUpsellProvider} from '../tool/contexts/SchedulePublishingUpsellProvider'

function SchedulePublishingStudioLayoutInner(props: LayoutProps) {
  const {enabled, mode} = useScheduledPublishingEnabled()
  if (!enabled) {
    return props.renderDefault(props)
  }

  return (
    <ConditionalWrapper
      condition={mode === 'upsell'}
      wrapper={(children) => (
        <SchedulePublishingUpsellProvider>{children}</SchedulePublishingUpsellProvider>
      )}
    >
      {props.renderDefault(props)}
    </ConditionalWrapper>
  )
}

export function SchedulePublishingStudioLayout(props: LayoutProps) {
  return (
    <ScheduledPublishingEnabledProvider>
      <SchedulePublishingStudioLayoutInner {...props} />
    </ScheduledPublishingEnabledProvider>
  )
}
