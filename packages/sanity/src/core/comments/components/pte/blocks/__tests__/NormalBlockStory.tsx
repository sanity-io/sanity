import {Card} from '@sanity/ui'
import {Text, VStack} from 'ui5'

import {NormalBlock} from '../NormalBlock'

const LONG_URL =
  'https://example.com/a-very-long-unbroken-path-that-must-wrap-inside-the-comment-editor-column'

/**
 * Chromatic sentinel for comments-v1 Portable Text normal blocks: styled
 * ui5 Text with `word-break: break-word` and `forwardedAs="div"`. Pair with
 * the v2 panda class story so a primitive swap that drops the break (or the
 * div forwarding) is visible. Fixture copy; no live comments.
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
