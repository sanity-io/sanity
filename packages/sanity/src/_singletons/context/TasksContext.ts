import {createContext} from 'sanity/_createContext'

import type {TasksContextValue} from '../../core/tasks/context/tasks/types'

/**
 * @internal
 */
export const TasksContext = createContext<TasksContextValue | null>(
  'sanity/_singletons/context/tasks',
  null,
)
