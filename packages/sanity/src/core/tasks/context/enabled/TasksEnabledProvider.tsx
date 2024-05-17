import {useMemo} from 'react'
import {TasksEnabledContext} from 'sanity/_singletons'

import {useFeatureEnabled} from '../../../hooks'
import {useWorkspace} from '../../../studio'
import {type TasksEnabledContextValue} from './types'

interface TaksEnabledProviderProps {
  children: React.ReactNode
}

/**
 * @internal
 */
export function TasksEnabledProvider({children}: TaksEnabledProviderProps) {
  const {enabled, isLoading} = useFeatureEnabled('sanityTasks')

  const isWorkspaceEnabled = useWorkspace().tasks?.enabled

  const value: TasksEnabledContextValue = useMemo(() => {
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

  return <TasksEnabledContext.Provider value={value}>{children}</TasksEnabledContext.Provider>
}
