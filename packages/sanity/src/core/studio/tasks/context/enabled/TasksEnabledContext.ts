import {createContext} from 'react'
import {TasksEnabledContextValue} from './types'

export const TasksEnabledContext = createContext<TasksEnabledContextValue | null>(null)
