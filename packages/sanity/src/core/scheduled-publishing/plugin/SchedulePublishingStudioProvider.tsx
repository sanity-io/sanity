import {useEffect} from 'react'
import {preloadObservablePromise, useObservablePromise} from 'react-rx'
import {
  HasUsedScheduledPublishingPromiseContext,
  ScheduledPublishingFeaturePromiseContext,
} from 'sanity/_singletons'

import {type ProviderProps} from '../../config/studio/types'
import {FEATURES, useFeatureEnabledObservable} from '../../hooks/useFeatureEnabled'
import {useHasUsedScheduledPublishingObservable} from '../../scheduledPublishing/tool/contexts/useHasUsedScheduledPublishing'
import {useWorkspace} from '../../studio/workspace'

export function SchedulePublishingStudioProvider(props: ProviderProps) {
  const {scheduledPublishing} = useWorkspace()
  const featureEnabled$ = useFeatureEnabledObservable(FEATURES.scheduledPublishing)
  const hasUsedScheduledPublishing$ = useHasUsedScheduledPublishingObservable({
    explicitEnabled: scheduledPublishing.__internal__workspaceEnabled,
    isWorkspaceEnabled: scheduledPublishing.enabled,
  })
  const featureEnabled = useObservablePromise(featureEnabled$)
  const hasUsedScheduledPublishing = useObservablePromise(hasUsedScheduledPublishing$)
  useEffect(() => {
    void preloadObservablePromise(featureEnabled$)
    void preloadObservablePromise(hasUsedScheduledPublishing$)
  }, [featureEnabled$, hasUsedScheduledPublishing$])

  return (
    <ScheduledPublishingFeaturePromiseContext value={featureEnabled}>
      <HasUsedScheduledPublishingPromiseContext value={hasUsedScheduledPublishing}>
        {props.renderDefault(props)}
      </HasUsedScheduledPublishingPromiseContext>
    </ScheduledPublishingFeaturePromiseContext>
  )
}
