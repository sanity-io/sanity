import {Box, Card, Flex, Spinner} from '@sanity/ui'
import {AnimatePresence, motion, type Transition, type Variants} from 'framer-motion'
import {useCallback, useMemo} from 'react'
import {useCurrentUser} from 'sanity'
import styled from 'styled-components'

import {TasksNavigationProvider, useTasks, useTasksEnabled, useTasksNavigation} from '../../context'
import {TasksCreateForm} from '../create/TasksCreateForm'
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

function TasksStudioSidebarInner() {
  const {activeDocument, isOpen, data, isLoading} = useTasks()
  const {state, setViewMode, setActiveTab, editTask} = useTasksNavigation()
  const {activeTabId, viewMode, selectedTask} = state

  const onCancel = useCallback(() => setViewMode({type: 'list'}), [setViewMode])
  const handleOnDelete = useCallback(() => setActiveTab('subscribed'), [setActiveTab])
  const onTaskCreate = useCallback(() => setActiveTab('subscribed'), [setActiveTab])

  const currentUser = useCurrentUser()
  const filteredList = useMemo(() => {
    return data.filter((item) => {
      if (!item.title) {
        return false
      }

      if (activeTabId === 'assigned') {
        return item.assignedTo === currentUser?.id
      }
      if (activeTabId === 'subscribed') {
        // TODO: Implement here the check for the subscribed tasks, right now it's returning the tasks the user created.
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
                      onTaskSelect={editTask}
                      setActiveTabId={setActiveTab}
                      activeTabId={activeTabId}
                    />
                  )}
                </>
              )}
              {viewMode === 'create' && <TasksCreateForm />}
              {viewMode === 'edit' && (
                <TaskEdit
                  onCancel={onCancel}
                  onDelete={handleOnDelete}
                  selectedTask={selectedTask}
                  key={selectedTask}
                />
              )}
            </SidebarContent>
          </SidebarRoot>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/**
 * @internal
 */
export function TasksStudioSidebar() {
  const {enabled} = useTasksEnabled()
  if (!enabled) return null
  return (
    <TasksNavigationProvider>
      <TasksStudioSidebarInner />
    </TasksNavigationProvider>
  )
}
