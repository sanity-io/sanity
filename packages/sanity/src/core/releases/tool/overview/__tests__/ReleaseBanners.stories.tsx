import {Card, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {VStack} from 'ui5'

import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {activeCardinalityOneRelease} from '../../../__fixtures__/release.fixture'
import {ConfirmActiveScheduledDraftsBanner} from '../ConfirmActiveScheduledDraftsBanner'
import {DraftsDisabledBanner} from '../DraftsDisabledBanner'
import {ReleaseNotFoundBanner} from '../ReleaseNotFoundBanner'

/**
 * Chromatic sentinel for release overview caution banners (ui5 Box wrapping
 * Card tone). Copy is static i18n (no timestamps).
 */
const meta = {
  title: 'Releases/Banners',
  component: ReleaseNotFoundBanner,
  decorators: [
    (Story) => (
      <TestWrapper schemaTypes={[]}>
        <Story />
      </TestWrapper>
    ),
  ],
} satisfies Meta<typeof ReleaseNotFoundBanner>

export default meta
type Story = StoryObj<typeof meta>

export const CautionBanners: Story = {
  args: {onDismiss: () => null},
  render: () => (
    <Card padding={4}>
      <VStack gap={5}>
        <VStack gap={2}>
          <Text muted size={1} weight="medium">
            not found
          </Text>
          <ReleaseNotFoundBanner onDismiss={() => null} />
        </VStack>
        <VStack gap={2}>
          <Text muted size={1} weight="medium">
            drafts mode disabled
          </Text>
          <DraftsDisabledBanner
            allReleases={[activeCardinalityOneRelease]}
            isDraftModelEnabled={false}
            isScheduledDraftsEnabled
          />
        </VStack>
        <VStack gap={2}>
          <Text muted size={1} weight="medium">
            scheduled drafts disabled
          </Text>
          <DraftsDisabledBanner
            allReleases={[activeCardinalityOneRelease]}
            isDraftModelEnabled
            isScheduledDraftsEnabled={false}
          />
        </VStack>
        <VStack gap={2}>
          <Text muted size={1} weight="medium">
            confirm active scheduled drafts
          </Text>
          <ConfirmActiveScheduledDraftsBanner
            hasDateFilter={false}
            onNavigateToPaused={() => null}
            releaseGroupMode="active"
            releases={[activeCardinalityOneRelease]}
          />
        </VStack>
      </VStack>
    </Card>
  ),
}
