import {useContext, useMemo} from 'react'
import {ScheduledPublishingEnabledContext} from 'sanity/_singletons'

import {useFeatureEnabled} from '../../../hooks'
import {useWorkspace} from '../../../studio'

/**
 * @internal
 */
export type ScheduledPublishingEnabledContextValue =
  | {
      enabled: false
      mode: null
    }
  | {
      enabled: true
      mode: 'default' | 'upsell'
    }

interface TaksEnabledProviderProps {
  children: React.ReactNode
}

/**
 * @internal
 */

export function ScheduledPublishingEnabledProvider({children}: TaksEnabledProviderProps) {
  const {enabled, isLoading} = useFeatureEnabled('scheduledPublishing')
  const {scheduledPublishing} = useWorkspace()

  const isWorkspaceEnabled = scheduledPublishing.enabled

  const value: ScheduledPublishingEnabledContextValue = useMemo(() => {
    if (!isWorkspaceEnabled || isLoading) {
      return {
        enabled: false,
        mode: null,
      }
    }
    return {
      enabled: true,
      mode: enabled ? 'default' : 'upsell',
    }
  }, [enabled, isLoading, isWorkspaceEnabled])

  return (
    <ScheduledPublishingEnabledContext.Provider value={value}>
      {children}
    </ScheduledPublishingEnabledContext.Provider>
  )
}

/**
 * @internal
 */
export function useScheduledPublishingEnabled(): ScheduledPublishingEnabledContextValue {
  const context = useContext(ScheduledPublishingEnabledContext)
  if (!context) {
    throw new Error(
      'useScheduledPublishingEnabled must be used within a ScheduledPublishingEnabledProvider',
    )
  }
  return context
}
