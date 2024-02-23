import {AddonDatasetProvider, type LayoutProps} from 'sanity'

import {TasksEnabledProvider, TasksProvider} from '../src'

export function TasksStudioLayout(props: LayoutProps) {
  return (
    <TasksEnabledProvider>
      <AddonDatasetProvider>
        <TasksProvider>{props.renderDefault(props)}</TasksProvider>
      </AddonDatasetProvider>
    </TasksEnabledProvider>
  )
}
