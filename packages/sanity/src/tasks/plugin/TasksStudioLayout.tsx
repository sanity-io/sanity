import {ConditionalWrapper} from '@sanity/ui'
import {AddonDatasetProvider, type LayoutProps} from 'sanity'

import {TasksEnabledProvider, TasksProvider, useTasksEnabled} from '../src'

interface TasksStudioLayoutProps extends LayoutProps {
  withAddonDatasetProvider?: boolean
}

const TasksStudioLayoutInner = (props: TasksStudioLayoutProps) => {
  const {withAddonDatasetProvider = true, ...defaultProps} = props

  const enabled = useTasksEnabled()

  if (!enabled) {
    return defaultProps.renderDefault(defaultProps)
  }

  return (
    <ConditionalWrapper
      condition={Boolean(withAddonDatasetProvider)}
      wrapper={(children) => <AddonDatasetProvider>{children}</AddonDatasetProvider>}
    >
      <TasksProvider>{defaultProps.renderDefault(defaultProps)}</TasksProvider>
    </ConditionalWrapper>
  )
}

export function TasksStudioLayout(props: TasksStudioLayoutProps) {
  return (
    <TasksEnabledProvider>
      <TasksStudioLayoutInner {...props} />
    </TasksEnabledProvider>
  )
}
