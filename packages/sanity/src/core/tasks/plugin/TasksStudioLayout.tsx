import {LayoutProps} from '../../config'
import {TasksContextProvider} from '../../tasks'
import {TasksSidebar} from './TasksSidebar'

export function TasksStudioLayout(props: LayoutProps) {
  return (
    <TasksContextProvider>
      <TasksSidebar />

      {props.renderDefault(props)}
    </TasksContextProvider>
  )
}
