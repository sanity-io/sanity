import {useState} from 'react'
import {TasksLayout} from '../src'
import {SidebarTabsIds} from '../src/tasks/components/sidebar/types'

interface Tab {
  id: SidebarTabsIds
  label: string
}

export default function TasksLayoutStory() {
  const [activeTabId, setActiveTabId] = useState<SidebarTabsIds>('assigned')

  const defaultTabs: Tab[] = [
    {
      id: 'assigned',
      label: 'Assigned',
    },
    {
      id: 'created',
      label: 'Created',
    },
  ]

  return <TasksLayout onChange={setActiveTabId} activeTabId={activeTabId} tabs={defaultTabs} />
}
