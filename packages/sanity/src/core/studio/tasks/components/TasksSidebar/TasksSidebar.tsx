import {Card} from '@sanity/ui'
import styled from 'styled-components'
import {AnimatePresence, motion} from 'framer-motion'
import {useTasksEnabled, useTasks} from '../../context'
import {TasksSidebarHeader} from './TasksSidebarHeader'

const SidebarRoot = styled(Card)`
  height: 100%;
  width: 360px;
  margin-left: 4px;
  box-shadow:
    0px 6px 8px -4px rgba(134, 144, 160, 0.2),
    0px -6px 8px -4px rgba(134, 144, 160, 0.2);
`

export function TasksStudioSidebar() {
  const {enabled} = useTasksEnabled()
  const {isSidebarOpen} = useTasks()

  if (!enabled) return null
  return (
    <AnimatePresence initial={false}>
      {isSidebarOpen && (
        <motion.div
          initial={{translateX: 16, opacity: 0}}
          animate={{translateX: 0, opacity: 1}}
          transition={{duration: 0.2}}
        >
          <SidebarRoot borderLeft height="fill">
            <TasksSidebarHeader />
          </SidebarRoot>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
