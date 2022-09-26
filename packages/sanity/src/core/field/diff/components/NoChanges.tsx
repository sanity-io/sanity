import {Stack, Text} from '@sanity/ui'
import React from 'react'

export function NoChanges() {
  return (
    <Stack space={3}>
      <Text size={1} weight="semibold" as="h3">
        There are no changes
      </Text>
      <Text as="p" size={1} muted>
        Edit the document or select an older version in the timeline to see a list of changes appear
        in this panel.
      </Text>
    </Stack>
  )
}
