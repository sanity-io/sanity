import {Box, Card, Flex, Spinner} from '@sanity/ui'
import {AnimatePresence, motion, type Transition, type Variants} from 'framer-motion'
import {useCallback, useState} from 'react'
import styled from 'styled-components'

import {useTasks, useTasksEnabled} from '../../context'
import {TasksCreate} from '../create/'
import {TaskEdit} from '../edit'
import {TaskSidebarContent} from './TasksSidebarContent'
import {TasksSidebarHeader} from './TasksSidebarHeader'
import {type SidebarTabsIds, type ViewMode} from './types'

const SidebarRoot = styled(Card)`
  width: 360px;
  flex: 1;
  box-shadow:
    0px 6px 8px -4px rgba(134, 144, 160, 0.2),
    0px -6px 8px -4px rgba(134, 144, 160, 0.2);
`

const VARIANTS: Variants = {
  hidden: {opacity: 0, x: 0},
  visible: {opacity: 1, x: 0},
}

const TRANSITION: Transition = {duration: 0.2}

/**
 * @internal
 */
export function TasksStudioSidebar() {
  const {enabled} = useTasksEnabled()
  const {activeDocumentId, isOpen, data, isLoading} = useTasks()
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedTask, setSelectedTask] = useState<null | string>(null)
  const [activeTabId, setActiveTabId] = useState<SidebarTabsIds>('assigned')

  const onCancel = useCallback(() => setViewMode('list'), [])
  const handleOnDelete = useCallback(() => {
    setViewMode('list')
    setActiveTabId('created')
  }, [])

  const onTaskSelect = useCallback((id: string) => {
    setViewMode('edit')
    setSelectedTask(id)
  }, [])

  const onTaskCreate = useCallback(() => {
    setViewMode('list')
    setActiveTabId('created')
  }, [])

  if (!enabled) return null

  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div variants={VARIANTS} transition={TRANSITION} initial="hidden" animate="visible">
          <SidebarRoot borderLeft height="fill" marginLeft={1}>
            <TasksSidebarHeader setViewMode={setViewMode} viewMode={viewMode} />
            {viewMode === 'list' && (
              <>
                {isLoading ? (
                  <Box padding={3}>
                    <Flex align="center" justify="center">
                      <Spinner />
                    </Flex>
                  </Box>
                ) : (
                  <TaskSidebarContent
                    items={data}
                    activeDocumentId={activeDocumentId}
                    onTaskSelect={onTaskSelect}
                    setActiveTabId={setActiveTabId}
                    activeTabId={activeTabId}
                  />
                )}
              </>
            )}
            {viewMode === 'create' && (
              <TasksCreate onCancel={onCancel} mode="create" onCreate={onTaskCreate} />
            )}
            {viewMode === 'edit' && (
              <TaskEdit onCancel={onCancel} onDelete={handleOnDelete} selectedTask={selectedTask} />
            )}
          </SidebarRoot>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
