import {use, useContext, useMemo} from 'react'
import {type ObservablePromise} from 'react-rx'
import {
  ScheduledPublishingEnabledContext,
  type ScheduledPublishingEnabledContextValue,
} from 'sanity/_singletons'

import {type SettledFeatures} from '../../hooks/useFeatureEnabled'
import {useWorkspace} from '../../studio/workspace'
import {type HasUsedScheduledPublishing} from '../tool/contexts/useHasUsedScheduledPublishing'

interface ScheduledPublishingEnabledProviderProps {
  children: React.ReactNode
  /** From `useFeatureEnabledPromise(FEATURES.scheduledPublishing)` in a parent above the boundary */
  featureEnabledPromise: ObservablePromise<SettledFeatures>
  /** From `useHasUsedScheduledPublishingPromise()` in a parent above the boundary */
  hasUsedScheduledPublishingPromise: ObservablePromise<HasUsedScheduledPublishing>
}

/**
 * Decides whether scheduled publishing is available before anything below it renders. The answer
 * controls whether the Schedules tool shows up in the navbar and whether the layout is wrapped in
 * the upsell provider, so both checks it depends on (the project's feature list and the "has this
 * dataset ever scheduled anything" probe) are awaited here instead of flipping the layout after
 * the first paint.
 *
 * @internal
 */
export function ScheduledPublishingEnabledProvider({
  children,
  featureEnabledPromise,
  hasUsedScheduledPublishingPromise,
}: ScheduledPublishingEnabledProviderProps) {
  const {enabled, error} = use(featureEnabledPromise)
  const hasUsedScheduledPublishing = use(hasUsedScheduledPublishingPromise)
  const {scheduledPublishing} = useWorkspace()

  const isWorkspaceEnabled = scheduledPublishing.enabled
  const explicitEnabled = scheduledPublishing.__internal__workspaceEnabled

  const value: ScheduledPublishingEnabledContextValue = useMemo(() => {
    if (!isWorkspaceEnabled || error) {
      return {
        enabled: false,
        mode: null,
        hasUsedScheduledPublishing,
      }
    }
    if (explicitEnabled) {
      return {
        enabled: true,
        mode: enabled ? 'default' : 'upsell',
        hasUsedScheduledPublishing,
      }
    }
    if (!hasUsedScheduledPublishing.used) {
      return {
        enabled: false,
        mode: null,
        hasUsedScheduledPublishing,
      }
    }
    return {
      enabled: true,
      mode: enabled ? 'default' : 'upsell',
      hasUsedScheduledPublishing,
    }
  }, [enabled, isWorkspaceEnabled, error, hasUsedScheduledPublishing, explicitEnabled])

  return (
    <ScheduledPublishingEnabledContext.Provider value={value}>
      {children}
    </ScheduledPublishingEnabledContext.Provider>
  )
}

/**
 * Hook to check if scheduled publishing is enabled for the current workspace
 * @internal
 */
export function useScheduledPublishingEnabled(): ScheduledPublishingEnabledContextValue {
  const context = useContext(ScheduledPublishingEnabledContext)
  return context
}
