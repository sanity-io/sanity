import {AddonDatasetProvider, type LayoutProps} from 'sanity'

import {ConditionalWrapper} from '../../ui-components/conditionalWrapper'
import {TasksEnabledProvider, TasksNavigationProvider, TasksProvider, useTasksEnabled} from '../src'
import {TasksUpsellProvider} from '../src/tasks/context/upsell'

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
