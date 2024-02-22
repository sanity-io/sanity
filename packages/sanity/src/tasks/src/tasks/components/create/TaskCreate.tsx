import {TasksForm} from '../form/TasksForm'

interface TaskCreateProps {
  onCreate: () => void
  onCancel: () => void
}
export function TaskCreate(props: TaskCreateProps) {
  return <TasksForm {...props} mode="create" />
}
