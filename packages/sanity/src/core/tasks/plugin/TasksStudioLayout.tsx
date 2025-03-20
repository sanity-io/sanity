import {ConditionalWrapper} from '../../../ui-components/conditionalWrapper'
import {type LayoutProps} from '../../config/studio'
import {AddonDatasetProvider} from '../../studio/addonDataset'
import {TasksEnabledProvider, useTasksEnabled} from '../context/enabled'
import {TasksNavigationProvider} from '../context/navigation'
import {TasksProvider} from '../context/tasks'
import {TasksUpsellProvider} from '../context/upsell'

const TasksStudioLayoutInner = (props: LayoutProps) => {
  const {enabled, mode} = useTasksEnabled()

  if (!enabled) {
    return props.renderDefault(props)
  }
  return (
    <AddonDatasetProvider>
      <ConditionalWrapper
        condition={mode === 'upsell'}
        // eslint-disable-next-line react/jsx-no-bind
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
