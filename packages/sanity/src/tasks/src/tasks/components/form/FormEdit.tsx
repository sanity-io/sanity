import {CopyIcon, LinkIcon, TrashIcon} from '@sanity/icons'
import {Box, Flex, Menu, MenuDivider} from '@sanity/ui'
import {useCallback} from 'react'
import {
  ContextMenuButton,
  type FormPatch,
  LoadingBlock,
  type ObjectInputProps,
  type PatchEvent,
  type PortableTextBlock,
  set,
  TransformPatches,
  useCurrentUser,
} from 'sanity'
import styled from 'styled-components'

import {MenuButton, MenuItem} from '../../../../../ui-components'
import {useTasksNavigation} from '../../context'
import {useRemoveTask} from '../../hooks/useRemoveTask'
import {type TaskDocument} from '../../types'
import {ActivityLog} from '../activityLog'
import {AssigneeEditFormField} from './mentionUser/AssigneeEditFormField'
import {RemoveTaskDialog} from './RemoveTaskDialog'
import {StatusSelector} from './StatusSelector'
import {Title} from './TitleField'
import {getMentionedUsers} from './utils'

const FirstRow = styled(Flex)``

function FormActionsMenu({id, value}: {id: string; value: TaskDocument}) {
  const {setViewMode} = useTasksNavigation()
  const onTaskRemoved = useCallback(() => {
    setViewMode({type: 'list'})
  }, [setViewMode])
  const removeTask = useRemoveTask({id, onRemoved: onTaskRemoved})

  const duplicateTask = useCallback(() => {
    setViewMode({type: 'duplicate', duplicateTaskValues: value})
  }, [setViewMode, value])

  return (
    <>
      <Box paddingTop={3}>
        <MenuButton
          id="edit-task-menu"
          button={<ContextMenuButton />}
          menu={
            <Menu>
              <MenuItem text="Duplicate task" icon={CopyIcon} onClick={duplicateTask} />
              <MenuItem
                text="Copy link to task"
                icon={LinkIcon}
                disabled // TODO: This is not yet implemented
              />
              <MenuDivider />
              <MenuItem
                text="Delete task"
                icon={TrashIcon}
                onClick={removeTask.handleOpenDialog}
                tone="critical"
              />
            </Menu>
          }
        />
      </Box>
      <RemoveTaskDialog {...removeTask} />
    </>
  )
}

function FormEditInner(props: ObjectInputProps) {
  const statusField = props.schemaType.fields.find((f) => f.name === 'status')
  const value = props.value as TaskDocument
  const currentUser = useCurrentUser()
  const handleChangeAndSubscribe = useCallback(
    (patch: FormPatch | PatchEvent | FormPatch[]) => {
      const subscribers = value.subscribers || []
      props.onChange(patch)
      if (!currentUser) return
      if (!subscribers.includes(currentUser.id)) {
        props.onChange(set([...subscribers, currentUser.id], ['subscribers']))
      }
    },
    [currentUser, props, value.subscribers],
  )
  if (!statusField) {
    throw new Error('Status field not found')
  }
  if (!props.value?._id) {
    return <LoadingBlock />
  }

  return (
    <>
      <Flex align="flex-start" gap={3}>
        <div style={{flex: 1}}>
          <Title
            onChange={handleChangeAndSubscribe}
            value={props.value?.title}
            path={['title']}
            placeholder="Task title"
          />
        </div>
        <FormActionsMenu id={props.value?._id} value={value} />
      </Flex>
      <FirstRow paddingY={3} gap={2} align="flex-start" justify="flex-start">
        <StatusSelector
          value={props.value?.status}
          path={['status']}
          onChange={handleChangeAndSubscribe}
          options={statusField.type.options.list}
        />
        <AssigneeEditFormField
          value={props.value?.assignedTo}
          onChange={handleChangeAndSubscribe}
          path={['assignedTo']}
        />
      </FirstRow>
      {props.renderDefault(props)}
      <ActivityLog value={value} onChange={props.onChange} path={['subscribers']} />
    </>
  )
}

export function FormEdit(props: ObjectInputProps) {
  const value = props.value as TaskDocument
  const currentUser = useCurrentUser()

  const transformPatches = useCallback(
    (patches: FormPatch[]) => {
      if (!currentUser) return patches
      if (patches.some((patch) => patch.path[0] === 'subscribers')) {
        return patches
      }

      const subscribers = value.subscribers || []
      const newSubscribers = [...subscribers]

      // If the assignee field is changing, we should subscribe the new assignee to the task.
      const changeAssigneePatch = patches.find((patch) => patch.path[0] === 'assignedTo')
      if (
        changeAssigneePatch &&
        changeAssigneePatch.type === 'set' &&
        typeof changeAssigneePatch.value === 'string' &&
        !newSubscribers.includes(changeAssigneePatch.value)
      ) {
        newSubscribers.push(changeAssigneePatch.value)
      }

      // When the user edits the form it should be subscribed to it, unless he is changing the subscribers list.
      if (!newSubscribers.includes(currentUser.id)) {
        newSubscribers.push(currentUser.id)
      }

      // Check if the description field changed, and new mentions have been added.
      const changedDescriptionPatch = patches.find(
        (patch) => patch.path[0] === 'description' && patch.type === 'set',
      )
      if (changedDescriptionPatch) {
        const prevMentionedUser = getMentionedUsers(value.description)
        const newDescription =
          changedDescriptionPatch.type === 'set'
            ? (changedDescriptionPatch.value as PortableTextBlock[] | undefined)
            : undefined

        const newMentionedUser = getMentionedUsers(newDescription)

        const diff = newMentionedUser.filter((user) => !prevMentionedUser.includes(user))
        diff.forEach((user) => {
          if (!newSubscribers.includes(user)) {
            newSubscribers.push(user)
          }
        })
      }

      // If the subscribers list has changed, we should update the subscribers list.
      if (newSubscribers.length !== subscribers.length) {
        patches.push(set(newSubscribers, ['subscribers']))
      }

      return patches
    },
    [currentUser, value.subscribers, value.description],
  )

  return (
    <TransformPatches transform={transformPatches}>
      <FormEditInner {...props} />
    </TransformPatches>
  )
}
