import {use, useContext, useMemo} from 'react'
import {
  ScheduledPublishingEnabledContext,
  type ScheduledPublishingEnabledContextValue,
} from 'sanity/_singletons'

import {useWorkspace} from '../../studio/workspace'
import {NOT_USED} from '../tool/contexts/useHasUsedScheduledPublishing'
import {useHasUsedScheduledPublishingPromise} from './useHasUsedScheduledPublishingPromise'
import {useScheduledPublishingFeaturePromise} from './useScheduledPublishingFeaturePromise'

interface ScheduledPublishingEnabledProviderProps {
  children: React.ReactNode
}

/**
 * @internal
 */
export function ScheduledPublishingEnabledProvider({
  children,
}: ScheduledPublishingEnabledProviderProps) {
  const featurePromise = useScheduledPublishingFeaturePromise()
  const hasUsedScheduledPublishingPromise = useHasUsedScheduledPublishingPromise()
  const {enabled, error} = use(featurePromise)
  // A failed feature check disables the feature on its own; don't wait for the usage probe too
  const hasUsedScheduledPublishing = error ? NOT_USED : use(hasUsedScheduledPublishingPromise)
  // Rendered by the plugin's layout only, and `getDefaultPlugins` includes the plugin only when
  // the workspace has the feature enabled, so `scheduledPublishing.enabled` needs no check here
  const explicitEnabled = useWorkspace().scheduledPublishing.__internal__workspaceEnabled

  const value: ScheduledPublishingEnabledContextValue = useMemo(() => {
    if (error) {
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
  }, [enabled, error, hasUsedScheduledPublishing, explicitEnabled])

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
