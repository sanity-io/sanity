import {type TasksEnabledContextValue} from './types'
import {useContext} from 'react'
import {TasksEnabledContext} from 'sanity/_singletons'

/**
 * @internal
 */
export function useTasksEnabled(): TasksEnabledContextValue {
  return useContext(TasksEnabledContext)
}
