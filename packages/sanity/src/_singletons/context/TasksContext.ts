import type {TasksContextValue} from '../../core/tasks/context/tasks/types'
import {createContext} from 'sanity/_createContext'

/**
 * @internal
 */
export const TasksContext = createContext<TasksContextValue | null>(
  'sanity/_singletons/context/tasks',
  null,
)
