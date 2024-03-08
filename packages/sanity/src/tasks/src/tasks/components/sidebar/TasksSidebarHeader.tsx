import {AddIcon, ChevronLeftIcon, ChevronRightIcon, CloseIcon} from '@sanity/icons'
import {
  Box,
  // eslint-disable-next-line no-restricted-imports
  Button as UIButton,
  Flex,
  Text,
} from '@sanity/ui'
// eslint-disable-next-line camelcase
import {getTheme_v2} from '@sanity/ui/theme'
import {useCallback} from 'react'
import {BetaBadge} from 'sanity'
import styled from 'styled-components'

import {Button, Tooltip, TooltipDelayGroupProvider} from '../../../../../ui-components'
import {useTasks, useTasksNavigation} from '../../context'
import {type TaskDocument} from '../../types'

interface TasksSidebarHeaderProps {
  items: TaskDocument[]
}

const Divider = styled.div((props) => {
  const theme = getTheme_v2(props.theme)

  return `
    height: 25px;
    width: 1px;
    background-color: ${theme.color.input.default.enabled.border};
  `
})

/**
 * @internal
 */
export function TasksSidebarHeader(props: TasksSidebarHeaderProps) {
  const {items: allItems} = props
  const {state, editTask, setViewMode} = useTasksNavigation()
  const {viewMode, activeTabId, selectedTask} = state
  const {toggleOpen} = useTasks()
  const items = allItems.filter((t) => t.status === 'open')
  const currentItemIndex = items.findIndex((item) => item._id === selectedTask)

  const goToPreviousTask = useCallback(() => {
    editTask(currentItemIndex > 0 ? items[currentItemIndex - 1]._id : items[items.length - 1]._id)
  }, [currentItemIndex, items, editTask])
  const goToNextTask = useCallback(() => {
    editTask(currentItemIndex < items.length - 1 ? items[currentItemIndex + 1]._id : items[0]._id)
  }, [currentItemIndex, items, editTask])

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
                  {viewMode === 'create' ? 'Create' : activeTabId}
                </Text>
              </Box>
            </>
          )}
          <BetaBadge marginLeft={2} />
        </Flex>
        {viewMode === 'edit' && (
          <TooltipDelayGroupProvider>
            <Flex gap={1} align="center">
              <Button
                tooltipProps={{content: 'Go to previous task'}}
                mode="bleed"
                icon={ChevronLeftIcon}
                onClick={goToPreviousTask}
              />
              <Tooltip content={'Open tasks'}>
                <Box paddingY={2}>
                  <Text size={1}>
                    {currentItemIndex + 1} / {items.length}
                  </Text>
                </Box>
              </Tooltip>
              <Button
                tooltipProps={{content: 'Go to next task'}}
                mode="bleed"
                icon={ChevronRightIcon}
                onClick={goToNextTask}
              />

              <Divider />
            </Flex>
          </TooltipDelayGroupProvider>
        )}
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
            onClick={toggleOpen}
          />
        </Flex>
      </Flex>
    </Box>
  )
}
