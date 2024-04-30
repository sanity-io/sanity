import {useContext} from 'react'
import {TasksContext} from 'sanity/_singletons'

import {type TasksContextValue} from './types'

/**
 * @internal
 */
export function useTasks(): TasksContextValue {
  const context = useContext(TasksContext)
  if (!context) {
    // Providers are not mounted when tasks enabled is disabled, but we still need to provide a
    // default value for the context to avoid runtime errors in `TasksFooterAction` and `TaskCreateAction`
    return {
      activeDocument: null,
      setActiveDocument: () => null,
      data: [],
      isLoading: false,
    }
  }

  return context
}
