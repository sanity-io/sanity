import {Card} from '@sanity/ui'
import {type Dispatch, type SetStateAction} from 'react'

import {type TaskDocument} from '../../types'
import {TasksList} from '../list/TasksList'
import {TasksListTabs} from './TasksListTabs'
import {type SidebarTabsIds} from './types'

/**
 * @internal
 */
export function TaskSidebarContent({
  items,
  onTaskSelect,
  activeTabId,
  setActiveTabId,
}: {
  items: TaskDocument[]
  onTaskSelect: (id: string) => void
  activeTabId: SidebarTabsIds
  setActiveTabId: Dispatch<SetStateAction<SidebarTabsIds>>
}) {
  return (
    <>
      <Card paddingX={3} paddingY={2} borderBottom>
        <TasksListTabs activeTabId={activeTabId} onChange={setActiveTabId} />
      </Card>
      <TasksList items={items} onTaskSelect={onTaskSelect} />
    </>
  )
}
