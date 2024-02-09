import {TasksEnabledProvider, TasksProvider, TasksSetupProvider} from '../src'
import {LayoutProps} from 'sanity'

export function TasksStudioLayout(props: LayoutProps) {
  return (
    <TasksEnabledProvider>
      <TasksSetupProvider>
        <TasksProvider>{props.renderDefault(props)}</TasksProvider>
      </TasksSetupProvider>
    </TasksEnabledProvider>
  )
}
