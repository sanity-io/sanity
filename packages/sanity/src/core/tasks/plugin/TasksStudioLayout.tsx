import {type LayoutProps} from '../../config/studio/types'
import {AddonDatasetProvider} from '../../studio/addonDataset'
import {TasksEnabledProvider} from '../context/enabled/TasksEnabledProvider'
import {useTasksEnabled} from '../context/enabled/useTasksEnabled'
import {TasksNavigationProvider} from '../context/navigation/TasksNavigationProvider'
import {TasksProvider} from '../context/tasks/TasksProvider'

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
