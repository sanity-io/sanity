import {createContext} from 'react'
import {TasksContextValue} from './types'

export const TasksContext = createContext<TasksContextValue | null>(null)
