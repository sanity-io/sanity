import {createContext} from 'react'

import {type TasksUpsellContextValue} from './types'

/**
 * @beta
 * @hidden
 */
export const TasksUpsellContext = createContext<TasksUpsellContextValue | null>(null)
