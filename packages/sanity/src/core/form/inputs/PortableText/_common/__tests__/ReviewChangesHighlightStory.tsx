import {Card, Text} from '@sanity/ui'
import {VStack} from 'ui5'

import {TestWrapper} from '../../../../../../../test/browser/TestWrapper'
import {ReviewChangesHighlightBlock} from '../ReviewChangesHighlightBlock'

function HighlightSample(props: {fullScreen: boolean}) {
  return (
    <div style={{minHeight: 72, padding: 16, position: 'relative'}}>
      <Text size={1}>A portable text paragraph used as a review-changes fixture.</Text>
      <ReviewChangesHighlightBlock $fullScreen={props.fullScreen} />
    </div>
  )
}

/**
 * Chromatic sentinel for the Portable Text review-changes overlay after
 * the Sanity UI theme radius / space / spot.yellow read. Default vs
 * fullscreen left inset — a mix TypeScript will not catch. Fixture copy
 * only; no editor, no live timestamps.
 */
export function ReviewChangesHighlightStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4} style={{maxWidth: 480}}>
        <VStack gap={5}>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              default
            </Text>
            <HighlightSample fullScreen={false} />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              fullscreen
            </Text>
            <HighlightSample fullScreen />
          </VStack>
        </VStack>
      </Card>
    </TestWrapper>
  )
}
