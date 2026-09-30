import {useMemo} from 'react'
import {ScheduledPublishingPromisesContext} from 'sanity/_singletons'

import {type ProvidersProps} from '../../config/studio/types'
import {FEATURES, useFeatureEnabledPromise} from '../../hooks/useFeatureEnabled'
import {useHasUsedScheduledPublishingPromise} from '../../scheduledPublishing/tool/contexts/useHasUsedScheduledPublishing'
import {useWorkspace} from '../../studio/workspace'

/**
 * Starts the two checks scheduled publishing availability depends on as soon as the studio's
 * providers commit, above the loading screen boundary, and hands the promises to
 * `ScheduledPublishingEnabledProvider` in the layout below. That provider `use()`s them and
 * suspends up to that screen, so the layout and the navbar's tool list render once, settled.
 */
export function SchedulePublishingStudioProviders(props: ProvidersProps) {
  const {scheduledPublishing} = useWorkspace()
  const featureEnabled = useFeatureEnabledPromise(FEATURES.scheduledPublishing)
  const hasUsedScheduledPublishing = useHasUsedScheduledPublishingPromise({
    explicitEnabled: scheduledPublishing.__internal__workspaceEnabled,
    isWorkspaceEnabled: scheduledPublishing.enabled,
  })
  const value = useMemo(
    () => ({featureEnabled, hasUsedScheduledPublishing}),
    [featureEnabled, hasUsedScheduledPublishing],
  )

  return (
    <ScheduledPublishingPromisesContext.Provider value={value}>
      {props.renderDefault(props)}
    </ScheduledPublishingPromisesContext.Provider>
  )
}
