import {type BadgeTone, Card, Text} from '@sanity/ui'
import {Flex, VStack} from 'ui5'

import {
  activeASAPRelease,
  activeScheduledRelease,
  activeUndecidedRelease,
  archivedScheduledRelease,
} from '../../__fixtures__/release.fixture'
import {getVersionInlineBadge, VersionInlineBadge} from '../VersionInlineBadge'

const TONES: BadgeTone[] = [
  'default',
  'neutral',
  'primary',
  'suggest',
  'positive',
  'caution',
  'critical',
]

const DraftsBadge = getVersionInlineBadge('drafts')
const PublishedBadge = getVersionInlineBadge('published')
const AsapBadge = getVersionInlineBadge(activeASAPRelease)
const ScheduledBadge = getVersionInlineBadge(activeScheduledRelease)
const UndecidedBadge = getVersionInlineBadge(activeUndecidedRelease)
const ArchivedBadge = getVersionInlineBadge(archivedScheduledRelease)

/**
 * Chromatic sentinel for VersionInlineBadge CSS tones. Colours come from
 * `--card-badge-*-fg/bg` on the nearest Card — the same tokens document
 * banners use when they wrap a release title. ReleaseAvatar already pins
 * icon-color tokens; this pins the text-badge surface. Fixture labels only.
 */
export function VersionInlineBadgeStory() {
  return (
    <Card padding={4} style={{maxWidth: 480}}>
      <VStack gap={5}>
        <VStack gap={2}>
          <Text muted size={1} weight="medium">
            by tone
          </Text>
          <Flex alignItems="center" flexWrap="wrap" gap={2}>
            {TONES.map((tone) => (
              <VersionInlineBadge key={tone} $tone={tone}>
                {tone}
              </VersionInlineBadge>
            ))}
          </Flex>
        </VStack>
        <VStack gap={2}>
          <Text muted size={1} weight="medium">
            by perspective
          </Text>
          <Flex alignItems="center" flexWrap="wrap" gap={2}>
            <DraftsBadge>Drafts</DraftsBadge>
            <PublishedBadge>Published</PublishedBadge>
            <AsapBadge>ASAP</AsapBadge>
            <ScheduledBadge>Scheduled</ScheduledBadge>
            <UndecidedBadge>Undecided</UndecidedBadge>
            <ArchivedBadge>Archived</ArchivedBadge>
          </Flex>
        </VStack>
      </VStack>
    </Card>
  )
}
