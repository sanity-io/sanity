import {ChevronDownIcon} from '@sanity/icons'
import {Box, Flex, MenuDivider, Stack, Text} from '@sanity/ui'
import {Fragment, useMemo} from 'react'
import styled from 'styled-components'

import {type TaskDocument} from '../../types'
import {TasksListItem} from './TasksListItem'

const EMPTY_ARRAY: [] = []

const CHECKBOX_VALUES = [
  {name: 'open', label: 'To Do'},
  {name: 'closed', label: 'Done'},
]

const getLabelForStatus = (status: string) => {
  const statusConfig = CHECKBOX_VALUES.find((item) => item.name === status)
  return statusConfig?.label
}

const DetailsFlex = styled(Flex)`
  [data-ui='summary-icon'] {
    transition: transform 0.2s;
    transform: rotate(-90deg);
  }
  &[open] [data-ui='summary-icon'] {
    transform: rotate(0);
  }
  > summary::-webkit-details-marker {
    display: none;
  }
`
const SummaryBox = styled(Box)`
  list-style: none;
`

interface TaskListProps {
  status: string
  tasks: TaskDocument[]
  onTaskSelect: (id: string) => void
}

function TaskList(props: TaskListProps) {
  const {status, tasks, onTaskSelect} = props

  return (
    <DetailsFlex forwardedAs="details" direction="column" open={status === 'open'}>
      <SummaryBox forwardedAs="summary">
        <Flex align="center" gap={1} paddingY={1}>
          <Text size={1} weight="medium" muted>
            {getLabelForStatus(status)}
          </Text>

          <Text muted size={1}>
            <ChevronDownIcon data-ui="summary-icon" />
          </Text>
        </Flex>
      </SummaryBox>

      <Stack space={4} marginTop={4} paddingBottom={5}>
        {tasks.map((task, index) => {
          const showDivider = index < tasks.length - 1

          return (
            <Fragment key={task._id}>
              <TasksListItem
                documentId={task._id}
                title={task.title}
                dueBy={task.dueBy}
                assignedTo={task.assignedTo}
                target={task.target}
                // eslint-disable-next-line react/jsx-no-bind
                onSelect={() => onTaskSelect(task._id)}
                status={task.status}
              />

              {showDivider && <MenuDivider />}
            </Fragment>
          )
        })}
      </Stack>
    </DetailsFlex>
  )
}

interface TasksListProps {
  onTaskSelect: (id: string) => void
  items: TaskDocument[]
}

/**
 * @internal
 */
export function TasksList(props: TasksListProps) {
  const {items = EMPTY_ARRAY, onTaskSelect} = props

  const openTasks = useMemo(() => items.filter((task) => task.status === 'open'), [items])
  const closedTasks = useMemo(() => items.filter((task) => task.status === 'closed'), [items])

  const hasOpenTasks = openTasks?.length > 0
  const hasClosedTasks = closedTasks?.length > 0

  return (
    <Stack space={4}>
      {!hasOpenTasks && !hasClosedTasks ? (
        <Text as="p" size={1} muted>
          No tasks
        </Text>
      ) : (
        <>
          {hasOpenTasks && <TaskList status="open" tasks={openTasks} onTaskSelect={onTaskSelect} />}

          {hasClosedTasks && (
            <TaskList status="closed" tasks={closedTasks} onTaskSelect={onTaskSelect} />
          )}
        </>
      )}
    </Stack>
  )
}
