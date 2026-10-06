import {useContext, useMemo} from 'react'
import {
  SingleDocReleaseEnabledContext,
  type SingleDocReleaseEnabledContextValue,
} from 'sanity/_singletons'

import {useFeatureEnabled, FEATURES} from '../../hooks/useFeatureEnabled'
import {useScheduledDraftsEnabled} from '../hooks/useScheduledDraftsEnabled'

interface SingleDocReleaseEnabledProviderProps {
  children: React.ReactNode
}

/**
 * @internal
 */

export function SingleDocReleaseEnabledProvider({children}: SingleDocReleaseEnabledProviderProps) {
  const {enabled: featureEnabled, isLoading, error} = useFeatureEnabled(FEATURES.singleDocRelease)
  // `scheduledDrafts` is a per-source option while the default plugins are added to every source
  // from the root workspace's options, so a nested source that opted out still loads this plugin
  // and the source's own resolved flag has to be checked here
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
