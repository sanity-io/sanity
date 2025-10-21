import {ConditionalWrapper} from '../../../ui-components/conditionalWrapper/ConditionalWrapper'
import {type LayoutProps} from '../../config/studio/types'
import {AddonDatasetProvider} from '../../studio/addonDataset/AddonDatasetProvider'
import {TasksEnabledProvider} from '../context/enabled/TasksEnabledProvider'
import {useTasksEnabled} from '../context/enabled/useTasksEnabled'
import {TasksNavigationProvider} from '../context/navigation/TasksNavigationProvider'
import {TasksProvider} from '../context/tasks/TasksProvider'
import {TasksUpsellProvider} from '../context/upsell/TasksUpsellProvider'

const TasksStudioLayoutInner = (props: LayoutProps) => {
  const {enabled, mode} = useTasksEnabled()

  if (!enabled) {
    return props.renderDefault(props)
  }
  return (
    <AddonDatasetProvider>
      <ConditionalWrapper
        condition={mode === 'upsell'}
        wrapper={(children) => <TasksUpsellProvider>{children}</TasksUpsellProvider>}
      >
        <TasksProvider>
          <TasksNavigationProvider>{props.renderDefault(props)}</TasksNavigationProvider>
        </TasksProvider>
      </ConditionalWrapper>
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
