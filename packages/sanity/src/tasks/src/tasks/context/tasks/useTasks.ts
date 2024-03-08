import {useContext} from 'react'

import {TasksContext} from './TasksContext'
import {type TasksContextValue} from './types'

/**
 * @internal
 */
export function useTasks(): TasksContextValue {
  const context = useContext(TasksContext)
  if (!context) {
    throw new Error('useTasks must be used within a TasksProvider')
  }
  return context
}
