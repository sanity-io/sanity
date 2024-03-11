import {AddIcon, ChevronRightIcon, CloseIcon} from '@sanity/icons'
import {
  Box,
  // eslint-disable-next-line no-restricted-imports
  Button as UIButton,
  Flex,
  Text,
} from '@sanity/ui'
// eslint-disable-next-line camelcase
import {useCallback} from 'react'
import {BetaBadge} from 'sanity'

import {Button} from '../../../../../ui-components'
import {useTasksNavigation} from '../../context'
import {type TaskDocument} from '../../types'
import {TasksActiveTabNavigation} from './TasksActiveTabNavigation'
import {DraftsMenu} from './TasksHeaderDraftsMenu'

interface TasksSidebarHeaderProps {
  items: TaskDocument[]
}

/**
 * @internal
 */
export function TasksSidebarHeader(props: TasksSidebarHeaderProps) {
  const {items: allItems} = props
  const {state, setViewMode, handleCloseTasks} = useTasksNavigation()
  const {viewMode, activeTabId} = state

  const handleTaskCreate = useCallback(() => {
    setViewMode({type: 'create'})
  }, [setViewMode])

  const handleGoBack = useCallback(() => {
    setViewMode({type: 'list'})
  }, [setViewMode])

  return (
    <Box padding={2}>
      <Flex padding={1} justify="space-between" align="center" gap={1}>
        <Flex align="center" flex={1}>
          {viewMode === 'list' ? (
            <Box padding={2}>
              <Text size={2} weight="semibold">
                Tasks
              </Text>
            </Box>
          ) : (
            <>
              <UIButton mode="bleed" space={2} padding={2} onClick={handleGoBack}>
                <Text size={1}>Tasks</Text>
              </UIButton>
              <ChevronRightIcon />
              <Box paddingX={2}>
                <Text size={1} weight="semibold" style={{textTransform: 'capitalize'}}>
                  {viewMode === 'create' || viewMode === 'draft' ? 'Create' : activeTabId}
                </Text>
              </Box>
            </>
          )}
          <BetaBadge marginLeft={2} />
        </Flex>
        {(viewMode === 'create' || viewMode === 'draft') && <DraftsMenu />}
        {viewMode === 'edit' && <TasksActiveTabNavigation items={allItems} />}
        <Flex gap={1}>
          {viewMode === 'list' && (
            <Button icon={AddIcon} onClick={handleTaskCreate} mode="bleed" text="New task" />
          )}

          <Button
            tooltipProps={{
              content: 'Close sidebar',
            }}
            iconRight={CloseIcon}
            mode="bleed"
            onClick={handleCloseTasks}
          />
        </Flex>
      </Flex>
    </Box>
  )
}
