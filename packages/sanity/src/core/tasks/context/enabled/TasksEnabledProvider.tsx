import {useMemo} from 'react'
import {TasksEnabledContext} from 'sanity/_singletons'

import {useFeatureEnabled} from '../../../hooks/useFeatureEnabled'
import {useWorkspace} from '../../../studio/workspace'
import {type TasksEnabledContextValue} from './types'

interface TaksEnabledProviderProps {
  children: React.ReactNode
}

/**
 * @internal
 */
export function TasksEnabledProvider({children}: TaksEnabledProviderProps) {
  const {enabled, isLoading, error} = useFeatureEnabled('sanityTasks')

  const isWorkspaceEnabled = useWorkspace().tasks?.enabled

  const value: TasksEnabledContextValue = useMemo(() => {
    if (!isWorkspaceEnabled || isLoading || error) {
      return {
        enabled: false,
        mode: null,
      }
    }
    return {
      enabled: true,
      mode: enabled ? 'default' : 'upsell',
    }
  }, [enabled, isLoading, isWorkspaceEnabled, error])

  return <TasksEnabledContext.Provider value={value}>{children}</TasksEnabledContext.Provider>
}
