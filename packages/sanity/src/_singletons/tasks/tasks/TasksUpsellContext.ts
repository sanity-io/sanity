import {createContext} from 'react'
import {TasksUpsellContextValue} from '../../../core/tasks/context/upsell/types'

/**
 * @beta
 * @hidden
 */
export const TasksUpsellContext = createContext<TasksUpsellContextValue | null>(null)
