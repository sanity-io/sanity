import {Card, Code, Stack} from '@sanity/ui'
import React from 'react'
import {useSearchState} from '../../../contexts/search/useSearchState'

export function DebugFilterQuery() {
  const {
    state: {
      terms: {filter},
    },
  } = useSearchState()

  if (!filter) {
    return null
  }

  return (
    <Card padding={4} tone="transparent">
      <Stack space={3}>
        <Code size={1} weight="semibold">
          Filter
        </Code>
        {filter && (
          <Code size={1} style={{whiteSpace: 'normal'}}>
            {filter}
          </Code>
        )}
      </Stack>
    </Card>
  )
}
