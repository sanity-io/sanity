import {use, useMemo} from 'react'
import {TasksEnabledContext} from 'sanity/_singletons'

import {useWorkspace} from '../../../studio/workspace'
import {type TasksEnabledContextValue} from './types'
import {useTasksFeaturesPromise} from './useTasksFeaturesPromise'

interface TaksEnabledProviderProps {
  children: React.ReactNode
}

/**
 * @internal
 */
export function TasksEnabledProvider({children}: TaksEnabledProviderProps) {
  const tasksFeaturesPromise = useTasksFeaturesPromise()
  const {enabled, error} = use(tasksFeaturesPromise)

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
