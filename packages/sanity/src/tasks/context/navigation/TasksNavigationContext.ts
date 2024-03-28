import {createContext} from 'react'

import {type TasksNavigationContextValue} from './types'

/**
 * @internal
 */
export const TasksNavigationContext = createContext<TasksNavigationContextValue | null>(null)
