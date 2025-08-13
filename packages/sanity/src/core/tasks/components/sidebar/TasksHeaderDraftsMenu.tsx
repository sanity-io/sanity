import {CheckmarkIcon, ChevronDownIcon} from '@sanity/icons'
import {Box, Menu, MenuDivider, Text} from '@sanity/ui'
import {useCallback, useMemo} from 'react'
import {styled} from 'styled-components'

import {Button} from '../../../../ui-components/button/Button'
import {MenuButton, type MenuButtonProps} from '../../../../ui-components/menuButton/MenuButton'
import {MenuItem} from '../../../../ui-components/menuItem/MenuItem'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {useCurrentUser} from '../../../store/user/hooks'
import {useTasks} from '../../context/tasks/useTasks'
import {useTasksNavigation} from '../../context/navigation/useTasksNavigation'
import {tasksLocaleNamespace} from '../../i18n'
import {type TaskDocument} from '../../types'

const MENU_BUTTON_POPOVER_PROPS: MenuButtonProps['popover'] = {
  constrainSize: true,
  fallbackPlacements: ['bottom-end'],
  placement: 'bottom-end',
  portal: true,
}

const StyledMenu = styled(Menu)`
  width: 220px;
`

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

  const {t} = useTranslation(tasksLocaleNamespace)

  if (!draftTasks.length) return null

  return (
    <MenuButton
      button={<Button text={t('buttons.draft.text')} mode="ghost" iconRight={ChevronDownIcon} />}
      id="edit-task-menu"
      menu={
        <StyledMenu>
          <Box padding={3}>
            <Text size={1} weight="semibold">
              {t('panel.drafts.title')}
            </Text>
          </Box>

          <MenuDivider />

          {draftTasks?.map((task) => {
            return (
              <TasksDraftsMenuItem
                key={task._id}
                isSelected={selectedTask === task._id}
                item={task}
                onSelect={handleSelectTask}
              />
            )
          })}
        </StyledMenu>
      }
      popover={MENU_BUTTON_POPOVER_PROPS}
    />
  )
}
