import {AddonDatasetProvider} from 'sanity'

import {TasksForm, TasksProvider} from '../src'

export default function TasksCreateStory() {
  return (
    <AddonDatasetProvider>
      <TasksProvider>
        <TasksForm documentId="fake-id" mode="create" />
      </TasksProvider>
    </AddonDatasetProvider>
  )
}
