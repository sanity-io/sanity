import {Box, Stack} from '@sanity/ui'
import {TasksListItem} from '../src/tasks/components/list/TasksListItem'

interface TaskDocument {
  _id: string
  title: string
  description: string
  status: 'todo' | 'in-progress' | 'done'
  assignee: string
  dueBy: string
}

/**
 * @internal
 */
export default function TasksListItemStory() {
  const tasks: TaskDocument[] = [
    {
      _id: '1',
      title: 'Task',
      description: 'This is a dummy task for testing purposes.',
      status: 'todo',
      assignee: 'John Doe',
      dueBy: 'February 1, 2022',
    },
    {
      _id: '2',
      title: 'Task 2',
      description: 'This is a dummy task for testing purposes.',
      status: 'todo',
      assignee: 'John Doe',
      dueBy: 'February 1, 2023',
    },
  ]

  return (
    <Box padding={3}>
      <Stack space={3}>
        {tasks
          .filter((item) => Boolean(item.title))
          .map((item) => (
            <TasksListItem key={item._id} title={item.title} dueBy={item.dueBy} />
          ))}
      </Stack>
    </Box>
  )
}
