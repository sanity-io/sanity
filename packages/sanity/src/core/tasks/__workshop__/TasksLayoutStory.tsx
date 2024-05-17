import {useState} from 'react'

import {AddonDatasetProvider} from '../../studio'
import {TaskSidebarContent, TasksSidebarHeader} from '../components'
import {type SidebarTabsIds, TasksNavigationProvider, TasksProvider} from '../context'

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
