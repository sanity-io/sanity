import {createContext} from 'react'
import {TasksEnabledContextValue} from './types'

/**
 * @internal
 */
export const TasksEnabledContext = createContext<TasksEnabledContextValue | null>(null)
