import {useMemo} from 'react'
import {useFeatureEnabled} from 'sanity'

import {TasksEnabledContext} from './TasksEnabledContext'
import {type TasksEnabledContextValue} from './types'

interface TaksEnabledProviderProps {
  children: React.ReactNode
}

/**
 * @internal
 */
export function TasksEnabledProvider({children}: TaksEnabledProviderProps) {
  const {enabled, isLoading} = useFeatureEnabled('studioTasks')

  const value: TasksEnabledContextValue = useMemo(() => {
    if (!enabled || isLoading) {
      return {
        enabled: false,
        mode: null,
      }
    }

    return {
      enabled: true,
      mode: 'default',
    }
  }, [enabled, isLoading])

  return <TasksEnabledContext.Provider value={value}>{children}</TasksEnabledContext.Provider>
}
