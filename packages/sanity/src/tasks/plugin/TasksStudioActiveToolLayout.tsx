import {Flex} from '@sanity/ui'

import {type ActiveToolLayoutProps} from '../../core'
import {TasksStudioSidebar, useTasks, useTasksEnabled} from '../src'

export function TasksStudioActiveToolLayout(props: ActiveToolLayoutProps) {
  const {isOpen} = useTasks()
  const {enabled} = useTasksEnabled()
  if (!enabled) return props.renderDefault(props)

  return (
    <Flex height="fill">
      <div style={{minHeight: '100%', width: '100%'}}>{props.renderDefault(props)}</div>
      {isOpen && <TasksStudioSidebar />}
    </Flex>
  )
}
