import {type ReactNode, useState} from 'react'

import {TasksNavigationContext} from './TasksNavigationContext'
import {type SidebarTabsIds, type ViewMode} from './types'

// TODO: Use the router.
export const TasksNavigationProvider = ({children}: {children: ReactNode}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedTask, setSelectedTask] = useState<null | string>(null)
  const [activeTabId, setActiveTabId] = useState<SidebarTabsIds>('assigned')

  return (
    <TasksNavigationContext.Provider
      value={{
        viewMode,
        setViewMode,
        selectedTask,
        setSelectedTask,
        activeTabId,
        setActiveTabId,
      }}
    >
      {children}
    </TasksNavigationContext.Provider>
  )
}
