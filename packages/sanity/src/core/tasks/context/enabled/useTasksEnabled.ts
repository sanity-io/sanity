import {use} from 'react'
import {TasksEnabledContext} from 'sanity/_singletons'

/**
 * Whether the workspace has tasks enabled. Synchronous: it does not wait for the feature check,
 * which only decides the mode (`useTasksMode`).
 * @internal
 */
export function useTasksEnabled(): boolean {
  return use(TasksEnabledContext)
}
