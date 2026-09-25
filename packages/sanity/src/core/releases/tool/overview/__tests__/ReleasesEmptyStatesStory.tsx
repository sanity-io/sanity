import {Card, Text} from '@sanity/ui'
import {VStack} from 'ui5'

import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {Button} from '../../../../../ui-components/button/Button'
import {singleDocReleaseUsEnglishLocaleBundle} from '../../../../singleDocRelease/i18n'
import {releasesUsEnglishLocaleBundle} from '../../../i18n'
import {ReleasesEmptyState} from '../ReleasesEmptyState'
import {ScheduledDraftsEmptyState} from '../ScheduledDraftsEmptyState'

const FRAME_STYLE = {height: 320}

/**
 * Chromatic sentinel for releases overview empty states after the ui5 Flex
 * migration. Illustration, stacked title/body, and ghost documentation
 * button all depend on Flex centering — a mix TypeScript will not catch.
 * Copy comes from the releases and scheduled-drafts locale bundles.
 */
export function ReleasesEmptyStatesStory() {
  return (
    <TestWrapper
      i18nBundles={[releasesUsEnglishLocaleBundle, singleDocReleaseUsEnglishLocaleBundle]}
      schemaTypes={[]}
    >
      <Card padding={4}>
        <VStack gap={5}>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              no releases
            </Text>
            <div style={FRAME_STYLE}>
              <ReleasesEmptyState createReleaseButton={<Button text="Create release" />} />
            </div>
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              no scheduled drafts
            </Text>
            <div style={FRAME_STYLE}>
              <ScheduledDraftsEmptyState />
            </div>
          </VStack>
        </VStack>
      </Card>
    </TestWrapper>
  )
}
