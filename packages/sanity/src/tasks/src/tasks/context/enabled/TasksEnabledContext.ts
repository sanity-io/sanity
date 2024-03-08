import {createContext} from 'react'

import {type TasksEnabledContextValue} from './types'

/**
 * @internal
 */
export const TasksEnabledContext = createContext<TasksEnabledContextValue | null>(null)
