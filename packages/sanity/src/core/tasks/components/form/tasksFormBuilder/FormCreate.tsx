import {TrashIcon} from '@sanity/icons'
import {useTelemetry} from '@sanity/telemetry/react'
import {Box, Flex, Switch, Text, useToast} from '@sanity/ui'
import {useCallback, useEffect, useState} from 'react'
import {useEffectEvent} from 'use-effect-event'

import {Button} from '../../../../../ui-components'
import {type ObjectInputProps, set} from '../../../../form'
import {useTranslation} from '../../../../i18n'
import {TaskCreated} from '../../../__telemetry__/tasks.telemetry'
import {useTasks, useTasksNavigation} from '../../../context'
import {useRemoveTask} from '../../../hooks'
import {tasksLocaleNamespace} from '../../../i18n'
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
  const [creating, setCreating] = useState(false)
  const {onChange} = props
  const {setViewMode, setActiveTab} = useTasksNavigation()
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
  const {data} = useTasks()
  const savedTask = data.find((task) => task._id === value._id)

  const handleCreatingSuccess = useEffectEvent(() => {
    telemetry.log(TaskCreated)
    toast.push({
      closable: true,
      status: 'success',
      title: t('form.status.success'),
    })

    setCreating(false)
    if (createMore) {
      setViewMode({type: 'create'})
    } else {
      setActiveTab('subscribed')
    }
  })
  useEffect(() => {
    // This useEffect takes care of closing the form when a task entered the "creation" state.
    // That action is async and we don't have access to the promise, once the value is updated in the form we will close the form.
    if (creating && savedTask?.createdByUser) {
      handleCreatingSuccess()
    }
  }, [creating, savedTask?.createdByUser])

  const handleCreatingTimeout = useEffectEvent(() => {
    setCreating(false)
    toast.push({
      closable: true,
      status: 'error',
      title: t('form.status.error.creation-failed'),
    })
  })
  useEffect(() => {
    // If after 10 seconds the task is still in the "creating" state, show an error and reset the creating state.
    let timeoutId: ReturnType<typeof setTimeout> | null = null
    if (creating) {
      timeoutId = setTimeout(() => handleCreatingTimeout(), 10000)
    }
    // Cleanup function to clear the timeout
    return () => {
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [creating])

  const handleCreate = useCallback(async () => {
    setCreating(true)
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
  }, [value, onChange, t, toast])

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

          <Button
            text={t('buttons.create.text')}
            onClick={handleCreate}
            disabled={creating}
            loading={creating}
          />
        </Flex>
      </Box>
    </>
  )
}
