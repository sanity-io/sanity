import {useContext} from 'react'

import {TasksContext} from './TasksContext'
import {type TasksContextValue} from './types'

const DEFAULT_VALUE: TasksContextValue = {
  activeDocument: null,
  setActiveDocument: () => null,
  data: [],
  isLoading: false,
}

/**
 * @internal
 */
export function useTasks(): TasksContextValue {
  const context = useContext(TasksContext)
  if (!context) {
    // Providers are not mounted when tasks enabled is disabled, but we still need to provide a
    // default value for the context to avoid runtime errors in `TasksFooterAction` and `TaskCreateAction`
    return DEFAULT_VALUE
  }

  return context
}
