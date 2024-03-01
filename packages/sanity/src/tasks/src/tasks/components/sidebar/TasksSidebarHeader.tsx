import {AddIcon, ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, CloseIcon} from '@sanity/icons'
import {
  Box,
  // eslint-disable-next-line no-restricted-imports
  Button as UIButton,
  Flex,
  Menu,
  MenuDivider,
  Text,
} from '@sanity/ui'
// eslint-disable-next-line camelcase
import {getTheme_v2} from '@sanity/ui/theme'
import {useCallback, useMemo} from 'react'
import {BetaBadge, useCurrentUser} from 'sanity'
import styled from 'styled-components'

import {
  Button,
  MenuButton,
  MenuItem,
  Tooltip,
  TooltipDelayGroupProvider,
} from '../../../../../ui-components'
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

function DraftsMenu() {
  const {data} = useTasks()
  const {state, setViewMode} = useTasksNavigation()
  const {viewMode, selectedTask} = state

  const user = useCurrentUser()

  const draftTasks = useMemo(() => {
    if (!user?.id) return []
    return data.filter((task) => {
      const isAuthoredByUser = task.authorId === user.id
      const isDraft = !task.createdByUser
      const isNotTheTaskBeingCreated = viewMode === 'create' ? task._id !== selectedTask : true
      return isAuthoredByUser && isDraft && isNotTheTaskBeingCreated
    })
  }, [data, selectedTask, user?.id, viewMode])

  const renderMenuItem = useCallback(
    (item: TaskDocument) => {
      const handleSelectTask = () => {
        setViewMode({type: 'draft', id: item._id})
      }
      const title = item.title || 'Untitled'
      const text = selectedTask === item._id ? `(editing) ${title}` : title
      // eslint-disable-next-line react/jsx-no-bind
      return <MenuItem key={item._id} text={text} onClick={handleSelectTask} />
    },
    [setViewMode, selectedTask],
  )
  if (!draftTasks.length) return null
  return (
    <MenuButton
      id="edit-task-menu"
      button={<Button text="Drafts" mode="ghost" iconRight={ChevronDownIcon} />}
      popover={{
        placement: 'bottom-end',
        portal: true,
      }}
      menu={
        <Menu>
          <Flex padding={3} gap={2} align={'flex-end'}>
            <Text size={1} weight="semibold">
              Drafts
            </Text>
            <Text size={0} muted>
              continue working on your drafts
            </Text>
          </Flex>
          <MenuDivider />
          {draftTasks.map(renderMenuItem)}
        </Menu>
      }
    />
  )
}

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
                  {viewMode === 'create' || viewMode === 'draft' ? 'Create' : activeTabId}
                </Text>
              </Box>
            </>
          )}
          <BetaBadge marginLeft={2} />
        </Flex>
        {(viewMode === 'create' || viewMode === 'draft') && <DraftsMenu />}
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
