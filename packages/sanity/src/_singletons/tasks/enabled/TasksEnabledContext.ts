import {createContext} from 'react'

import type {TasksEnabledContextValue} from '../../../tasks/src/tasks/context/enabled/types'

/**
 * @internal
 */
export const TasksEnabledContext = createContext<TasksEnabledContextValue | null>(null)
