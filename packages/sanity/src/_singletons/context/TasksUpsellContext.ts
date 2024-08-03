import {createContext} from 'sanity/_createContext'

import type {TasksUpsellContextValue} from '../../core/tasks/context/upsell/types'

/**
 * @beta
 * @hidden
 */
export const TasksUpsellContext = createContext<TasksUpsellContextValue | null>(
  'sanity/_singletons/context/tasks-upsell',
  null,
)
