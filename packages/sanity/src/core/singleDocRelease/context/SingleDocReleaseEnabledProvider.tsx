import {useContext, useMemo} from 'react'
import {
  SingleDocReleaseEnabledContext,
  type SingleDocReleaseEnabledContextValue,
} from 'sanity/_singletons'

import {useFeatureEnabled} from '../../hooks'
import {FEATURES} from '../../hooks/useFeatureEnabled'
import {useScheduledDraftsEnabled} from '../hooks/useScheduledDraftsEnabled'

interface SingleDocReleaseEnabledProviderProps {
  children: React.ReactNode
}

/**
 * @internal
 */

export function SingleDocReleaseEnabledProvider({children}: SingleDocReleaseEnabledProviderProps) {
  const {enabled: featureEnabled, isLoading, error} = useFeatureEnabled(FEATURES.singleDocRelease)
  const isWorkspaceEnabled = useScheduledDraftsEnabled()

  const value: SingleDocReleaseEnabledContextValue = useMemo(() => {
    if (!isWorkspaceEnabled || isLoading || error) {
      return {
        enabled: false,
        mode: null,
      }
    }

    return {
      enabled: true,
      mode: featureEnabled ? 'default' : 'upsell',
    }
  }, [featureEnabled, isLoading, isWorkspaceEnabled, error])

  return (
    <SingleDocReleaseEnabledContext.Provider value={value}>
      {children}
    </SingleDocReleaseEnabledContext.Provider>
  )
}

/**
 * Hook to check if single doc release is enabled for the current workspace
 * @internal
 */
export function useSingleDocReleaseEnabled(): SingleDocReleaseEnabledContextValue {
  const context = useContext(SingleDocReleaseEnabledContext)
  return context
}
