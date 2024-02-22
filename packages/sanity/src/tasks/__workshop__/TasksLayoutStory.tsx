import {useState} from 'react'

import {TasksProvider, TasksSetupProvider} from '../src/'
import {TaskSidebarContent} from '../src/tasks/components/sidebar/TasksSidebarContent'
import {TasksSidebarHeader} from '../src/tasks/components/sidebar/TasksSidebarHeader'
import {type SidebarTabsIds} from '../src/tasks/components/sidebar/types'

function noop() {
  return null
}

export default function TasksLayoutStory() {
  const [activeTabId, setActiveTabId] = useState<SidebarTabsIds>('assigned')

  return (
    <TasksSetupProvider>
      <TasksProvider>
        <TasksSidebarHeader viewMode="list" setViewMode={noop} />
        <TaskSidebarContent
          items={[]}
          activeTabId={activeTabId}
          setActiveTabId={setActiveTabId}
          onTaskSelect={noop}
        />
      </TasksProvider>
    </TasksSetupProvider>
  )
}
