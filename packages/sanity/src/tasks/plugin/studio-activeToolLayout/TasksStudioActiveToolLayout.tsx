import {Flex} from '@sanity/ui'
import {useTasks, useResolveTasksEnabled} from '../../src'
import {TasksStudioSidebar} from '../studio-sidebar'
import {ActiveToolLayoutProps} from '../../../core'

export function TasksStudioActiveToolLayout(props: ActiveToolLayoutProps) {
  const {isSidebarOpen} = useTasks()
  const isEnabled = useResolveTasksEnabled()
  if (!isEnabled) return props.renderDefault(props)

  return (
    <Flex height="fill">
      <div style={{minHeight: '100%', width: '100%'}}>{props.renderDefault(props)}</div>
      {isSidebarOpen && <TasksStudioSidebar />}
    </Flex>
  )
}
