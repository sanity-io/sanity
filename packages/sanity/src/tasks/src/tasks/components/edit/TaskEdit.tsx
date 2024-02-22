import {TasksForm} from '../form/TasksForm'

interface TaskEditProps {
  onDelete: () => void
  selectedTask: string
}
export function TaskEdit(props: TaskEditProps) {
  const {onDelete, selectedTask} = props

  return <TasksForm documentId={selectedTask} />
}
