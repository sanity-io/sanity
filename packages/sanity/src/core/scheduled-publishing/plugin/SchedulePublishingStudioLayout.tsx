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
  // `ScheduledPublishingEnabledProvider` suspends on the checks `SchedulePublishingStudioProviders`
  // started, up to `StudioLayout`'s loading screen, so the layout renders once, in its final shape.
  return (
    <ScheduledPublishingEnabledProvider>
      <SchedulePublishingStudioLayoutInner {...props} />
    </ScheduledPublishingEnabledProvider>
  )
}
