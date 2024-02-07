import {TasksProvider, useResolveTasksEnabled} from '../../src'
import {LayoutProps} from 'sanity'

export function TasksStudioLayout(props: LayoutProps) {
  const isEnabled = useResolveTasksEnabled()
  if (!isEnabled) return props.renderDefault(props)

  return <TasksProvider enabled={isEnabled}>{props.renderDefault(props)}</TasksProvider>
}
