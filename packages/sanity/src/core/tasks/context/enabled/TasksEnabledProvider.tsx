import {useMemo} from 'react'
import {useFeatureEnabled, useWorkspace} from 'sanity'

import {TasksEnabledContext} from './TasksEnabledContext'
import {type TasksEnabledContextValue} from './types'

interface TaksEnabledProviderProps {
  children: React.ReactNode
}

/**
 * @internal
 */
export function TasksEnabledProvider({children}: TaksEnabledProviderProps) {
  const {enabled, isLoading} = useFeatureEnabled('sanityTasks')

  // Staging flag - keeping here until the new flag is added to staging.
  const {enabled: stagingIsEnabled, isLoading: stagingIsLoading} = useFeatureEnabled('studioTasks')

  const isWorkspaceEnabled = useWorkspace().tasks?.enabled

  const value: TasksEnabledContextValue = useMemo(() => {
    if (!isWorkspaceEnabled || isLoading || stagingIsLoading) {
      return {
        enabled: false,
        mode: null,
      }
    }
    // The staging check will be removed when the sanityTasks flag is added to staging.
    if (stagingIsEnabled || enabled) {
      return {
        enabled: true,
        mode: 'default',
      }
    }

    return {
      enabled: false,
      mode: null,
    }
  }, [enabled, isLoading, isWorkspaceEnabled, stagingIsEnabled, stagingIsLoading])

  return <TasksEnabledContext.Provider value={value}>{children}</TasksEnabledContext.Provider>
}
