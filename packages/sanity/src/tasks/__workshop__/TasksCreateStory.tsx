import {TasksForm, TasksProvider, TasksSetupProvider} from '../src'

function noop() {
  return null
}
export default function TasksCreateStory() {
  return (
    <TasksSetupProvider>
      <TasksProvider>
        <TasksForm onCancel={noop} mode="create" />
      </TasksProvider>
    </TasksSetupProvider>
  )
}
