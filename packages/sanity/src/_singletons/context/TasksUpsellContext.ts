import type {TasksUpsellContextValue} from '../../core/tasks/context/upsell/types'
import {createContext} from 'sanity/_createContext'

/**
 * @beta
 * @hidden
 */
export const TasksUpsellContext = createContext<TasksUpsellContextValue | null>(
  'sanity/_singletons/context/tasks-upsell',
  null,
)
