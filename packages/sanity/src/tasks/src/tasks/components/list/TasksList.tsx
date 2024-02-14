import {Box, Stack, Text} from '@sanity/ui'
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
        {items
          .filter((item) => Boolean(item.title))
          .map((item) => (
            <TasksListItem
              key={item._id}
              documentId={item._id}
              title={item.title}
              dueBy={item.dueBy}
              assignedTo={item.assignedTo}
              target={item.target}
              onSelect={() => onTaskSelect(item._id)}
            />
          ))}
      </Stack>
    </Box>
  )
}
