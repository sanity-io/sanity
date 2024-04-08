import {createContext} from 'react'

import {TasksEnabledContextValue} from '../../../core/tasks/context/enabled/types'

/**
 * @internal
 */
export const TasksEnabledContext = createContext<TasksEnabledContextValue | null>(null)
