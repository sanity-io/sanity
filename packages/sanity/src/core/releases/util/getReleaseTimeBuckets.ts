import {type ReleaseDocument} from '@sanity/client'
import {addDays} from 'date-fns/addDays'
import {addMonths} from 'date-fns/addMonths'

import {getPublishDateFromRelease} from './util'

/**
 * The time bands the release menu groups by, in the order they read.
 *
 * Four rolling windows, with a band at each end for the releases a window cannot hold: `overdue`
 * for a date that has passed, which is the most urgent thing in the list, and `undecided` for a
 * release with no date, which cannot be placed against the others at all.
 *
 * @internal
 */
export const ORDERED_RELEASE_TIME_BUCKETS = [
  'overdue',
  'asap',
  'thisWeek',
  'thisMonth',
  'thisQuarter',
  'later',
  'undecided',
] as const

/** @internal */
export type ReleaseTimeBucket = (typeof ORDERED_RELEASE_TIME_BUCKETS)[number]

/**
 * Release count at which the menu starts labelling the bands.
 *
 * Below it the list is one unlabelled sequence in the same order: a heading over two rows costs
 * more than it explains, and headings at every size are what made the short list feel restless.
 * Above it the list cannot be read at a glance, and the band is what says where you are.
 *
 * @internal
 */
export const RELEASE_TIME_BUCKET_HEADING_THRESHOLD = 20

/**
 * `asap` and `undecided` reuse the release-type strings they have always had, so the menu does not
 * ship a second spelling of "As soon as possible".
 *
 * @internal
 */
export const RELEASE_TIME_BUCKET_LABELS: Record<ReleaseTimeBucket, string> = {
  overdue: 'release.time-bucket.overdue',
  asap: 'release.type.asap',
  thisWeek: 'release.time-bucket.this-week',
  thisMonth: 'release.time-bucket.this-month',
  thisQuarter: 'release.time-bucket.this-quarter',
  later: 'release.time-bucket.later',
  undecided: 'release.type.undecided',
}

/**
 * The windows are measured from `now` and each excludes the ones before it, so every dated release
 * lands in exactly one. Rolling rather than calendar boundaries: on the 30th, a calendar "this
 * month" would end tomorrow and put almost everything in the next band.
 */
const WINDOWS: {bucket: ReleaseTimeBucket; endsAt: (now: Date) => Date}[] = [
  {bucket: 'thisWeek', endsAt: (now) => addDays(now, 7)},
  {bucket: 'thisMonth', endsAt: (now) => addMonths(now, 1)},
  {bucket: 'thisQuarter', endsAt: (now) => addMonths(now, 3)},
]

/**
 * Which band a release belongs to.
 *
 * `asap` is checked before the date because an asap release carries no date — it publishes at the
 * next opportunity, which is a position in the sequence rather than a time. A release with neither
 * a date nor the asap type cannot be placed, so it goes to `undecided`.
 *
 * @internal
 */
export function getReleaseTimeBucket(release: ReleaseDocument, now: Date): ReleaseTimeBucket {
  if (release.metadata?.releaseType === 'asap') return 'asap'

  const publishDate = getPublishDateFromRelease(release)
  if (!publishDate) return 'undecided'

  if (publishDate.getTime() < now.getTime()) return 'overdue'

  const window = WINDOWS.find(({endsAt}) => publishDate.getTime() <= endsAt(now).getTime())

  return window ? window.bucket : 'later'
}

/**
 * Releases grouped into the bands, each band ordered by date, soonest first.
 *
 * Every band is present, and empty ones stay empty: `ReleaseTypeMenuSection` renders nothing for an
 * empty list, so a band only appears once it holds something.
 *
 * @internal
 */
export function groupReleasesByTimeBucket(
  releases: ReleaseDocument[],
  now: Date,
): Record<ReleaseTimeBucket, ReleaseDocument[]> {
  const grouped = Object.fromEntries(
    ORDERED_RELEASE_TIME_BUCKETS.map((bucket) => [bucket, [] as ReleaseDocument[]]),
  ) as Record<ReleaseTimeBucket, ReleaseDocument[]>

  for (const release of releases) {
    grouped[getReleaseTimeBucket(release, now)].push(release)
  }

  for (const bucket of ORDERED_RELEASE_TIME_BUCKETS) {
    grouped[bucket].sort((a, b) => {
      const aDate = getPublishDateFromRelease(a)?.getTime()
      const bDate = getPublishDateFromRelease(b)?.getTime()

      // Dateless releases keep the order they arrived in, behind any dated sibling.
      if (aDate === undefined) return bDate === undefined ? 0 : 1
      if (bDate === undefined) return -1

      return aDate - bDate
    })
  }

  return grouped
}
