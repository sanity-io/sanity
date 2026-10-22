import {Card} from '@sanity/ui'
import {VStack} from 'ui5'

import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {LocaleProvider} from '../../../../i18n/components/LocaleProvider'
import {releasesUsEnglishLocaleBundle} from '../../../i18n'
import {type ReleaseEvent} from '../events/types'
import {ReleaseActivityListItem} from '../ReleaseActivityListItem'

const RELEASE_ID = '_.releases.rActive'
const RELEASE_TITLE = 'Spring campaign'

// `doug` is the mock workspace's current user, so the avatar resolves without a request.
const base = {author: 'doug', releaseName: 'rActive', origin: 'events' as const}

const EVENTS: ReleaseEvent[] = [
  {
    ...base,
    id: '2024-03-01T09:00:00Z-createRelease',
    type: 'createRelease',
    timestamp: '2024-03-01T09:00:00Z',
    origin: 'translog',
    change: {releaseType: 'scheduled', intendedPublishDate: '2024-03-15T10:00:00Z'},
  },
  {
    ...base,
    id: '2024-03-01T09:05:00Z-editRelease',
    type: 'editRelease',
    timestamp: '2024-03-01T09:05:00Z',
    origin: 'translog',
    change: {releaseType: 'asap'},
  },
  {
    ...base,
    id: '2024-03-01T09:06:00Z-editRelease',
    type: 'editRelease',
    timestamp: '2024-03-01T09:06:00Z',
    origin: 'translog',
    change: {releaseType: 'scheduled', intendedPublishDate: '2024-03-20T08:30:00Z'},
  },
  {
    ...base,
    id: '2024-03-03T12:00:00Z-scheduleRelease',
    type: 'scheduleRelease',
    timestamp: '2024-03-03T12:00:00Z',
    publishAt: '2024-03-20T08:30:00Z',
  },
  {
    ...base,
    id: '2024-03-04T12:00:00Z-unscheduleRelease',
    type: 'unscheduleRelease',
    timestamp: '2024-03-04T12:00:00Z',
  },
  {
    ...base,
    id: '2024-03-05T12:00:00Z-publishRelease',
    type: 'publishRelease',
    timestamp: '2024-03-05T12:00:00Z',
  },
  {
    ...base,
    id: '2024-03-06T12:00:00Z-archiveRelease',
    type: 'archiveRelease',
    timestamp: '2024-03-06T12:00:00Z',
  },
  {
    ...base,
    id: '2024-03-07T12:00:00Z-unarchiveRelease',
    type: 'unarchiveRelease',
    timestamp: '2024-03-07T12:00:00Z',
  },
]

/**
 * Chromatic sentinel for the release activity feed row: avatar, muted status
 * copy with its bold release title / schedule target and the absolute
 * timestamp. One row per release-level event type, with fixed fixture
 * timestamps. Grid harness for the co-located Storybook CSF file.
 *
 * The add / discard document events are left out: their row renders a document preview, and
 * the preview store cannot resolve one against `TestWrapper`'s mock client.
 *
 * `TestWrapper` mounts no locale provider, so the row's `useDateTimeFormat` throws without
 * this `LocaleProvider`.
 */
export function ReleaseActivityListItemStory() {
  return (
    <TestWrapper i18nBundles={[releasesUsEnglishLocaleBundle]} schemaTypes={[]}>
      <LocaleProvider>
        <Card padding={3} style={{maxWidth: 480}}>
          <VStack gap={1}>
            {EVENTS.map((event) => (
              <ReleaseActivityListItem
                key={event.id}
                event={event}
                releaseId={RELEASE_ID}
                releaseTitle={RELEASE_TITLE}
              />
            ))}
          </VStack>
        </Card>
      </LocaleProvider>
    </TestWrapper>
  )
}
