import {ChevronDownIcon} from '@sanity/icons'
import {Box, Flex, Stack, Text} from '@sanity/ui'
import {useCallback, useMemo} from 'react'
import styled from 'styled-components'

import {type TaskDocument} from '../../types'
import {TasksListItem} from './TasksListItem'

interface TasksListProps {
  onTaskSelect: (id: string) => void
  items: TaskDocument[]
}

const checkboxValues = [
  {name: 'open', label: 'To Do'},
  {name: 'closed', label: 'Done'},
]

const getLabelForStatus = (status: string) => {
  const statusConfig = checkboxValues.find((item) => item.name === status)
  return statusConfig?.label
}

const TasksListRoot = styled(Box)`
  max-height: calc(100% - 140px);
  overflow-y: auto;
  // Hide scrollbar
  scrollbar-width: none;
`

const Details = styled.details`
  [data-ui='summary-icon'] {
    transition: transform 0.2s;
    transform: rotate(-90deg);
  }
  &[open] [data-ui='summary-icon'] {
    transform: rotate(0);
  }
`
const Summary = styled.summary`
  list-style: none;
  ::-webkit-details-marker {
    display: none;
  }
`

/**
 * @internal
 */
export function TasksList(props: TasksListProps) {
  const {items, onTaskSelect} = props

  // Filter tasks by status to render them in separate lists
  const tasksByStatus = useMemo(
    () =>
      items.reduce((acc: Record<string, TaskDocument[]>, task) => {
        if (!acc[task.status]) {
          acc[task.status] = []
        }
        acc[task.status].push(task)
        return acc
      }, {}),
    [items],
  )

  const renderTasksList = useCallback(
    (status: string) => {
      const tasks = tasksByStatus[status] || []
      if (tasks.length === 0) {
        return null
      }
      return (
        <Details open={status === 'open'}>
          <Summary>
            <Flex align="center" gap={1} paddingY={1}>
              <Text size={1} weight="medium" muted>
                {getLabelForStatus(status)}
              </Text>
              <Text muted size={1}>
                <ChevronDownIcon data-ui="summary-icon" />
              </Text>
            </Flex>
          </Summary>
          <Stack space={3} marginTop={3} paddingBottom={5}>
            {tasks.map((task) => (
              <TasksListItem
                key={task._id}
                documentId={task._id}
                title={task.title}
                dueBy={task.dueBy}
                assignedTo={task.assignedTo}
                target={task.target}
                onSelect={() => onTaskSelect(task._id)}
                status={task.status}
              />
            ))}
          </Stack>
        </Details>
      )
    },
    [onTaskSelect, tasksByStatus],
  )

  const hasOpenTasks = tasksByStatus.open?.length > 0
  const hasClosedTasks = tasksByStatus.closed?.length > 0
  return (
    <TasksListRoot paddingX={3} paddingY={4}>
      <Stack space={4} paddingTop={2} paddingX={1}>
        {!hasOpenTasks && !hasClosedTasks ? (
          <Box paddingX={2}>
            <Text as="p" size={1} muted>
              No tasks
            </Text>
          </Box>
        ) : (
          <>
            {renderTasksList('open')}
            {renderTasksList('closed')}
          </>
        )}
      </Stack>
    </TasksListRoot>
  )
}
