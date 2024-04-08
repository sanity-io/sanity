import {createContext} from 'react'

import type {TasksNavigationContextValue} from '../../../tasks/src/tasks/context/navigation/types'

/**
 * @internal
 */
export const TasksNavigationContext = createContext<TasksNavigationContextValue | null>(null)
