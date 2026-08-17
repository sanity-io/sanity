import {Card, Stack, Text} from '@sanity/ui'

import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {activeCardinalityOneRelease} from '../../../__fixtures__/release.fixture'
import {ConfirmActiveScheduledDraftsBanner} from '../ConfirmActiveScheduledDraftsBanner'
import {DraftsDisabledBanner} from '../DraftsDisabledBanner'
import {ReleaseNotFoundBanner} from '../ReleaseNotFoundBanner'

/**
 * Chromatic sentinel for release overview caution banners (ui5 Box wrapping
 * Card tone). Shared with Storybook via a thin CSF wrapper.
 */
export function ReleaseBannersStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4}>
        <Stack gap={5}>
          <Stack gap={2}>
            <Text muted size={1} weight="medium">
              not found
            </Text>
            <ReleaseNotFoundBanner onDismiss={() => null} />
          </Stack>
          <Stack gap={2}>
            <Text muted size={1} weight="medium">
              drafts mode disabled
            </Text>
            <DraftsDisabledBanner
              allReleases={[activeCardinalityOneRelease]}
              isDraftModelEnabled={false}
              isScheduledDraftsEnabled
            />
          </Stack>
          <Stack gap={2}>
            <Text muted size={1} weight="medium">
              scheduled drafts disabled
            </Text>
            <DraftsDisabledBanner
              allReleases={[activeCardinalityOneRelease]}
              isDraftModelEnabled
              isScheduledDraftsEnabled={false}
            />
          </Stack>
          <Stack gap={2}>
            <Text muted size={1} weight="medium">
              confirm active scheduled drafts
            </Text>
            <ConfirmActiveScheduledDraftsBanner
              hasDateFilter={false}
              onNavigateToPaused={() => null}
              releaseGroupMode="active"
              releases={[activeCardinalityOneRelease]}
            />
          </Stack>
        </Stack>
      </Card>
    </TestWrapper>
  )
}
