import {useContext} from 'react'
import {TasksContext, TasksContextValue} from '../context/tasks'

export function useTasks(): TasksContextValue {
  const value = useContext(TasksContext)

  if (!value) {
    throw new Error('Tasks context is not available')
  }

  return value
}
