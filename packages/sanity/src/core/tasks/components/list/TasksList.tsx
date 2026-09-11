import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
import {Stack, Text} from '@sanity/ui'
import {MenuDivider} from '@sanity/ui/menu'
import {Fragment, useMemo} from 'react'
import {Flex, Box} from 'ui5'

import {TASK_STATUS} from '../../constants/TaskStatus'
import {type TaskDocument, type TaskStatus} from '../../types'
import {EmptyStatusListState, EmptyTasksListState} from './EmptyStates'
import {detailsFlex, summaryBox} from './TasksList.css'
import {TasksListItem} from './TasksListItem'

const EMPTY_ARRAY: [] = []

const getLabelForStatus = (status: string) => {
  const statusConfig = TASK_STATUS.find((item) => item.value === status)
  return statusConfig?.title
}

interface TaskListProps {
  status: TaskStatus
  tasks: TaskDocument[]
  onTaskSelect: (id: string) => void
}

function TaskList(props: TaskListProps) {
  const {status, tasks, onTaskSelect} = props

  return (
    <Flex as="details" className={detailsFlex} flexDirection="column" open={status === 'open'}>
      <Box as="summary" className={summaryBox} paddingY={1}>
        <Flex alignItems="center" gap={1} paddingY={1}>
          <Text size={1} weight="medium" muted>
            {getLabelForStatus(status)}
          </Text>

          <Text muted size={1}>
            <ChevronDownIcon data-ui="summary-icon" />
          </Text>
        </Flex>
      </Box>

      <Stack gap={4} marginTop={3} paddingBottom={5}>
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
    </Flex>
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
    <Stack gap={4} flex={1}>
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
