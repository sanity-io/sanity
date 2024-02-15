import {Text} from '@sanity/ui'
import {useMemo} from 'react'

import {useTasks} from '../../context'
import {TasksCreate} from '../create/TasksCreate'

interface TaskEditProps {
  onDelete: () => void
  onCancel: () => void
  selectedTask: string | null
}
export function TaskEdit(props: TaskEditProps) {
  const {onCancel, onDelete, selectedTask} = props
  const {data} = useTasks()
  const task = useMemo(() => data.find((t) => t._id === selectedTask), [selectedTask, data])
  if (!task) {
    return <Text>Task not found</Text>
  }

  return <TasksCreate onCancel={onCancel} onDelete={onDelete} mode="edit" initialValues={task} />
}
