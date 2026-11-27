import {Card} from '@sanity/ui'
import {Text, VStack} from 'ui5'

import {NormalBlock} from '../NormalBlock'

const LONG_URL =
  'https://example.com/a-very-long-unbroken-path-that-must-wrap-inside-the-comment-editor-column'

/**
 * Chromatic sentinel for comments-v2 Portable Text normal blocks after the
 * panda `word-break` class replaced the styled Text wrapper. A narrow column
 * so an unbroken URL actually wraps — TypeScript will not catch a missing
 * break. Fixture copy; no live comments.
 */
export function NormalBlockStory() {
  return (
    <Card padding={4} style={{maxWidth: 280}}>
      <VStack gap={5}>
        <VStack gap={2}>
          <Text muted size={1} weight="medium" as="div" trim={true}>
            short
          </Text>
          <NormalBlock>Hello from a comment</NormalBlock>
        </VStack>
        <VStack gap={2}>
          <Text muted size={1} weight="medium" as="div" trim={true}>
            wrapping url
          </Text>
          <NormalBlock>{LONG_URL}</NormalBlock>
        </VStack>
      </VStack>
    </Card>
  )
}
