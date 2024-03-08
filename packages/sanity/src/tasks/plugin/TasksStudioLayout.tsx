import {AddonDatasetProvider, type LayoutProps} from 'sanity'

import {TasksEnabledProvider, TasksProvider, useTasksEnabled} from '../src'

const TasksStudioLayoutInner = (props: LayoutProps) => {
  const enabled = useTasksEnabled()
  if (!enabled) {
    return props.renderDefault(props)
  }
  return (
    <AddonDatasetProvider>
      <TasksProvider>{props.renderDefault(props)}</TasksProvider>
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
