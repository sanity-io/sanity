import {Box, Card, Flex, Spinner, Stack, TabList, Text} from '@sanity/ui'
import styled from 'styled-components'
import {AnimatePresence, motion, Transition, Variants} from 'framer-motion'
import {useTasksEnabled, useTasks} from '../../context'
import {TasksSidebarHeader} from './TasksSidebarHeader'
import {TaskDocument} from '../../types'
import {TasksListItem} from '../list/TasksListItem'
import {useMemo, useState} from 'react'
import {CalendarIcon} from '@sanity/icons'
import {useCurrentUser} from '../../../../store'
import {useDateTimeFormat} from '../../../../hooks'
import {Tab} from '../../../../../ui-components'

const SidebarRoot = styled(Card)`
  width: 360px;
  box-shadow:
    0px 6px 8px -4px rgba(134, 144, 160, 0.2),
    0px -6px 8px -4px rgba(134, 144, 160, 0.2);
`

const VARIANTS: Variants = {
  hidden: {opacity: 0, x: 16},
  visible: {opacity: 1, x: 0},
}

const TRANSITION: Transition = {duration: 0.2}

export function TasksStudioSidebar() {
  const {enabled} = useTasksEnabled()
  const {isOpen, data, isLoading} = useTasks()

  if (!enabled) return null
  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div variants={VARIANTS} transition={TRANSITION} initial="hidden" animate="visible">
          <SidebarRoot borderLeft height="fill" marginLeft={1}>
            <TasksSidebarHeader />
            {isLoading ? <Spinner /> : <TasksList items={data ?? []} />}
          </SidebarRoot>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function TasksList({items}: {items: TaskDocument[]}) {
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
      <List items={filteredList ?? []} />
    </Box>
  )
}

function List({items}: {items: TaskDocument[]}) {
  const dateFormatter = useDateTimeFormat({
    dateStyle: 'medium',
  })
  return (
    <Box padding={3}>
      <Stack space={3}>
        {items
          .filter((item) => Boolean(item.title))
          .map((item) => (
            <TasksListItem key={item._id}>
              <Stack space={2}>
                <Text size={1} weight="bold">
                  {item.title}
                </Text>
                <Flex align="center" gap={1}>
                  <CalendarIcon />
                  <Text size={1} muted>
                    {item.dueBy ? dateFormatter.format(new Date(item.dueBy)) : 'No due date'}
                  </Text>
                </Flex>
              </Stack>
            </TasksListItem>
          ))}
      </Stack>
    </Box>
  )
}
