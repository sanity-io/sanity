import {TasksForm} from '../form/TasksForm'

interface TaskCreateProps {
  onCreate: () => void
}
export function TaskCreate(props: TaskCreateProps) {
  const {onCreate} = props
  return <TasksForm />
}
