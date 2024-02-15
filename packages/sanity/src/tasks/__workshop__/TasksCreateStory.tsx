import {TasksCreate, TasksProvider, TasksSetupProvider} from '../src'

function noop() {
  return null
}
export default function TasksCreateStory() {
  return (
    <TasksSetupProvider>
      <TasksProvider>
        <TasksCreate onCancel={noop} mode="create" />
      </TasksProvider>
    </TasksSetupProvider>
  )
}
