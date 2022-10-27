import {Card, Code, Stack, Text} from '@sanity/ui'
import React from 'react'
import {useSelectedDocumentTypes} from '../../hooks/useSelectedDocumentTypes'

export function DebugDocumentTypes() {
  const selectedDocumentTypes = useSelectedDocumentTypes()

  if (selectedDocumentTypes.length === 0) {
    return null
  }

  return (
    <Card borderTop padding={4} tone="transparent">
      <Stack space={3}>
        <Text size={1} weight="semibold">
          Document types (selected + from active filters)
        </Text>
        <Code muted size={1}>
          {selectedDocumentTypes.join(', ')}
        </Code>
      </Stack>
    </Card>
  )
}
