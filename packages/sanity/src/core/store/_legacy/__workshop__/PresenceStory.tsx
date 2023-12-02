import {Box, Code, Text} from '@sanity/ui'
import React, {useEffect, useState} from 'react'
import {usePresenceStore} from '../datastores'
import {GlobalPresence} from '../presence'

export default function PresenceStory() {
  const presenceStore = usePresenceStore()
  const [globalPresence, setGlobalPresence] = useState<GlobalPresence[] | null>(null)

  useEffect(() => {
    const sub = presenceStore.globalPresence$.subscribe(setGlobalPresence)

    return () => sub.unsubscribe()
  }, [presenceStore])

  return (
    <Box padding={4}>
      <Text size={1} weight="medium">
        <code>{`presenceStore.globalPresence$`}</code>
      </Text>

      <Box marginTop={3}>
        <Code language="json" size={1}>
          {JSON.stringify(globalPresence, null, 2)}
        </Code>
      </Box>
    </Box>
  )
}
