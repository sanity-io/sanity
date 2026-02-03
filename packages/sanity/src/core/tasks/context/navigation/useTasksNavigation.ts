import {useContext} from 'react'
import {TasksNavigationContext} from 'sanity/_singletons'

import {type TasksNavigationContextValue} from './types'

export function useTasksNavigation(): TasksNavigationContextValue {
  const context = useContext(TasksNavigationContext)

  if (!context) {
    // Providers are not mounted when tasks enabled is disabled, but we still need to provide a
    // default value for the context to avoid runtime errors in `TasksFooterAction` and `TaskCreateAction`
    return FALLBACK_CONTEXT_VALUE
  }

  return context
}

const FALLBACK_CONTEXT_VALUE = {
  state: {
    activeTabId: 'assigned',
    viewMode: 'list',
    selectedTask: null,
    isOpen: false,
    duplicateTaskValues: null,
  },
  setActiveTab: () => null,
  setViewMode: () => null,
  handleCloseTasks: () => null,
  handleCopyLinkToTask: () => null,
  handleOpenTasks: () => null,
} satisfies TasksNavigationContextValue
