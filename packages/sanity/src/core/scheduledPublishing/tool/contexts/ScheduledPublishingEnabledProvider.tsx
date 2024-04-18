import {createContext, useContext, useMemo} from 'react'
import {useFeatureEnabled} from 'sanity'

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

/**
 * @internal
 */
export const ScheduledPublishingEnabledContext =
  createContext<ScheduledPublishingEnabledContextValue | null>(null)

interface TaksEnabledProviderProps {
  children: React.ReactNode
}

/**
 * @internal
 */
export function ScheduledPublishingEnabledProvider({children}: TaksEnabledProviderProps) {
  // TODO: Restore enabled
  const {isLoading} = useFeatureEnabled('sanityTasks')

  // TODO: Use from config
  const isWorkspaceEnabled = true // useWorkspace().scheduledPublishing?.enabled
  const value: ScheduledPublishingEnabledContextValue = useMemo(() => {
    if (!isWorkspaceEnabled || isLoading) {
      return {
        enabled: false,
        mode: null,
      }
    }
    return {
      enabled: true,
      mode: 'upsell',
      // mode: enabled ? 'default' : 'upsell',
    }
  }, [isLoading, isWorkspaceEnabled])

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
