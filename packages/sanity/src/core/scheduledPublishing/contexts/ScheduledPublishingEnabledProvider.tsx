import {useContext, useMemo} from 'react'
import {
  ScheduledPublishingEnabledContext,
  type ScheduledPublishingEnabledContextValue,
} from 'sanity/_singletons'

import {useFeatureEnabled} from '../../hooks'
import {FEATURES} from '../../hooks/useFeatureEnabled'
import {useWorkspace} from '../../studio/workspace'
import {useHasUsedScheduledPublishing} from '../tool/contexts/useHasUsedScheduledPublishing'

interface ScheduledPublishingEnabledProviderProps {
  children: React.ReactNode
}

/**
 * @internal
 */

export function ScheduledPublishingEnabledProvider({
  children,
}: ScheduledPublishingEnabledProviderProps) {
  const {enabled, isLoading, error} = useFeatureEnabled(FEATURES.scheduledPublishing)
  const {scheduledPublishing} = useWorkspace()

  const isWorkspaceEnabled = scheduledPublishing.enabled
  const explicitEnabled = scheduledPublishing.__internal__workspaceEnabled
  const hasUsedScheduledPublishing = useHasUsedScheduledPublishing({
    explicitEnabled,
    isWorkspaceEnabled,
  })

  const value: ScheduledPublishingEnabledContextValue = useMemo(() => {
    if (!isWorkspaceEnabled || isLoading || error) {
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
  }, [enabled, isLoading, isWorkspaceEnabled, error, hasUsedScheduledPublishing, explicitEnabled])

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
