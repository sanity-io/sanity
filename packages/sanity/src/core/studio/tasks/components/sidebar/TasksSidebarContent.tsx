import {Box, Card, TabList} from '@sanity/ui'
import {TaskDocument} from '../../types'
import {useMemo, useState} from 'react'
import {useCurrentUser} from '../../../../store'
import {Tab} from '../../../../../ui-components'
import {TaskList} from '../list/TaskList'

export function TaskSidebarContent({items}: {items: TaskDocument[]}) {
  const currentUser = useCurrentUser()
  const tabs = useMemo(() => {
    return [
      {
        id: 'assigned',
        label: 'Assigned',
      },
      {
        id: 'created',
        label: 'Created',
      },
      {
        id: 'document',
        label: 'This document',
      },
    ]
  }, [])
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
        return item.target?.document._ref
      }
      return false
    })
  }, [id, items, currentUser])

  return (
    <Box>
      <Card padding={3} marginBottom={2} borderTop borderBottom>
        <TabList space={2}>
          {tabs.map((tab) => (
            <Tab
              key={`${tab.id}-tab`}
              aria-controls={`${tab.id}-panel`}
              id={`${tab.id}-tab`}
              label={tab.label}
              onClick={() => setId(tab.id)}
              selected={id === tab.id}
            />
          ))}
        </TabList>
      </Card>
      <TaskList items={filteredList} />
    </Box>
  )
}
