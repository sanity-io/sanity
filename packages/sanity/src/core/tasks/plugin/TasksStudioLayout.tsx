import {type LayoutProps} from '../../config/studio/types'
import {AddonDatasetProvider} from '../../studio/addonDataset'
import {
  TasksEnabledProvider,
  TasksNavigationProvider,
  TasksProvider,
  useTasksEnabled,
} from '../context'

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
