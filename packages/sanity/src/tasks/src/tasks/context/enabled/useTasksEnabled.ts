import {useContext} from 'react'

import {TasksEnabledContext} from './TasksEnabledContext'
import {type TasksEnabledContextValue} from './types'

/**
 * @internal
 */
export function useTasksEnabled(): TasksEnabledContextValue {
  const context = useContext(TasksEnabledContext)
  if (!context) {
    throw new Error('useTasks must be used within a TasksEnabledProvider')
  }
  return context
}
