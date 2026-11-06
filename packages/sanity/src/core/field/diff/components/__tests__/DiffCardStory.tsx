import {Card, Text} from '@sanity/ui'
import {VStack} from 'ui5'

import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {type AnnotationDetails} from '../../../types'
import {DiffCard} from '../DiffCard'

const ANNOTATION: AnnotationDetails = {
  author: 'pUserAda',
  timestamp: '2024-01-01T00:00:00.000Z',
}

/**
 * Chromatic sentinel for review-changes DiffCard while it still wraps
 * `@sanity/ui` Card: anonymous (null annotation) vs author colour, and the
 * `del` / `ins` text-decoration exception. Tooltips stay off so Chromatic
 * does not archive relative-time copy. `TestWrapper` supplies
 * `UserColorManager`.
 */
export function DiffCardStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4} style={{maxWidth: 420}}>
        <VStack gap={5}>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              no annotation
            </Text>
            <DiffCard disableHoverEffect>
              <Text size={1}>Unchanged title</Text>
            </DiffCard>
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              author colour
            </Text>
            <DiffCard annotation={ANNOTATION} disableHoverEffect>
              <Text size={1}>Edited title</Text>
            </DiffCard>
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              removed (del)
            </Text>
            <DiffCard as="del" annotation={ANNOTATION} disableHoverEffect>
              <Text size={1}>Previous title</Text>
            </DiffCard>
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              added (ins)
            </Text>
            <DiffCard as="ins" annotation={ANNOTATION} disableHoverEffect>
              <Text size={1}>Current title</Text>
            </DiffCard>
          </VStack>
        </VStack>
      </Card>
    </TestWrapper>
  )
}
