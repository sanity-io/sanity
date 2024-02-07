import {Card} from '@sanity/ui'
import styled from 'styled-components'
import {motion} from 'framer-motion'

import {useResolveTasksEnabled, useTasks} from '../../src'
import {TasksSidebarHeader} from '../../src/components'

const SidebarRoot = styled(Card)`
  height: 100%;
  width: 360px;
`

export function TasksStudioSidebar() {
  const {isSidebarOpen} = useTasks()
  const isEnabled = useResolveTasksEnabled()

  if (!isSidebarOpen || !isEnabled) return null
  return (
    <motion.div
      initial={{translateX: 16, opacity: 0}}
      animate={{translateX: 0, opacity: 1}}
      transition={{duration: 0.2}}
    >
      <SidebarRoot borderLeft height="fill">
        <TasksSidebarHeader />
      </SidebarRoot>
    </motion.div>
  )
}
