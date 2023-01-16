import {Card, Code, Stack} from '@sanity/ui'
import React from 'react'
import {useSearchState} from '../../../contexts/search/useSearchState'

export function DebugDocumentTypesNarrowed() {
  const {
    state: {documentTypesNarrowed},
  } = useSearchState()

  return (
    <Card borderTop padding={4} tone="transparent">
      <Stack space={3}>
        <Code size={1} weight="semibold">
          Document types (narrowed)
        </Code>
        <Code muted size={1} style={{whiteSpace: 'normal'}}>
          {documentTypesNarrowed.length > 0 ? documentTypesNarrowed.join(', ') : '(All)'}
        </Code>
      </Stack>
    </Card>
  )
}
