import {Card, Code, Stack, Text} from '@sanity/ui'
import React from 'react'
import {useSearchState} from '../../../contexts/search/useSearchState'

export function DebugDocumentTypes() {
  const {
    state: {documentTypesNarrowed},
  } = useSearchState()

  return (
    <Card borderTop padding={4} tone="transparent">
      <Stack space={3}>
        <Text size={1} weight="semibold">
          Document types
        </Text>
        <Code muted size={1} style={{whiteSpace: 'normal'}}>
          {documentTypesNarrowed.length > 0 ? documentTypesNarrowed.join(', ') : '(All)'}
        </Code>
      </Stack>
    </Card>
  )
}
