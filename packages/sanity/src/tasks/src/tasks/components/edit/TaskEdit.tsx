import {TasksForm} from '../form/TasksForm'

interface TaskEditProps {
  selectedTask: string
}
export function TaskEdit(props: TaskEditProps) {
  const {selectedTask} = props

  return <TasksForm documentId={selectedTask} mode="edit" />
}
