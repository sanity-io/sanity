import {AddonDatasetProvider, type LayoutProps} from 'sanity'

import {TasksEnabledProvider, TasksNavigationProvider, TasksProvider, useTasksEnabled} from '../src'

const TasksStudioLayoutInner = (props: LayoutProps) => {
  const {enabled} = useTasksEnabled()
  if (!enabled) {
    return props.renderDefault(props)
  }
  return (
    <AddonDatasetProvider>
      <TasksProvider>
        <TasksNavigationProvider>{props.renderDefault(props)}</TasksNavigationProvider>
      </TasksProvider>
    </AddonDatasetProvider>
  )
}

export function TasksStudioLayout(props: LayoutProps) {
  return (
    <TasksEnabledProvider>
      <TasksStudioLayoutInner {...props} />
    </TasksEnabledProvider>
  )
}
