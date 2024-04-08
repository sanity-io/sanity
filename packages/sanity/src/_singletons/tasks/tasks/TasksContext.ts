import {createContext} from 'react'

import type {TasksContextValue} from '../../../tasks/src/tasks/context/tasks/types'

/**
 * @internal
 */
export const TasksContext = createContext<TasksContextValue | null>(null)
