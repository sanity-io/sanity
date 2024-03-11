import {ChevronDownIcon} from '@sanity/icons'
import {Flex, Menu, MenuDivider, Text} from '@sanity/ui'
import {useCallback, useMemo} from 'react'
import {useCurrentUser} from 'sanity'

import {Button, MenuButton, MenuItem} from '../../../../../ui-components'
import {useTasks, useTasksNavigation} from '../../context'
import {type TaskDocument} from '../../types'

export function DraftsMenu() {
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
