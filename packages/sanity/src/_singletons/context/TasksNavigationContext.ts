import type {TasksNavigationContextValue} from '../../core/tasks/context/navigation/types'
import {createContext} from 'sanity/_createContext'

/**
 * @internal
 */
export const TasksNavigationContext = createContext<TasksNavigationContextValue | null>(
  'sanity/_singletons/context/tasks-navigation',
  null,
)
