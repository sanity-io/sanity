import {Flex} from '@sanity/ui'
import {type ActiveToolLayoutProps} from 'sanity'

import {TasksStudioSidebar, useTasksEnabled, useTasksNavigation} from '../src'

export function TasksStudioActiveToolLayout(props: ActiveToolLayoutProps) {
  const {
    state: {isOpen},
  } = useTasksNavigation()
  const {enabled} = useTasksEnabled()
  if (!enabled) return props.renderDefault(props)

  return (
    <Flex height="fill">
      <div style={{minHeight: '100%', width: '100%'}}>{props.renderDefault(props)}</div>
      {isOpen && <TasksStudioSidebar />}
    </Flex>
  )
}
