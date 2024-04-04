import {useContext} from 'react'

import {TasksUpsellContext} from './TasksUpsellContext'
import {type TasksUpsellContextValue} from './types'

/**
 * @beta
 * @hidden
 */
export function useTasksUpsell(): TasksUpsellContextValue {
  const value = useContext(TasksUpsellContext)

  if (!value) {
    throw new Error('useTasksUpsell must be used within a TasksUpsellProvider')
  }

  return value
}
