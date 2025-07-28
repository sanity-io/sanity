import {createContext} from 'sanity/_createContext'

import type {TasksNavigationContextValue} from '../../core/tasks/context/navigation/types'

/**
 * @internal
 */
export const TasksNavigationContext: React.Context<TasksNavigationContextValue | null> =
  createContext<TasksNavigationContextValue | null>(
    'sanity/_singletons/context/tasks-navigation',
    null,
  )
