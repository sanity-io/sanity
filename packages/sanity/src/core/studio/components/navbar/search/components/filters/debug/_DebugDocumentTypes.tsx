import {Card, Code, Stack, Text} from '@sanity/ui'
import React from 'react'
import {useAvailableDocumentTypes} from '../../../hooks/useAvailableDocumentTypes'

export function DebugDocumentTypes() {
  const selectedDocumentTypes = useAvailableDocumentTypes()

  return (
    <Card borderTop padding={4} tone="transparent">
      <Stack space={3}>
        <Text size={1} weight="semibold">
          Document types
        </Text>
        <Code muted size={1} style={{whiteSpace: 'normal'}}>
          {selectedDocumentTypes.length > 0 ? selectedDocumentTypes.join(', ') : '(All)'}
        </Code>
      </Stack>
    </Card>
  )
}
