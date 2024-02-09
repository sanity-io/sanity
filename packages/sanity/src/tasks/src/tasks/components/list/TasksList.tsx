import {Box, Stack} from '@sanity/ui'
import {TaskDocument} from '../../types'
import {TasksListItem} from './TasksListItem'

/**
 * @internal
 */
export function TasksList({items}: {items: TaskDocument[]}) {
  return (
    <Box padding={3}>
      <Stack space={3}>
        {items
          .filter((item) => Boolean(item.title))
          .map((item) => (
            <TasksListItem key={item._id} title={item.title} dueBy={item.dueBy} />
          ))}
      </Stack>
    </Box>
  )
}
