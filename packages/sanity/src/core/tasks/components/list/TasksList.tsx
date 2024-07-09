import {ChevronDownIcon} from '@sanity/icons'
import {Box, Flex, MenuDivider, Stack, Text} from '@sanity/ui'
import {Fragment, useMemo} from 'react'
import {styled} from 'styled-components'

import {TASK_STATUS} from '../../constants/TaskStatus'
import {type TaskDocument, type TaskStatus} from '../../types'
import {EmptyStatusListState, EmptyTasksListState} from './EmptyStates'
import {TasksListItem} from './TasksListItem'

const EMPTY_ARRAY: [] = []

const getLabelForStatus = (status: string) => {
  const statusConfig = TASK_STATUS.find((item) => item.value === status)
  return statusConfig?.title
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
  status: TaskStatus
  tasks: TaskDocument[]
  onTaskSelect: (id: string) => void
}

function TaskList(props: TaskListProps) {
  const {status, tasks, onTaskSelect} = props

  return (
    <DetailsFlex forwardedAs="details" direction="column" open={status === 'open'}>
      <SummaryBox forwardedAs="summary" paddingY={1}>
        <Flex align="center" gap={1} paddingY={1}>
          <Text size={1} weight="medium" muted>
            {getLabelForStatus(status)}
          </Text>

          <Text muted size={1}>
            <ChevronDownIcon data-ui="summary-icon" />
          </Text>
        </Flex>
      </SummaryBox>

      <Stack space={4} marginTop={3} paddingBottom={5}>
        {tasks?.length > 0 ? (
          tasks.map((task, index) => {
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
          })
        ) : (
          <EmptyStatusListState status={status} />
        )}
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

  const hasOpenTasks = tasksByStatus.open?.length > 0
  const hasClosedTasks = tasksByStatus.closed?.length > 0

  return (
    <Stack space={4} flex={1}>
      {!hasOpenTasks && !hasClosedTasks ? (
        <EmptyTasksListState />
      ) : (
        <>
          <TaskList status="open" tasks={tasksByStatus.open} onTaskSelect={onTaskSelect} />

          <TaskList status="closed" tasks={tasksByStatus.closed} onTaskSelect={onTaskSelect} />
        </>
      )}
    </Stack>
  )
}
