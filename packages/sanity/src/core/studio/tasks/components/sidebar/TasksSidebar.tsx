import {Card, Spinner} from '@sanity/ui'
import styled from 'styled-components'
import {AnimatePresence, motion, Transition, Variants} from 'framer-motion'
import {useTasksEnabled, useTasks} from '../../context'
import {TasksSidebarHeader} from './TasksSidebarHeader'
import {TaskSidebarContent} from './TasksSidebarContent'

const SidebarRoot = styled(Card)`
  width: 360px;
  box-shadow:
    0px 6px 8px -4px rgba(134, 144, 160, 0.2),
    0px -6px 8px -4px rgba(134, 144, 160, 0.2);
`

const VARIANTS: Variants = {
  hidden: {opacity: 0, x: 16},
  visible: {opacity: 1, x: 0},
}

const TRANSITION: Transition = {duration: 0.2}

export function TasksStudioSidebar() {
  const {enabled} = useTasksEnabled()
  const {activeDocumentId, isOpen, data, isLoading} = useTasks()

  if (!enabled) return null
  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div variants={VARIANTS} transition={TRANSITION} initial="hidden" animate="visible">
          <SidebarRoot borderLeft height="fill" marginLeft={1}>
            <TasksSidebarHeader />
            {isLoading ? (
              <Spinner />
            ) : (
              <TaskSidebarContent items={data} activeDocumentId={activeDocumentId} />
            )}
          </SidebarRoot>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
