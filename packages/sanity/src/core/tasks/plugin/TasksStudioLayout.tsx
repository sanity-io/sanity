import {type LayoutProps} from '../../config'
import {AddonDatasetProvider} from '../../studio'
import {
  TasksEnabledProvider,
  TasksNavigationProvider,
  TasksProvider,
  TasksUpsellProvider,
  useTasksEnabled,
} from '../context'

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
