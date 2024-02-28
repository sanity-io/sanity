import {Box, Card, Flex, Spinner} from '@sanity/ui'
import {AnimatePresence, motion, type Transition, type Variants} from 'framer-motion'
import {useCallback, useMemo, useState} from 'react'
import {useCurrentUser} from 'sanity'
import styled from 'styled-components'

import {useTasks, useTasksEnabled} from '../../context'
import {TaskCreate} from '../create'
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
  const {activeDocument, isOpen, data, isLoading} = useTasks()
  // TODO: Move this to the router.
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  // TODO: Move this to the router.
  const [selectedTask, setSelectedTask] = useState<null | string>(null)
  // TODO: Move this to the router.
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

  const currentUser = useCurrentUser()
  const filteredList = useMemo(() => {
    return data.filter((item) => {
      if (!item.title) {
        return false
      }

      if (activeTabId === 'assigned') {
        return item.assignedTo === currentUser?.id
      }
      if (activeTabId === 'created') {
        return item.authorId === currentUser?.id
      }
      if (activeTabId === 'document') {
        return (
          activeDocument?.documentId && item.target?.document._ref === activeDocument.documentId
        )
      }
      return false
    })
  }, [activeDocument?.documentId, activeTabId, data, currentUser])

  if (!enabled) return null

  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div variants={VARIANTS} transition={TRANSITION} initial="hidden" animate="visible">
          <SidebarRoot borderLeft height="fill" marginLeft={1}>
            <TasksSidebarHeader
              setViewMode={setViewMode}
              viewMode={viewMode}
              activeTabId={activeTabId}
              items={filteredList}
              selectedTask={selectedTask}
              setSelectedTask={setSelectedTask}
            />
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
                    items={filteredList}
                    onTaskSelect={onTaskSelect}
                    setActiveTabId={setActiveTabId}
                    activeTabId={activeTabId}
                  />
                )}
              </>
            )}
            {viewMode === 'create' && <TaskCreate onCancel={onCancel} onCreate={onTaskCreate} />}
            {viewMode === 'edit' && (
              <TaskEdit
                onCancel={onCancel}
                onDelete={handleOnDelete}
                selectedTask={selectedTask}
                key={selectedTask}
              />
            )}
          </SidebarRoot>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
