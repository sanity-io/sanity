import {useState} from 'react'

import {AddonDatasetProvider} from '../../studio/addonDataset/AddonDatasetProvider'
import {TaskSidebarContent} from '../components/sidebar/TasksSidebarContent'
import {TasksSidebarHeader} from '../components/sidebar/TasksSidebarHeader'
import type {SidebarTabsIds} from '../context/navigation/types'
import {TasksNavigationProvider} from '../context/navigation/TasksNavigationProvider'
import {TasksProvider} from '../context/tasks/TasksProvider'

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
