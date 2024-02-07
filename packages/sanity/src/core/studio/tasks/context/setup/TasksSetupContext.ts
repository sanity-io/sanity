import {createContext} from 'react'
import {TasksSetupContextValue} from './types'

/**
 * @beta
 * @hidden
 */
export const TasksSetupContext = createContext<TasksSetupContextValue | null>(null)
