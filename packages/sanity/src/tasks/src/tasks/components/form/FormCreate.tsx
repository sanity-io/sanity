import {Box, Flex, Switch, Text, useToast} from '@sanity/ui'
import {useCallback, useState} from 'react'
import {type ObjectInputProps, set} from 'sanity'

import {Button} from '../../../../../ui-components'
import {useTasksNavigation} from '../../context'
import {type TaskDocument} from '../../types'

export function FormCreate(props: ObjectInputProps<TaskDocument>) {
  const [createMore, setCreateMore] = useState(false)
  const {setViewMode, setActiveTab} = useTasksNavigation()
  const toast = useToast()
  const handleCreateMore = useCallback(() => setCreateMore((p) => !p), [])
  const {onChange, value} = props
  const title = value?.title

  const handleCreate = useCallback(() => {
    if (!title) {
      toast.push({
        closable: true,
        status: 'error',
        title: 'Title is required',
      })
      return
    }
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
  }, [setViewMode, setActiveTab, onChange, createMore, toast, title])

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
