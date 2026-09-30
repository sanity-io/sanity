import {use, useMemo} from 'react'
import {type ObservablePromise} from 'react-rx'
import {TasksEnabledContext} from 'sanity/_singletons'

import {type SettledFeatures} from '../../../hooks/useFeatureEnabled'
import {useWorkspace} from '../../../studio/workspace'
import {type TasksEnabledContextValue} from './types'

interface TaksEnabledProviderProps {
  children: React.ReactNode
  /** From `useFeatureEnabledPromise(FEATURES.sanityTasks)` in a parent above the Suspense boundary */
  featureEnabledPromise: ObservablePromise<SettledFeatures>
}

/**
 * Decides whether tasks are available before anything below it renders. `TasksStudioLayout`,
 * `TasksStudioNavbar` and `TasksStudioActiveToolLayout` render a different tree depending on
 * `enabled`, so an answer that arrived after the first paint remounted the whole studio under
 * them; suspending on the feature check settles it while the loading screen is still up.
 *
 * @internal
 */
export function TasksEnabledProvider({children, featureEnabledPromise}: TaksEnabledProviderProps) {
  const {enabled, error} = use(featureEnabledPromise)

  const isWorkspaceEnabled = useWorkspace().tasks?.enabled

  const value: TasksEnabledContextValue = useMemo(() => {
    if (!isWorkspaceEnabled || error) {
      return {
        enabled: false,
        mode: null,
      }
    }
    return {
      enabled: true,
      mode: enabled ? 'default' : 'upsell',
    }
  }, [enabled, isWorkspaceEnabled, error])

  return <TasksEnabledContext.Provider value={value}>{children}</TasksEnabledContext.Provider>
}
