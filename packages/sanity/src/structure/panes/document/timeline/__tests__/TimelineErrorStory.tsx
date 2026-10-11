import {Card, Text} from '@sanity/ui'
import {VStack} from 'ui5'

import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {TimelineError} from '../TimelineError'

/**
 * Chromatic sentinel for review-changes timeline error chrome after the
 * ui5 Flex migration. Critical icon + stacked title/body depend on Flex
 * gap against TextWithTone — a mix TypeScript will not catch. Copy comes
 * from the studio locale bundle (no live timeline).
 */
export function TimelineErrorStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4} style={{maxWidth: 420}}>
        <VStack gap={5}>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              load changes
            </Text>
            <TimelineError />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              load version changes
            </Text>
            <TimelineError versionError />
          </VStack>
        </VStack>
      </Card>
    </TestWrapper>
  )
}
