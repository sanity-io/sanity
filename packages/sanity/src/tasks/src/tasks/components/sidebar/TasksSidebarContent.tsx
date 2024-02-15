import {Box, Card} from '@sanity/ui'
import {type Dispatch, type SetStateAction, useMemo} from 'react'
import {useCurrentUser} from 'sanity'

import {type TaskDocument} from '../../types'
import {TasksList} from '../list/TasksList'
import {TasksListTabs} from './TasksListTabs'
import {type SidebarTabsIds} from './types'

/**
 * @internal
 */
export function TaskSidebarContent({
  items,
  activeDocumentId,
  onTaskSelect,
  activeTabId,
  setActiveTabId,
}: {
  items: TaskDocument[]
  activeDocumentId?: string
  onTaskSelect: (id: string) => void
  activeTabId: SidebarTabsIds
  setActiveTabId: Dispatch<SetStateAction<SidebarTabsIds>>
}) {
  const currentUser = useCurrentUser()
  const filteredList = useMemo(() => {
    return items.filter((item) => {
      if (!item.title) {
        return false
      }

      if (activeTabId === 'assigned') {
        return item.assignedTo === currentUser?.id
      }
      if (activeTabId === 'created') {
        return item.authorId === currentUser?.id
      }
      if (activeTabId === 'document') {
        return activeDocumentId && item.target?.document._ref === activeDocumentId
      }
      return false
    })
  }, [activeDocumentId, activeTabId, items, currentUser])

  return (
    <Box>
      <Card padding={3} marginBottom={2} borderTop borderBottom>
        <TasksListTabs activeTabId={activeTabId} onChange={setActiveTabId} />
      </Card>
      <TasksList items={filteredList} onTaskSelect={onTaskSelect} />
    </Box>
  )
}
