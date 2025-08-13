import {Card, Flex, Spinner, Stack} from '@sanity/ui'
import {motion} from 'framer-motion'
import {useCallback, useMemo} from 'react'
import {styled} from 'styled-components'

import {useCurrentUser} from '../../../store/user/hooks'
import {useTasks} from '../../context/tasks/useTasks'
import {useTasksEnabled} from '../../context/enabled/useTasksEnabled'
import {useTasksNavigation} from '../../context/navigation/useTasksNavigation'
import {TasksFormBuilder} from '../form/tasksFormBuilder/TasksFormBuilder'
import {TasksList} from '../list/TasksList'
import {TasksUpsellPanel} from '../upsell/TasksUpsellPanel'
import {TasksListFeedbackFooter} from './TaskListFeedbackFooter'
import {TasksListTabs} from './TasksListTabs'
import {TasksSidebarHeader} from './TasksSidebarHeader'

const MotionCard = motion.create(Card)
const RootCard = styled(MotionCard)`
  flex: 1;
  flex-direction: column;
`

const HeaderStack = styled(Stack)`
  border-bottom: 1px solid var(--card-border-color);
`

const ContentFlex = styled(Flex)`
  overflow-y: scroll;
  overflow-x: hidden;
`

/**
 * @internal
 */
export function TasksStudioSidebarInner() {
  const {mode} = useTasksEnabled()
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

  const content = useMemo(() => {
    if (viewMode !== 'list') {
      return <TasksFormBuilder key={selectedTask} />
    }

    if (isLoading) {
      return (
        <Flex align="center" justify="center">
          <Spinner />
        </Flex>
      )
    }

    return (
      <>
        {mode === 'upsell' && <TasksUpsellPanel />}
        <TasksList items={filteredList} onTaskSelect={onTaskSelect} />
      </>
    )
  }, [filteredList, isLoading, onTaskSelect, selectedTask, viewMode, mode])

  return (
    <RootCard
      display="flex"
      height="fill"
      flex={1}
      overflow="hidden"
      initial={{opacity: 0}}
      animate={{opacity: 1, transition: {duration: 0.2}}}
    >
      <HeaderStack space={3} padding={3} sizing="border">
        <TasksSidebarHeader items={filteredList} />
        {viewMode === 'list' && !isLoading && (
          <TasksListTabs activeTabId={activeTabId} onChange={setActiveTab} />
        )}
      </HeaderStack>

      <ContentFlex
        direction="column"
        flex={1}
        overflow="auto"
        padding={3}
        paddingTop={4}
        paddingX={4}
        sizing="border"
      >
        {content}
      </ContentFlex>
      {viewMode === 'list' && <TasksListFeedbackFooter />}
    </RootCard>
  )
}

/**
 * @internal
 */
export function TasksStudioSidebar() {
  const {enabled} = useTasksEnabled()

  if (!enabled) {
    return null
  }

  return <TasksStudioSidebarInner />
}
