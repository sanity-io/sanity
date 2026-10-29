import {Card} from '@sanity/ui'
import {SingleDocReleaseEnabledContext} from 'sanity/_singletons'
import {Text, Flex, VStack} from 'ui5'

import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {singleDocReleaseUsEnglishLocaleBundle} from '../../../../singleDocRelease/i18n'
import {ScheduledDraftsEmptyState} from '../ScheduledDraftsEmptyState'

const ENABLED = {enabled: true, mode: 'default'} as const

/**
 * Chromatic sentinel for the scheduled-drafts empty state after the ui5
 * Flex/Text migration. Centered illustration, heading, muted copy and the
 * docs-link ghost button all depend on Flex gap/alignment — a spacing drift
 * TypeScript will not catch. Illustration is inline SVG (no network). Shared
 * with Storybook via a thin CSF wrapper.
 */
export function ScheduledDraftsEmptyStateStory() {
  return (
    <TestWrapper i18nBundles={[singleDocReleaseUsEnglishLocaleBundle]} schemaTypes={[]}>
      <SingleDocReleaseEnabledContext value={ENABLED}>
        <Card padding={4}>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              default mode
            </Text>
            <Flex justifyContent="center">
              <ScheduledDraftsEmptyState />
            </Flex>
          </VStack>
        </Card>
      </SingleDocReleaseEnabledContext>
    </TestWrapper>
  )
}
