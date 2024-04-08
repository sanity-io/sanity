import {AddonDatasetProvider} from 'sanity'
import {TasksNavigationContext} from 'sanity/_singletons'

import {TasksFormBuilder, TasksProvider} from '../src'

export default function TasksCreateStory() {
  return (
    <AddonDatasetProvider>
      <TasksProvider>
        <TasksNavigationContext.Provider
          value={{
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
          }}
        >
          <TasksFormBuilder />
        </TasksNavigationContext.Provider>
      </TasksProvider>
    </AddonDatasetProvider>
  )
}
