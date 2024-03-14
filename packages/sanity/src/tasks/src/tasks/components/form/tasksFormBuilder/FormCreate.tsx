import {Box, Flex, Switch, Text, useToast} from '@sanity/ui'
import {useCallback, useState} from 'react'
import {type ObjectInputProps, set} from 'sanity'

import {Button} from '../../../../../../ui-components'
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
  const [createMore, setCreateMore] = useState(false)
  const {
    setViewMode,
    setActiveTab,
    state: {viewMode},
  } = useTasksNavigation()

  const toast = useToast()
  const handleCreateMore = useCallback(() => setCreateMore((p) => !p), [])
  const {onChange} = props
  const value = props.value as TaskDocument
  const onRemove = useCallback(() => {
    setViewMode({type: 'list'})
  }, [setViewMode])
  const {handleRemove, removeStatus} = useRemoveTask({id: value._id, onRemoved: onRemove})

  const handleCreate = useCallback(() => {
    if (!value?.title) {
      toast.push({
        closable: true,
        status: 'error',
        title: 'Title is required',
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

    toast.push({
      closable: true,
      status: 'success',
      title: 'Task created',
    })
  }, [setViewMode, setActiveTab, onChange, createMore, toast, value])

  return (
    <>
      {props.renderDefault(props)}
      <Box paddingTop={5}>
        <Flex justify={'flex-end'} paddingTop={1} gap={3}>
          <Flex align={'center'} gap={2} style={{flexGrow: viewMode === 'draft' ? 1 : 0}}>
            <Switch onChange={handleCreateMore} checked={createMore} />
            <Text size={1} muted>
              Create more
            </Text>
          </Flex>
          {viewMode === 'draft' && (
            <Button
              text="Discard"
              onClick={handleRemove}
              mode="bleed"
              disabled={removeStatus === 'loading'}
              loading={removeStatus === 'loading'}
            />
          )}
          <Button text="Create Task" onClick={handleCreate} />
        </Flex>
      </Box>
    </>
  )
}
