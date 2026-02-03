import {useContext} from 'react'
import {TasksEnabledContext} from 'sanity/_singletons'

import {type TasksEnabledContextValue} from './types'

/**
 * @internal
 */
export function useTasksEnabled(): TasksEnabledContextValue {
  return useContext(TasksEnabledContext)
}
