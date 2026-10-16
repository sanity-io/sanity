import {Card, Spinner, Text} from '@sanity/ui'
import {motion} from 'motion/react'
import {use, useCallback, useMemo} from 'react'
import {Flex} from 'ui5'

import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {useCurrentUser} from '../../../store/user/hooks'
import {useTasksMode} from '../../context/enabled/useTasksMode'
import {useTasksNavigation} from '../../context/navigation/useTasksNavigation'
import {useTasks} from '../../context/tasks/useTasks'
import {tasksLocaleNamespace} from '../../i18n'
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
export function TasksStudioSidebar() {
  const mode = use(useTasksMode())
  const {activeDocument, data, isLoading} = useTasks()
  const {state, setActiveTab, setViewMode} = useTasksNavigation()
  const {activeTabId, viewMode, selectedTask} = state
  const currentUser = useCurrentUser()
  const {t} = useTranslation(tasksLocaleNamespace)

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
    if (mode === null) {
      // The feature check failed, so whether the plan has tasks is unknown: fail closed, like a
      // failed check disables comments and scheduled publishing
      return (
        <Text muted size={1}>
          {t('panel.unavailable.text')}
        </Text>
      )
    }

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
  }, [filteredList, isLoading, onTaskSelect, selectedTask, viewMode, mode, t])

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
      <Flex className={headerStack} gap={3} padding={3} flexDirection="column">
        <TasksSidebarHeader items={filteredList} />
        {mode !== null && viewMode === 'list' && !isLoading && (
          <TasksListTabs activeTabId={activeTabId} onChange={setActiveTab} />
        )}
      </Flex>

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
