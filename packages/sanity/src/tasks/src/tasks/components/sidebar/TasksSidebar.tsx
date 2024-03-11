import {Box, Card, Flex, Spinner} from '@sanity/ui'
import {useCallback, useMemo} from 'react'
import {useCurrentUser} from 'sanity'
import styled from 'styled-components'

import {useTasks, useTasksEnabled, useTasksNavigation} from '../../context'
import {TasksFormBuilder} from '../form'
import {TaskSidebarContent} from './TasksSidebarContent'
import {TasksSidebarHeader} from './TasksSidebarHeader'

const SidebarRoot = styled(Card)`
  flex: 1;
`

const SidebarContent = styled.div`
  max-height: calc(100% - 52px);
  overflow: scroll;
`

/**
 * @internal
 */
export function TasksStudioSidebarInner() {
  const {activeDocument, data, isLoading} = useTasks()
  const {state, setActiveTab, setViewMode} = useTasksNavigation()
  const {activeTabId, viewMode, selectedTask} = state
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

  return (
    <SidebarRoot height="fill" flex={1}>
      <TasksSidebarHeader items={filteredList} />

      <SidebarContent>
        {viewMode === 'list' ? (
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
        ) : (
          <TasksFormBuilder key={selectedTask} />
        )}
      </SidebarContent>
    </SidebarRoot>
  )
}

/**
 * @internal
 */
export function TasksStudioSidebar() {
  const {enabled} = useTasksEnabled()
  if (!enabled) return null
  return <TasksStudioSidebarInner />
}
