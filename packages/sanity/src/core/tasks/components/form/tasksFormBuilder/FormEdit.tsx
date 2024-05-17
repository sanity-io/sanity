import {CopyIcon, LinkIcon, TrashIcon} from '@sanity/icons'
import {useTelemetry} from '@sanity/telemetry/react'
import {type PortableTextBlock} from '@sanity/types'
import {Box, Card, Flex, Menu, MenuDivider, Stack} from '@sanity/ui'
// eslint-disable-next-line camelcase
import {getTheme_v2} from '@sanity/ui/theme'
import {useCallback} from 'react'
import {css, styled} from 'styled-components'

import {MenuButton, MenuItem, TooltipDelayGroupProvider} from '../../../../../ui-components'
import {CommentsProvider} from '../../../../comments'
import {ContextMenuButton, LoadingBlock} from '../../../../components'
import {
  type FormPatch,
  type ObjectInputProps,
  type PatchEvent,
  set,
  TransformPatches,
} from '../../../../form'
import {useTranslation} from '../../../../i18n'
import {useCurrentUser} from '../../../../store'
import {TaskDuplicated, TaskRemoved} from '../../../__telemetry__/tasks.telemetry'
import {useTasksEnabled, useTasksNavigation} from '../../../context'
import {useActivityLog, useRemoveTask} from '../../../hooks'
import {tasksLocaleNamespace} from '../../../i18n'
import {type TaskDocument} from '../../../types'
import {TasksActivityLog} from '../../activity'
import {CurrentWorkspaceProvider} from '../CurrentWorkspaceProvider'
import {AssigneeEditFormField, DateEditFormField, StatusSelector, Title} from '../fields'
import {RemoveTaskDialog} from '../RemoveTaskDialog'
import {getMentionedUsers} from '../utils'

const FirstRow = styled(Flex)((props) => {
  const theme = getTheme_v2(props.theme)
  return css`
    column-gap: ${theme.space[2]}px;
    row-gap: ${theme.space[3]}px;
  `
})

function FormActionsMenu({id, value}: {id: string; value: TaskDocument}) {
  const {setViewMode, handleCopyLinkToTask} = useTasksNavigation()
  const {mode} = useTasksEnabled()
  const telemetry = useTelemetry()

  const onTaskRemoved = useCallback(() => {
    setViewMode({type: 'list'})
    telemetry.log(TaskRemoved)
  }, [setViewMode, telemetry])
  const removeTask = useRemoveTask({id, onRemoved: onTaskRemoved})

  const duplicateTask = useCallback(() => {
    setViewMode({type: 'duplicate', duplicateTaskValues: value})
    telemetry.log(TaskDuplicated)
  }, [setViewMode, telemetry, value])

  const {t} = useTranslation(tasksLocaleNamespace)

  return (
    <>
      <Box paddingTop={3}>
        <MenuButton
          id="edit-task-menu"
          button={<ContextMenuButton />}
          popover={{
            placement: 'bottom',
            fallbackPlacements: ['bottom-end', 'bottom-start'],
          }}
          menu={
            <Menu>
              <MenuItem
                text={t('menuitem.duplicate.text')}
                icon={CopyIcon}
                onClick={duplicateTask}
                tooltipProps={
                  mode === 'upsell' ? {content: t('menuitem.duplicate.upsell-tooltip')} : undefined
                }
                disabled={mode === 'upsell'}
              />
              <MenuItem
                text={t('menuitem.copylink.text')}
                icon={LinkIcon}
                onClick={handleCopyLinkToTask}
              />
              <MenuDivider />
              <MenuItem
                text={t('menuitem.delete.text')}
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
  const {t} = useTranslation(tasksLocaleNamespace)
  const activityData = useActivityLog(value).changes
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
        <Stack flex={1}>
          <Title
            onChange={handleChangeAndSubscribe}
            value={props.value?.title}
            path={['title']}
            placeholder={t('form.input.title.placeholder')}
          />
        </Stack>
        <FormActionsMenu id={props.value?._id} value={value} />
      </Flex>

      <Card borderTop marginTop={3}>
        <FirstRow
          paddingBottom={3}
          paddingTop={4}
          align="flex-start"
          justify="flex-start"
          wrap="wrap"
        >
          <TooltipDelayGroupProvider>
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
            <DateEditFormField
              value={props.value?.dueBy}
              onChange={handleChangeAndSubscribe}
              path={['dueBy']}
            />
          </TooltipDelayGroupProvider>
        </FirstRow>
      </Card>

      {props.renderDefault(props)}
      <CommentsProvider
        documentId={value._id}
        documentType="tasks.task"
        sortOrder="asc"
        type="task"
      >
        <CurrentWorkspaceProvider>
          <Card borderTop paddingTop={4} marginTop={4} paddingBottom={6}>
            <TasksActivityLog
              value={value}
              onChange={props.onChange}
              path={['subscribers']}
              activityData={activityData}
            />
          </Card>
        </CurrentWorkspaceProvider>
      </CommentsProvider>
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
      if (
        patches.some((patch) => patch.path[0] === 'context' && patch.path[1] === 'notification')
      ) {
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
