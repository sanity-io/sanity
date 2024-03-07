import {Box, Card, Flex, Spinner} from '@sanity/ui'
import {AnimatePresence, motion, type Transition, type Variants} from 'framer-motion'
import {useCallback, useMemo} from 'react'
import {useCurrentUser} from 'sanity'
import styled from 'styled-components'

import {useTasks, useTasksEnabled, useTasksNavigation} from '../../context'
import {TaskCreate} from '../create'
import {TaskDraft} from '../draft'
import {TaskDuplicate} from '../duplicate'
import {TaskEdit} from '../edit'
import {TaskSidebarContent} from './TasksSidebarContent'
import {TasksSidebarHeader} from './TasksSidebarHeader'

const SidebarRoot = styled(Card)`
  width: 360px;
  flex: 1;
  box-shadow:
    0px 6px 8px -4px rgba(134, 144, 160, 0.2),
    0px 12px 17px -1px rgba(134, 144, 160, 0.14);
`

const SidebarContent = styled.div`
  max-height: calc(100% - 52px);
  overflow: scroll;
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
  const {activeDocument, data, isLoading} = useTasks()
  const {state, setActiveTab, setViewMode} = useTasksNavigation()
  const {activeTabId, viewMode, selectedTask, isOpen} = state
  const currentUser = useCurrentUser()

  const onTaskSelect = useCallback((id: string) => setViewMode({type: 'edit', id}), [setViewMode])
  const filteredList = useMemo(() => {
    return data.filter((item) => {
      if (!item.createdByUser) return false
      if (activeTabId === 'assigned') {
        return item.assignedTo === currentUser?.id
      }
      if (activeTabId === 'subscribed') {
        return currentUser?.id && item.subscribers?.includes(currentUser.id)
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
            <TasksSidebarHeader items={filteredList} />
            <SidebarContent>
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
                      setActiveTabId={setActiveTab}
                      activeTabId={activeTabId}
                    />
                  )}
                </>
              )}
              {viewMode === 'duplicate' && selectedTask && (
                <TaskDuplicate selectedTask={selectedTask} />
              )}
              {viewMode === 'create' && selectedTask && <TaskCreate selectedTask={selectedTask} />}
              {viewMode === 'edit' && selectedTask && <TaskEdit selectedTask={selectedTask} />}
              {viewMode === 'draft' && selectedTask && <TaskDraft selectedTask={selectedTask} />}
            </SidebarContent>
          </SidebarRoot>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
