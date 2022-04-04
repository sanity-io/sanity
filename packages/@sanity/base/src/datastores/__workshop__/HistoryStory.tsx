import {SanityDocument} from '@sanity/types'
import {Box, Code, Text} from '@sanity/ui'
import React, {useEffect, useState} from 'react'
import {useHistoryStore} from '../datastores'

const SECOND = 1000
const MINUTE = SECOND * 60
const HOUR = MINUTE * 60
const DAY = HOUR * 24

export default function HistoryStory() {
  const historyStore = useHistoryStore()
  const [history, setHistory] = useState<{documents: SanityDocument[]} | null>(null)

  useEffect(() => {
    // The time at which to view the document’s value
    const time = new Date(Date.now() - DAY).toISOString()

    historyStore.getHistory(['drafts.test', 'test'], {time}).then(setHistory)
  }, [historyStore])

  return (
    <Box padding={4}>
      <Text size={1} weight="semibold">
        <code>{`historyStore.getHistory`}</code>
      </Text>

      <Box marginTop={3}>
        <Code language="json" size={1}>
          {JSON.stringify(history, null, 2)}
        </Code>
      </Box>
    </Box>
  )
}
