import {TasksForm} from '../form/TasksForm'

interface TaskDraftProps {
  selectedTask: string
}
export function TaskDraft(props: TaskDraftProps) {
  const {selectedTask} = props

  return <TasksForm documentId={selectedTask} mode="create" />
}
