import {Box, Flex, Switch, Text} from '@sanity/ui'
import {useCallback, useState} from 'react'
import {type ObjectInputProps} from 'sanity'

import {Button} from '../../../../../ui-components'
import {useTasksNavigation} from '../../context'
import {type TaskDocument} from '../../types'

export function FormCreate(props: ObjectInputProps<TaskDocument>) {
  const [createMore, setCreateMore] = useState(false)
  const {setViewMode, setActiveTabId} = useTasksNavigation()

  const handleCreate = useCallback(() => {
    setViewMode('list')
    setActiveTabId('subscribed')
  }, [setViewMode, setActiveTabId])

  const handleCreateMore = useCallback(() => setCreateMore((p) => !p), [])

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
