import {Card, Text} from '@sanity/ui'
import {VStack} from 'ui5'

import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {CommentInlineHighlightSpan} from '../CommentInlineHighlightSpan'

/**
 * Chromatic sentinel for comments-v2 inline highlight hues after theme /
 * ui5 color work. Added, nested, hovered and authoring states pin
 * background + 2px underline — a mix TypeScript will not catch. Fixture
 * copy only; no live comments, no fade-in.
 */
export function CommentInlineHighlightStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4} style={{maxWidth: 420}}>
        <VStack gap={5}>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              idle
            </Text>
            <Text size={1}>
              A paragraph with{' '}
              <CommentInlineHighlightSpan>unmarked text</CommentInlineHighlightSpan> and no state.
            </Text>
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              added
            </Text>
            <Text size={1}>
              A paragraph with{' '}
              <CommentInlineHighlightSpan isAdded>an added comment</CommentInlineHighlightSpan> on
              this span.
            </Text>
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              added nested
            </Text>
            <Text size={1}>
              A paragraph with{' '}
              <CommentInlineHighlightSpan isAdded isNested>
                a nested comment
              </CommentInlineHighlightSpan>{' '}
              on this span.
            </Text>
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              added hovered
            </Text>
            <Text size={1}>
              A paragraph with{' '}
              <CommentInlineHighlightSpan isAdded isHovered>
                a hovered comment
              </CommentInlineHighlightSpan>{' '}
              on this span.
            </Text>
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              authoring
            </Text>
            <Text size={1}>
              A paragraph with{' '}
              <CommentInlineHighlightSpan isAuthoring>
                an in-progress comment
              </CommentInlineHighlightSpan>{' '}
              on this span.
            </Text>
          </VStack>
        </VStack>
      </Card>
    </TestWrapper>
  )
}
