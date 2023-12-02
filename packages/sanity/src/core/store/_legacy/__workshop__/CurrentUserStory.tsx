import React from 'react'
import {Box, Code, Text} from '@sanity/ui'
import {Button} from '../../../../ui'
import {useSource} from '../../../studio'

export default function CurrentUserStory() {
  const {currentUser} = useSource()

  return (
    <Box padding={4}>
      <Text size={1} weight="medium">
        <code>{`userStore.me`}</code>
      </Text>

      <Box hidden>
        <Button text="Subscribe" />
      </Box>

      <Box marginTop={3}>
        <Code language="json" size={1}>
          {JSON.stringify(currentUser, null, 2)}
        </Code>
      </Box>
    </Box>
  )
}
