import {useContext, useMemo} from 'react'
import {
  SingleDocReleaseEnabledContext,
  type SingleDocReleaseEnabledContextValue,
} from 'sanity/_singletons'

import {useFeatureEnabled, FEATURES} from '../../hooks/useFeatureEnabled'

interface SingleDocReleaseEnabledProviderProps {
  children: React.ReactNode
}

/**
 * @internal
 */

export function SingleDocReleaseEnabledProvider({children}: SingleDocReleaseEnabledProviderProps) {
  // Rendered by the plugin's layout only, and `getDefaultPlugins` includes the plugin only when
  // the workspace has scheduled drafts enabled, so that flag needs no check here
  const {enabled: featureEnabled, isLoading, error} = useFeatureEnabled(FEATURES.singleDocRelease)

  const value: SingleDocReleaseEnabledContextValue = useMemo(() => {
    if (isLoading || error) {
      return {
        enabled: false,
        mode: null,
      }
    }

    return {
      enabled: true,
      mode: featureEnabled ? 'default' : 'upsell',
    }
  }, [featureEnabled, isLoading, error])

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
