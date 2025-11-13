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

  const children = props.renderDefault(props)
  if (mode === 'upsell') {
    return <SchedulePublishingUpsellProvider>{children}</SchedulePublishingUpsellProvider>
  }
  return children
}

export function SchedulePublishingStudioLayout(props: LayoutProps) {
  return (
    <ScheduledPublishingEnabledProvider>
      <SchedulePublishingStudioLayoutInner {...props} />
    </ScheduledPublishingEnabledProvider>
  )
}
