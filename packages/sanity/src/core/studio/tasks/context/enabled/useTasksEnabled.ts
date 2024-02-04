import {useContext} from 'react'
import {TasksEnabledContext} from './TasksEnabledContext'
import {TasksEnabledContextValue} from './types'

export function useTasksEnabled(): TasksEnabledContextValue {
  const context = useContext(TasksEnabledContext)
  if (!context) {
    throw new Error('useTasks must be used within a TasksEnabledProvider')
  }
  return context
}
