import {Box, Card, TabList} from '@sanity/ui'
import {TaskDocument} from '../../types'
import {useMemo, useState} from 'react'
import {useCurrentUser} from '../../../../store'
import {Tab} from '../../../../../ui-components'
import {TaskList} from '../list/TaskList'
import {TaskListTabs} from './TaskListTabs'

export function TaskSidebarContent({
  items,
  activeDocumentId,
}: {
  items: TaskDocument[]
  activeDocumentId?: string
}) {
  const currentUser = useCurrentUser()
  const [id, setId] = useState('assigned')
  const filteredList = useMemo(() => {
    return items.filter((item) => {
      if (!item.title) {
        return false
      }

      if (id === 'assigned') {
        return item.assignedTo === currentUser?.id
      }
      if (id === 'created') {
        return item.authorId === currentUser?.id
      }
      if (id === 'document') {
        return activeDocumentId && item.target?.document._ref === activeDocumentId
      }
      return false
    })
  }, [activeDocumentId, id, items, currentUser])

  return (
    <Box>
      <Card padding={3} marginBottom={2} borderTop borderBottom>
        <TaskListTabs activeTabId={id} onChange={setId} />
      </Card>
      <TaskList items={filteredList} />
    </Box>
  )
}
