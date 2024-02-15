import {type LayoutProps} from 'sanity'

import {TasksEnabledProvider, TasksProvider, TasksSetupProvider} from '../src'

export function TasksStudioLayout(props: LayoutProps) {
  return (
    <TasksEnabledProvider>
      <TasksSetupProvider>
        <TasksProvider>{props.renderDefault(props)}</TasksProvider>
      </TasksSetupProvider>
    </TasksEnabledProvider>
  )
}
