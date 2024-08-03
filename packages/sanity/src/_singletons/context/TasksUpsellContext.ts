import {createContext} from 'react'

import type {TasksUpsellContextValue} from '../../../../core/tasks/context/upsell/types'

/**
 * @beta
 * @hidden
 */
export const TasksUpsellContext = createContext<TasksUpsellContextValue | null>(null)
