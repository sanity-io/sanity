import {TrashIcon} from '@sanity/icons'
import {useTelemetry} from '@sanity/telemetry/react'
import {Box, Flex, Switch, Text, useToast} from '@sanity/ui'
import {useCallback, useState} from 'react'
import {type ObjectInputProps, set, useTranslation} from 'sanity'

import {Button} from '../../../../../../ui-components'
import {TaskCreated} from '../../../../../__telemetry__/tasks.telemetry'
import {tasksLocaleNamespace} from '../../../../../i18n'
import {useTasksNavigation} from '../../../context'
import {useRemoveTask} from '../../../hooks/useRemoveTask'
import {type TaskDocument} from '../../../types'
import {getMentionedUsers} from '../utils'

const getTaskSubscribers = (task: TaskDocument): string[] => {
  const subscribers = task.subscribers || []

  getMentionedUsers(task.description).forEach((user) => {
    if (!subscribers.includes(user)) subscribers.push(user)
  })

  // Check if the task has been assigned, add the assignee to the subscribers list.
  if (task.assignedTo) {
    if (!subscribers.includes(task.assignedTo)) {
      subscribers.push(task.assignedTo)
    }
  }
  return subscribers
}
export function FormCreate(props: ObjectInputProps) {
  const {onChange} = props
  const {
    setViewMode,
    setActiveTab,
    state: {viewMode},
  } = useTasksNavigation()
  const toast = useToast()
  const telemetry = useTelemetry()

  const [createMore, setCreateMore] = useState(false)
  const handleCreateMore = useCallback(() => setCreateMore((p) => !p), [])

  const value = props.value as TaskDocument
  const onRemove = useCallback(() => {
    setViewMode({type: 'list'})
  }, [setViewMode])
  const {handleRemove, removeStatus} = useRemoveTask({id: value._id, onRemoved: onRemove})
  const {t} = useTranslation(tasksLocaleNamespace)
  const handleCreate = useCallback(() => {
    if (!value?.title) {
      toast.push({
        closable: true,
        status: 'error',
        title: t('form.status.error.title-required'),
      })
      return
    }
    onChange([
      set(getTaskSubscribers(value), ['subscribers']),
      set(new Date().toISOString(), ['createdByUser']),
    ])

    if (createMore) {
      setViewMode({type: 'create'})
    } else {
      setActiveTab('subscribed')
    }

    telemetry.log(TaskCreated)

    toast.push({
      closable: true,
      status: 'success',
      title: t('form.status.success'),
    })
  }, [value, onChange, createMore, telemetry, toast, t, setViewMode, setActiveTab])

  return (
    <>
      {props.renderDefault(props)}

      <Box paddingY={5}>
        <Flex paddingTop={1} gap={4}>
          {value._rev && (
            <Button
              onClick={handleRemove}
              mode="bleed"
              icon={TrashIcon}
              tooltipProps={{
                content: t('buttons.discard.text'),
              }}
              disabled={removeStatus === 'loading'}
              loading={removeStatus === 'loading'}
            />
          )}

          <Flex align="center" gap={2} justify={'flex-end'} flex={1}>
            <Switch onChange={handleCreateMore} checked={createMore} />
            <Text size={1} muted>
              {t('form.input.create-more.text')}
            </Text>
          </Flex>

          <Button text={t('buttons.create.text')} onClick={handleCreate} />
        </Flex>
      </Box>
    </>
  )
}
