import {createContext} from 'react'

import {type TasksSetupContextValue} from './types'

/**
 * @beta
 * @hidden
 */
export const TasksSetupContext = createContext<TasksSetupContextValue | null>(null)
