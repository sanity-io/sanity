import {useMemo} from 'react'
import {TasksNavigationContext} from 'sanity/_singletons'

import {AddonDatasetProvider} from '../../studio/addonDataset/AddonDatasetProvider'
import {TasksFormBuilder} from '../components/form/tasksFormBuilder/TasksFormBuilder'
import {TasksProvider} from '../context/tasks/TasksProvider'

export default function TasksCreateStory() {
  const value = useMemo(
    () =>
      ({
        state: {
          viewMode: 'create',
          activeTabId: 'assigned',
          selectedTask: '123',
          duplicateTaskValues: null,
          isOpen: true,
        },
        setViewMode: () => null,
        setActiveTab: () => null,
        handleCloseTasks: () => null,
        handleOpenTasks: () => null,
        handleCopyLinkToTask: () => null,
      }) as const,
    [],
  )
  return (
    <AddonDatasetProvider>
      <TasksProvider>
        <TasksNavigationContext.Provider value={value}>
          <TasksFormBuilder />
        </TasksNavigationContext.Provider>
      </TasksProvider>
    </AddonDatasetProvider>
  )
}
