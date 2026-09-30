import {Suspense} from 'react'

import {LoadingBlock} from '../../components/loadingBlock/LoadingBlock'
import {type LayoutProps} from '../../config/studio/types'
import {FEATURES, useFeatureEnabledPromise} from '../../hooks/useFeatureEnabled'
import {
  ScheduledPublishingEnabledProvider,
  useScheduledPublishingEnabled,
} from '../../scheduledPublishing/contexts/ScheduledPublishingEnabledProvider'
import {useHasUsedScheduledPublishingPromise} from '../../scheduledPublishing/tool/contexts/useHasUsedScheduledPublishing'
import {useWorkspace} from '../../studio/workspace'
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
  const {scheduledPublishing} = useWorkspace()
  const featureEnabledPromise = useFeatureEnabledPromise(FEATURES.scheduledPublishing)
  const hasUsedScheduledPublishingPromise = useHasUsedScheduledPublishingPromise({
    explicitEnabled: scheduledPublishing.__internal__workspaceEnabled,
    isWorkspaceEnabled: scheduledPublishing.enabled,
  })

  // The provider suspends on both checks so the layout renders once, in its final shape. The
  // boundary sits here, between the hooks and the `use()`, so this component commits and the
  // requests start; its fallback is the same loading screen `StudioLayout` shows for the lazy
  // layout chunk, so the loading state simply lasts until the answers are in.
  return (
    <Suspense fallback={<LoadingBlock />}>
      <ScheduledPublishingEnabledProvider
        featureEnabledPromise={featureEnabledPromise}
        hasUsedScheduledPublishingPromise={hasUsedScheduledPublishingPromise}
      >
        <SchedulePublishingStudioLayoutInner {...props} />
      </ScheduledPublishingEnabledProvider>
    </Suspense>
  )
}
