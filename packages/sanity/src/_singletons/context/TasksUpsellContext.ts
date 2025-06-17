import {createContext} from 'sanity/_createContext'

import type {TasksUpsellContextValue} from '../../core/tasks/context/upsell/types'

/**
 * @beta
 * @hidden
 */
export const TasksUpsellContext: React.Context<TasksUpsellContextValue | null> =
  createContext<TasksUpsellContextValue | null>('sanity/_singletons/context/tasks-upsell', null)
