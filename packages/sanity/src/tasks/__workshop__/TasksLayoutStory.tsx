import {useState} from 'react'
import {AddonDatasetProvider} from 'sanity'

import {type SidebarTabsIds, TasksProvider} from '../src/'
import {TaskSidebarContent} from '../src/tasks/components/sidebar/TasksSidebarContent'
import {TasksSidebarHeader} from '../src/tasks/components/sidebar/TasksSidebarHeader'

function noop() {
  return null
}

export default function TasksLayoutStory() {
  const [activeTabId, setActiveTabId] = useState<SidebarTabsIds>('assigned')
  const [selectedTask, setSelectedTask] = useState<string | null>(null)

  return (
    <AddonDatasetProvider>
      <TasksProvider>
        <TasksSidebarHeader
          viewMode="list"
          setViewMode={noop}
          activeTabId="subscribed"
          items={[]}
          selectedTask={selectedTask}
          setSelectedTask={setSelectedTask}
        />
        <TaskSidebarContent
          items={[]}
          activeTabId={activeTabId}
          setActiveTabId={setActiveTabId}
          onTaskSelect={setSelectedTask}
        />
      </TasksProvider>
    </AddonDatasetProvider>
  )
}
