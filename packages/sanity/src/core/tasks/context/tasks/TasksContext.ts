import {createContext} from 'react'

import {type TasksContextValue} from './types'

/**
 * @internal
 */
export const TasksContext = createContext<TasksContextValue | null>(null)
