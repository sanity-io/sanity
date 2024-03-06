import {Box, Flex, Switch, Text, useToast} from '@sanity/ui'
import {useCallback, useState} from 'react'
import {isPortableTextTextBlock, type ObjectInputProps, set} from 'sanity'

import {Button} from '../../../../../ui-components'
import {useTasksNavigation} from '../../context'
import {type TaskDocument} from '../../types'

const getTaskSubscribers = (task: TaskDocument): string[] => {
  const subscribers = task.subscribers || []
  // find in the description if we have any mentioned user, and add him to the subscribers list.
  task.description?.forEach((block) => {
    if (isPortableTextTextBlock(block)) {
      block.children.forEach((child) => {
        if (
          child._type === 'mention' &&
          typeof child.userId === 'string' &&
          !subscribers.includes(child.userId)
        ) {
          subscribers.push(child.userId)
        }
      })
    }
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
  const {setViewMode, setActiveTab} = useTasksNavigation()
  const toast = useToast()
  const handleCreateMore = useCallback(() => setCreateMore((p) => !p), [])
  const {onChange} = props
  const value = props.value as TaskDocument

  const handleCreate = useCallback(() => {
    if (!value?.title) {
      toast.push({
        closable: true,
        status: 'error',
        title: 'Title is required',
      })
      return
    }
    onChange(set(getTaskSubscribers(value), ['subscribers']))

    onChange(set(new Date().toISOString(), ['createdByUser']))
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
          <Flex align={'center'} gap={2}>
            <Switch onChange={handleCreateMore} checked={createMore} />
            <Text size={1} muted>
              Create more
            </Text>
          </Flex>
          <Button text="Create Task" onClick={handleCreate} />
        </Flex>
      </Box>
    </>
  )
}
