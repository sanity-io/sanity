import {AddonDatasetProvider, type LayoutProps} from 'sanity'

import {TasksEnabledProvider, TasksNavigationProvider, TasksProvider} from '../src'

export function TasksStudioLayout(props: LayoutProps) {
  return (
    <TasksEnabledProvider>
      <AddonDatasetProvider>
        <TasksProvider>
          <TasksNavigationProvider>{props.renderDefault(props)}</TasksNavigationProvider>
        </TasksProvider>
      </AddonDatasetProvider>
    </TasksEnabledProvider>
  )
}
