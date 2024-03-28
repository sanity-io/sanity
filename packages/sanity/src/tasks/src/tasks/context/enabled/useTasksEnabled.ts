import {useContext} from 'react'

import {TasksEnabledContext} from './TasksEnabledContext'
import {type TasksEnabledContextValue} from './types'

/**
 * @internal
 */
export function useTasksEnabled(): TasksEnabledContextValue {
  return useContext(TasksEnabledContext)
}
