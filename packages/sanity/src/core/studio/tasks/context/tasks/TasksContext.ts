import {createContext} from 'react'
import {TasksContextValue} from './types'

/**
 * @internal
 */
export const TasksContext = createContext<TasksContextValue | null>(null)
