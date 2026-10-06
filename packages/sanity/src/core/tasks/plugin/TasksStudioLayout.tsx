import {type LayoutProps} from '../../config/studio/types'
import {AddonDatasetProvider} from '../../studio/addonDataset/AddonDatasetProvider'
import {useTasksEnabled} from '../context/enabled/useTasksEnabled'
import {TasksNavigationProvider} from '../context/navigation/TasksNavigationProvider'
import {TasksProvider} from '../context/tasks/TasksProvider'
import {TasksUpsellProvider} from '../context/upsell/TasksUpsellProvider'

export function TasksStudioLayout(props: LayoutProps) {
  const enabled = useTasksEnabled()

  if (!enabled) {
    return props.renderDefault(props)
  }

  // Same tree in both modes, so the layout never waits for the mode; the upsell provider is only
  // consulted by UI that already knows it is in upsell mode.
  return (
    <AddonDatasetProvider>
      <TasksUpsellProvider>
        <TasksProvider>
          <TasksNavigationProvider>{props.renderDefault(props)}</TasksNavigationProvider>
        </TasksProvider>
      </TasksUpsellProvider>
    </AddonDatasetProvider>
  )
}
