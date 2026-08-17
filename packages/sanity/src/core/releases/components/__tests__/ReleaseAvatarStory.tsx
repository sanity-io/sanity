import {type BadgeTone, Card, Flex, Stack, Text} from '@sanity/ui'

import {
  activeASAPRelease,
  activeCardinalityOneRelease,
  activeScheduledRelease,
  activeUndecidedRelease,
} from '../../__fixtures__/release.fixture'
import {StatusItem} from '../../tool/components/StatusItem'
import {ReleaseAvatar} from '../ReleaseAvatar'

const TONES: BadgeTone[] = ['default', 'primary', 'positive', 'caution', 'critical']

/**
 * Chromatic sentinel for ui5 Box padding and badge-tone icon colors on
 * ReleaseAvatar / StatusItem. Shared with Storybook via a thin CSF wrapper.
 */
export function ReleaseAvatarStory() {
  return (
    <Card padding={4}>
      <Stack gap={5}>
        <Stack gap={2}>
          <Text muted size={1} weight="medium">
            by releaseType
          </Text>
          <Flex align="center" gap={3}>
            <ReleaseAvatar releaseType="asap" />
            <ReleaseAvatar releaseType="scheduled" />
            <ReleaseAvatar releaseType="undecided" />
          </Flex>
        </Stack>
        <Stack gap={2}>
          <Text muted size={1} weight="medium">
            by release document
          </Text>
          <Flex align="center" gap={3}>
            <ReleaseAvatar release={activeASAPRelease} />
            <ReleaseAvatar release={activeScheduledRelease} />
            <ReleaseAvatar release={activeUndecidedRelease} />
            <ReleaseAvatar release={activeCardinalityOneRelease} />
            <ReleaseAvatar release="drafts" />
          </Flex>
        </Stack>
        <Stack gap={2}>
          <Text muted size={1} weight="medium">
            by tone
          </Text>
          <Flex align="center" gap={3}>
            {TONES.map((tone) => (
              // oxlint-disable-next-line no-deprecated -- deprecated tone path is still rendered in production
              <ReleaseAvatar key={tone} tone={tone} />
            ))}
          </Flex>
        </Stack>
        <Stack gap={2}>
          <Text muted size={1} weight="medium">
            StatusItem
          </Text>
          <Stack gap={2} style={{maxWidth: 280}}>
            <StatusItem avatar={<ReleaseAvatar padding={2} releaseType="asap" />} text="ASAP" />
            <StatusItem text="No avatar" />
          </Stack>
        </Stack>
      </Stack>
    </Card>
  )
}
