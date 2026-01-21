import type {LayoutProps} from '../../config/studio/types'
import {AddonDatasetProvider} from '../../studio/addonDataset/AddonDatasetProvider'
import {TasksEnabledProvider} from '../context/enabled/TasksEnabledProvider'
import {TasksNavigationProvider} from '../context/navigation/TasksNavigationProvider'
import {TasksProvider} from '../context/tasks/TasksProvider'
import {TasksUpsellProvider} from '../context/upsell/TasksUpsellProvider'
import {useTasksEnabled} from '../context/enabled/useTasksEnabled'

const TasksStudioLayoutInner = (props: LayoutProps) => {
  const {enabled, mode} = useTasksEnabled()

  if (!enabled) {
    return props.renderDefault(props)
  }

  const children = (
    <TasksProvider>
      <TasksNavigationProvider>{props.renderDefault(props)}</TasksNavigationProvider>
    </TasksProvider>
  )

  if (mode === 'upsell') {
    return (
      <AddonDatasetProvider>
        <TasksUpsellProvider>{children}</TasksUpsellProvider>
      </AddonDatasetProvider>
    )
  }

  return <AddonDatasetProvider>{children}</AddonDatasetProvider>
}

export function TasksStudioLayout(props: LayoutProps) {
  return (
    <TasksEnabledProvider>
      <TasksStudioLayoutInner {...props} />
    </TasksEnabledProvider>
  )
}
