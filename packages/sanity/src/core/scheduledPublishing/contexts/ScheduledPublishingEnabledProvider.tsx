import {use, useContext, useMemo} from 'react'
import {
  ScheduledPublishingEnabledContext,
  type ScheduledPublishingEnabledContextValue,
  ScheduledPublishingPromisesContext,
} from 'sanity/_singletons'

import {useWorkspace} from '../../studio/workspace'

interface ScheduledPublishingEnabledProviderProps {
  children: React.ReactNode
}

/**
 * Decides whether scheduled publishing is available before anything below it renders. The answer
 * controls whether the Schedules tool shows up in the navbar and whether the layout is wrapped in
 * the upsell provider, so both checks it depends on (the project's feature list and the "has this
 * dataset ever scheduled anything" probe) are read as promises started by
 * `SchedulePublishingStudioProvider` above the studio's loading screen boundary; reading them
 * here suspends up to that screen until they are settled, instead of flipping the layout after
 * the first paint.
 *
 * @internal
 */
export function ScheduledPublishingEnabledProvider({
  children,
}: ScheduledPublishingEnabledProviderProps) {
  const promises = use(ScheduledPublishingPromisesContext)
  const {enabled, error} = use(promises.featureEnabled)
  const hasUsedScheduledPublishing = use(promises.hasUsedScheduledPublishing)
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
