import {Card, Text} from '@sanity/ui'
import {VStack} from 'ui5'

import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {ReleaseTitle} from '../ReleaseTitle'

const SHORT_TITLE = 'Spring launch'
const FALLBACK_TITLE = 'Untitled release'
const LONG_TITLE = 'Autumn product launch with extra campaign details here'

/**
 * Chromatic sentinel for ReleaseTitle after the ui5 Box migration: short
 * titles, fallback when the title is missing, and the 50-character
 * truncation path (tooltip closed). Fixture copy only — no live release
 * documents. Shared with Storybook via a thin CSF wrapper.
 */
export function ReleaseTitleStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4} style={{maxWidth: 420}}>
        <VStack gap={5}>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              short title
            </Text>
            <ReleaseTitle fallback={FALLBACK_TITLE} title={SHORT_TITLE} />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              missing title uses fallback
            </Text>
            <ReleaseTitle fallback={FALLBACK_TITLE} title={undefined} />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              empty title uses fallback
            </Text>
            <ReleaseTitle fallback={FALLBACK_TITLE} title="" />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              truncated, tooltip closed
            </Text>
            <ReleaseTitle fallback={FALLBACK_TITLE} title={LONG_TITLE} />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              truncated, tooltip disabled
            </Text>
            <ReleaseTitle enableTooltip={false} fallback={FALLBACK_TITLE} title={LONG_TITLE} />
          </VStack>
        </VStack>
      </Card>
    </TestWrapper>
  )
}
