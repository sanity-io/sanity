import {useMemo} from 'react'
import {useFeatureEnabled} from '../../../../hooks'
import {useWorkspace} from '../../../workspace'
import {TasksEnabledContext} from './TasksEnabledContext'
import {TasksEnabledContextValue} from './types'

interface TaksEnabledProviderProps {
  children: React.ReactNode
}

/**
 * @internal
 */
export function TasksEnabledProvider({children}: TaksEnabledProviderProps) {
  // TODO: Restore this once the feature flag is enabled by the ENTX team, see ENTX-1330.
  const {enabled: featureEnabled, isLoading} = useFeatureEnabled('studioTasks')
  const workspace = useWorkspace()
  const enabled = !!workspace.tasks?.enabled

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
