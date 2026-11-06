import {Card} from '@sanity/ui'
import {Text, VStack} from 'ui5'

import {TestWrapper} from '../../../../../../../test/browser/TestWrapper'
import {NoImagePreview} from '../ImagePreview'

/**
 * Chromatic sentinel for the empty-image placeholder in review-changes
 * (`NoImagePreview`): ui5 Flex centering inside a transparent Card, plus
 * the studio locale “(no image)” copy. The loaded-asset / hotspot path
 * needs a live image URL and is not snapshotted here.
 */
export function ImagePreviewStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4} style={{maxWidth: 360, minHeight: 160}}>
        <VStack gap={2}>
          <Text muted size={1} weight="medium" as="div" trim={true}>
            no image
          </Text>
          <NoImagePreview />
        </VStack>
      </Card>
    </TestWrapper>
  )
}
