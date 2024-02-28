import {Box, Flex, Switch, Text} from '@sanity/ui'
import {useState} from 'react'
import {type ObjectInputProps} from 'sanity'

import {Button} from '../../../../../ui-components'
import {type TaskDocument} from '../../types'

export function FormCreate(props: ObjectInputProps<TaskDocument>) {
  const [createMore, setCreateMore] = useState(false)
  return (
    <>
      {props.renderDefault(props)}
      <Box paddingTop={5}>
        <Flex justify={'flex-end'} paddingTop={1} gap={3}>
          <Flex align={'center'} gap={2}>
            <Switch onChange={() => setCreateMore((p) => !p)} checked={createMore} />
            <Text size={1} muted>
              Create more
            </Text>
          </Flex>
          <Button text="Create Task" />
        </Flex>
      </Box>
    </>
  )
}
