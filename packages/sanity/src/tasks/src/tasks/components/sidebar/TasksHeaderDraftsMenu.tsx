import {CheckmarkIcon, ChevronDownIcon} from '@sanity/icons'
import {Flex, Menu, MenuDivider, Text} from '@sanity/ui'
import {useCallback, useMemo} from 'react'
import {useCurrentUser} from 'sanity'

import {Button, MenuButton, type MenuButtonProps, MenuItem} from '../../../../../ui-components'
import {useTasks, useTasksNavigation} from '../../context'
import {type TaskDocument} from '../../types'

const MENU_BUTTON_POPOVER_PROPS: MenuButtonProps['popover'] = {
  constrainSize: true,
  fallbackPlacements: ['bottom-end'],
  placement: 'bottom-end',
  portal: true,
}

interface TasksDraftsMenuItemProps {
  isSelected: boolean
  item: TaskDocument
  onSelect: (id: string) => void
}

function TasksDraftsMenuItem(props: TasksDraftsMenuItemProps) {
  const {isSelected, item, onSelect} = props

  const handleClick = useCallback(() => {
    onSelect(item._id)
  }, [item._id, onSelect])

  const iconRight = isSelected ? CheckmarkIcon : undefined
  const text = item.title || 'Untitled'

  return (
    <MenuItem
      iconRight={iconRight}
      onClick={handleClick}
      pressed={isSelected}
      selected={isSelected}
      text={text}
    />
  )
}

export function TasksHeaderDraftsMenu() {
  const {data} = useTasks()
  const {state, setViewMode} = useTasksNavigation()
  const {viewMode, selectedTask} = state

  const currentUser = useCurrentUser()

  const draftTasks = useMemo(() => {
    if (!currentUser?.id) return []

    return data.filter((task) => {
      const isAuthoredByUser = task.authorId === currentUser.id
      const isDraft = !task.createdByUser
      const hasEdits = task._updatedAt !== task._createdAt
      const isNotTheTaskBeingCreated = viewMode === 'create' ? task._id !== selectedTask : true
      return isAuthoredByUser && isDraft && isNotTheTaskBeingCreated && hasEdits
    })
  }, [data, selectedTask, currentUser?.id, viewMode])

  const handleSelectTask = useCallback(
    (id: string) => {
      setViewMode({type: 'draft', id})
    },
    [setViewMode],
  )

  if (!draftTasks.length) return null

  return (
    <MenuButton
      button={<Button text="Drafts" mode="ghost" iconRight={ChevronDownIcon} />}
      id="edit-task-menu"
      menu={
        <Menu>
          <Flex align="center" padding={3} gap={2}>
            <Text size={1} weight="semibold">
              Drafts
            </Text>

            <Text size={0} muted>
              continue working on your drafts
            </Text>
          </Flex>

          <MenuDivider />

          {draftTasks?.map((task) => {
            return (
              <TasksDraftsMenuItem
                isSelected={selectedTask === task._id}
                item={task}
                key={task._id}
                onSelect={handleSelectTask}
              />
            )
          })}
        </Menu>
      }
      popover={MENU_BUTTON_POPOVER_PROPS}
    />
  )
}
