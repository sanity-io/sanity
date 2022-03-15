import {CurrentUser} from '@sanity/types'
import {Box, Button, Code, Text} from '@sanity/ui'
import React, {useEffect, useState} from 'react'
import {useDatastores} from '../useDatastores'

export default function CurrentUserStory() {
  const {userStore} = useDatastores()
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)

  useEffect(() => {
    const sub = userStore.me.subscribe(setCurrentUser)

    return () => sub.unsubscribe()
  }, [userStore])

  return (
    <Box padding={4}>
      <Text size={1} weight="semibold">
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
