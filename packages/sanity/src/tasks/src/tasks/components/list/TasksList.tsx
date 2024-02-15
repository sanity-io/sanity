import {Box, Flex, Label, Stack, Text} from '@sanity/ui'
import {TaskDocument} from '../../types'
import {TasksListItem} from './TasksListItem'

interface TasksListProps {
  onTaskSelect: (id: string) => void
  items: TaskDocument[]
}

/**
 * @internal
 */
export function TasksList(props: TasksListProps) {
  const {items, onTaskSelect} = props

  const checkboxValues = [
    {name: 'open', label: 'To do'},
    {name: 'closed', label: 'Done'},
  ]

  const getLabelForStatus = (status: string) => {
    const statusConfig = checkboxValues.find((item) => item.name === status)
    return statusConfig?.label
  }

  // Filter tasks by status to render them in separate lists
  const tasksByStatus = (status: string) => items.filter((item) => item.status === status)

  const renderTasksList = (status: string) => {
    const tasks = tasksByStatus(status)
    if (tasks.length === 0) {
      return null
    }
    return (
      <Box padding={3}>
        <Flex paddingBottom={3}>
          <Label>{getLabelForStatus(status)}</Label>
        </Flex>
        <Stack space={3}>
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
      </Box>
    )
  }

  return (
    <Box padding={3}>
      <Stack space={3}>
        {items.length === 0 && (
          <Box paddingX={2}>
            <Text as="p" size={1} muted>
              No tasks
            </Text>
          </Box>
        )}
        {renderTasksList('open')}
        {renderTasksList('closed')}
      </Stack>
    </Box>
  )
}
