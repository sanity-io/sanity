import {AddonDatasetProvider} from 'sanity'

import {TasksForm, TasksProvider} from '../src'

function noop() {
  return null
}
export default function TasksCreateStory() {
  return (
    <AddonDatasetProvider>
      <TasksProvider>
        <TasksForm onCancel={noop} mode="create" />
      </TasksProvider>
    </AddonDatasetProvider>
  )
}
