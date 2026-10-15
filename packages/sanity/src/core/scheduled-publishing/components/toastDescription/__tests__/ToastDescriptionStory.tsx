import {Card, Text} from '@sanity/ui'
import {VStack} from 'ui5'

import ToastDescription from '../ToastDescription'

/**
 * Chromatic sentinel for the scheduled-publishing toast body after the ui5
 * Flex migration. Title-only and title+body pin CalendarIcon alignment,
 * column gap, and the semibold title / body size pairing — a mix TypeScript
 * will not catch. Copy is fixture only (no live toast, no timestamps).
 */
export function ToastDescriptionStory() {
  return (
    <Card padding={4} style={{maxWidth: 360}}>
      <VStack gap={5}>
        <VStack gap={2}>
          <Text muted size={1} weight="medium">
            title only
          </Text>
          <ToastDescription title="Document scheduled" />
        </VStack>
        <VStack gap={2}>
          <Text muted size={1} weight="medium">
            title and body
          </Text>
          <ToastDescription
            body="Any edits in the meantime will be added to the scheduled document."
            title="Document scheduled"
          />
        </VStack>
      </VStack>
    </Card>
  )
}
