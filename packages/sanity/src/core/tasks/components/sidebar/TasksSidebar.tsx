import {Card, Spinner, Stack} from '@sanity/ui'
import {motion} from 'motion/react'
import {useCallback, useMemo} from 'react'
import {Flex} from 'ui5'

import {useCurrentUser} from '../../../store/user/hooks'
import {useTasksEnabled} from '../../context/enabled/useTasksEnabled'
import {useTasksNavigation} from '../../context/navigation/useTasksNavigation'
import {useTasks} from '../../context/tasks/useTasks'
import {TasksFormBuilder} from '../form/tasksFormBuilder/TasksFormBuilder'
import {getTargetDocumentId} from '../form/utils'
import {TasksList} from '../list/TasksList'
import {TasksUpsellPanel} from '../upsell/TasksUpsellPanel'
import {TasksListTabs} from './TasksListTabs'
import {contentFlex, headerStack, rootCard} from './TasksSidebar.css'
import {TasksSidebarHeader} from './TasksSidebarHeader'

const MotionCard = motion.create(Card)

/**
 * @internal
 */
function TasksStudioSidebarInner() {
  const {mode} = useTasksEnabled()
  const {activeDocument, data, isLoading} = useTasks()
  const {state, setActiveTab, setViewMode} = useTasksNavigation()
  const {activeTabId, viewMode, selectedTask} = state
  const currentUser = useCurrentUser()

  const onTaskSelect = useCallback((id: string) => setViewMode({type: 'edit', id}), [setViewMode])

  const filteredList = data.filter((item) => {
    if (!item.createdByUser) return false
    if (activeTabId === 'assigned') {
      return item.assignedTo === currentUser?.id
    }
    if (activeTabId === 'subscribed') {
      return currentUser?.id && item.subscribers?.includes(currentUser.id)
    }
    if (activeTabId === 'document') {
      return (
        activeDocument?.documentId && getTargetDocumentId(item.target) === activeDocument.documentId
      )
    }
    return false
  })

  const content = useMemo(() => {
    if (viewMode !== 'list') {
      return <TasksFormBuilder key={selectedTask} />
    }

    if (isLoading) {
      return (
        <Flex alignItems="center" justifyContent="center">
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
    <MotionCard
      className={rootCard}
      display="flex"
      height="fill"
      flex={1}
      overflow="hidden"
      initial={{opacity: 0}}
      animate={{opacity: 1, transition: {duration: 0.2}}}
    >
      <Stack className={headerStack} gap={3} padding={3} sizing="border">
        <TasksSidebarHeader items={filteredList} />
        {viewMode === 'list' && !isLoading && (
          <TasksListTabs activeTabId={activeTabId} onChange={setActiveTab} />
        )}
      </Stack>

      <Flex
        className={contentFlex}
        flexDirection="column"
        flexBasis="0%"
        flexGrow={1}
        overflow="auto"
        padding={3}
        paddingTop={4}
        paddingX={4}
      >
        {content}
      </Flex>
    </MotionCard>
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
