import {useState} from 'react'
import {AddonDatasetProvider} from 'sanity'

import {type SidebarTabsIds, TasksNavigationProvider, TasksProvider} from '../src/'
import {TaskSidebarContent} from '../src/tasks/components/sidebar/TasksSidebarContent'
import {TasksSidebarHeader} from '../src/tasks/components/sidebar/TasksSidebarHeader'

function noop(id: string) {
  return null
}
export default function TasksLayoutStory() {
  const [activeTabId, setActiveTabId] = useState<SidebarTabsIds>('assigned')

  return (
    <AddonDatasetProvider>
      <TasksProvider>
        <TasksNavigationProvider>
          <TasksSidebarHeader items={[]} />
          <TaskSidebarContent
            items={[]}
            activeTabId={activeTabId}
            setActiveTabId={setActiveTabId}
            onTaskSelect={noop}
          />
        </TasksNavigationProvider>
      </TasksProvider>
    </AddonDatasetProvider>
  )
}
