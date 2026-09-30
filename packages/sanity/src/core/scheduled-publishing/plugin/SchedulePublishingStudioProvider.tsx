import {useEffect, useMemo} from 'react'
import {preloadObservablePromise, useObservablePromise} from 'react-rx'
import {ScheduledPublishingPromisesContext} from 'sanity/_singletons'

import {type ProviderProps} from '../../config/studio/types'
import {FEATURES, useFeatureEnabledObservable} from '../../hooks/useFeatureEnabled'
import {useHasUsedScheduledPublishingObservable} from '../../scheduledPublishing/tool/contexts/useHasUsedScheduledPublishing'
import {useWorkspace} from '../../studio/workspace'

/**
 * Starts the two checks scheduled publishing availability depends on as soon as the studio's
 * providers commit, above the loading screen boundary, and hands the promises to
 * `ScheduledPublishingEnabledProvider` in the layout below. That provider `use()`s them and
 * suspends up to that screen, so the layout and the navbar's tool list render once, settled.
 */
export function SchedulePublishingStudioProvider(props: ProviderProps) {
  const {scheduledPublishing} = useWorkspace()
  const featureEnabled$ = useFeatureEnabledObservable(FEATURES.scheduledPublishing)
  const hasUsedScheduledPublishing$ = useHasUsedScheduledPublishingObservable({
    explicitEnabled: scheduledPublishing.__internal__workspaceEnabled,
    isWorkspaceEnabled: scheduledPublishing.enabled,
  })
  const featureEnabled = useObservablePromise(featureEnabled$)
  const hasUsedScheduledPublishing = useObservablePromise(hasUsedScheduledPublishing$)
  // Start both requests on commit, in parallel, so the two `use()` calls below wait for the
  // slower answer rather than for one after the other.
  useEffect(() => {
    void preloadObservablePromise(featureEnabled$)
    void preloadObservablePromise(hasUsedScheduledPublishing$)
  }, [featureEnabled$, hasUsedScheduledPublishing$])
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
