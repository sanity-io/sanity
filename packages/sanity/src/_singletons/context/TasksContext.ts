import {createContext} from 'sanity/_createContext'

import type {TasksContextValue} from '../../core/tasks/context/tasks/types'

/**
 * @internal
 */
export const TasksContext: React.Context<TasksContextValue | null> =
  createContext<TasksContextValue | null>('sanity/_singletons/context/tasks', null)
