import {useContext} from 'react'

import {TasksNavigationContext} from './TasksNavigationContext'
import {type TasksNavigationContextValue} from './types'

export function useTasksNavigation(): TasksNavigationContextValue {
  const context = useContext(TasksNavigationContext)

  if (!context) {
    throw new Error('useTasksNavigation must be used within a TasksNavigationProvider')
  }

  return context
}
