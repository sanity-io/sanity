import {Box, Stack} from '@sanity/ui'
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
        {items
          .filter((item) => Boolean(item.title))
          .map((item) => (
            <TasksListItem
              key={item._id}
              title={item.title}
              dueBy={item.dueBy}
              // eslint-disable-next-line react/jsx-no-bind
              onSelect={() => onTaskSelect(item._id)}
            />
          ))}
      </Stack>
    </Box>
  )
}
