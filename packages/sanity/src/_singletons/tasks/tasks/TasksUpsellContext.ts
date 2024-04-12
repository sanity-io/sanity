import {createContext} from 'react'

import type {TasksUpsellContextValue} from '../../../tasks/src/tasks/context/upsell/types'

/**
 * @beta
 * @hidden
 */
export const TasksUpsellContext = createContext<TasksUpsellContextValue | null>(null)
