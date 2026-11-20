import {type ReleaseDocument} from '@sanity/client'

import {readVersionType} from '../../util/versionsUtils'
import {
  type DocumentVersionStatusGroup,
  type DocumentVersionStatusItem,
} from './sortDocumentVersionsForStatus'

/**
 * The first part of an audience line in the versions flyout: the fact an editor deciding what to
 * open needs most. Picked in this order: something is scheduled, unpublished edits, never
 * published, waiting in an unscheduled release, published.
 *
 * @internal
 */
export type AudienceLineLead =
  /** Published, and in a release scheduled for a future time: "Update scheduled Fri 28 Nov, 9:00" */
  | {kind: 'update-scheduled'; release: ReleaseDocument}
  /** Never published, and in a release scheduled for a future time */
  | {kind: 'first-publish-scheduled'; release: ReleaseDocument}
  /** Published, and a draft: "Unpublished edits" */
  | {kind: 'unpublished-edits'}
  /** Nothing is live for this audience: "Not published yet" */
  | {kind: 'not-published-yet'}
  /** Published, and in a release with no publish time: "Update waiting in Autumn catalogue" */
  | {kind: 'update-waiting'; release: ReleaseDocument}
  /** Published, nothing pending: "Published 3 wk ago" */
  | {kind: 'published'; at: string}
  /** A scheduled release with this audience in it has gone out: "Updated 2 hr ago" */
  | {kind: 'updated'; at: string}

/**
 * The second part of an audience line: the next most useful fact. Cut short before the lead when
 * the line is too long.
 *
 * @internal
 */
export type AudienceLineDetail =
  /** "2 hr ago" */
  | {kind: 'time-ago'; at: string}
  /** "edited 2 hr ago" */
  | {kind: 'edited'; at: string}
  /** The release's own name: "Black Friday" */
  | {kind: 'release-name'; release: ReleaseDocument}
  /** "in Autumn catalogue" */
  | {kind: 'in-release'; release: ReleaseDocument}
  /** "unpublished edits" */
  | {kind: 'unpublished-edits'}
  /** "+1 release" */
  | {kind: 'more-releases'; count: number}
  /** "no date set" */
  | {kind: 'no-date-set'}

/** @internal */
export interface AudienceLine {
  lead: AudienceLineLead
  detail?: AudienceLineDetail
}

interface ReleaseEntry {
  item: DocumentVersionStatusItem
  release: ReleaseDocument
  /** When the release publishes or published, if it has a time */
  date?: number
}

function releaseDate(release: ReleaseDocument): string | undefined {
  return release.publishedAt || release.publishAt || release.metadata.intendedPublishAt
}

function timeOf(value: string | undefined): number | undefined {
  if (!value) return undefined
  const time = Date.parse(value)
  return Number.isNaN(time) ? undefined : time
}

function latestUpdate(items: DocumentVersionStatusItem[]): string {
  return items.reduce(
    (latest, item) =>
      (timeOf(item.version._updatedAt) ?? 0) > (timeOf(latest) ?? 0)
        ? item.version._updatedAt
        : latest,
    items[0]?.version._updatedAt ?? '',
  )
}

/**
 * What an audience row in the versions flyout says, as a lead and a detail. Pure, so every wording
 * case is tested without rendering; the flyout turns the result into words with the Studio's date
 * formatting.
 *
 * - A release is scheduled when its type is "At time", it has a time, and that time is still
 *   ahead. Once the time has passed (or the release is published) it has gone out, and the line
 *   says so in the past tense.
 * - A release with no time ("As soon as possible", "Undecided", or "At time" with no date yet) is
 *   unscheduled.
 * - Versions whose release is not known (archived, or not loaded yet) are left out.
 *
 * @internal
 */
export function getAudienceLine(group: DocumentVersionStatusGroup, now: number): AudienceLine {
  const published = group.items.find((item) => readVersionType(item.version) === 'published')
  const draft = group.items.find((item) => readVersionType(item.version) === 'draft')

  const releases: ReleaseEntry[] = group.items.flatMap((item) =>
    readVersionType(item.version) === 'release' && item.release
      ? [{item, release: item.release, date: timeOf(releaseDate(item.release))}]
      : [],
  )

  const goneOut = releases
    .filter(
      ({release, date}) =>
        release.state === 'published' ||
        (release.metadata.releaseType === 'scheduled' && date !== undefined && date <= now),
    )
    .toSorted((left, right) => (right.date ?? 0) - (left.date ?? 0))
  const scheduled = releases
    .filter(
      (entry) =>
        !goneOut.includes(entry) &&
        entry.release.metadata.releaseType === 'scheduled' &&
        entry.date !== undefined,
    )
    .toSorted((left, right) => (left.date ?? 0) - (right.date ?? 0))
  const unscheduled = releases.filter(
    (entry) => !goneOut.includes(entry) && !scheduled.includes(entry),
  )
  const pending = [...scheduled, ...unscheduled]

  const isLive = Boolean(published) || goneOut.length > 0

  // 1. Something is scheduled: the earliest one leads
  const [nextScheduled] = scheduled
  if (nextScheduled) {
    const lead: AudienceLineLead = isLive
      ? {kind: 'update-scheduled', release: nextScheduled.release}
      : {kind: 'first-publish-scheduled', release: nextScheduled.release}
    // The draft does not go out with the release, so it is the most useful detail
    if (draft && isLive) return {lead, detail: {kind: 'unpublished-edits'}}
    if (pending.length > 1)
      return {lead, detail: {kind: 'more-releases', count: pending.length - 1}}
    return {lead, detail: {kind: 'release-name', release: nextScheduled.release}}
  }

  // 2. Unpublished edits
  if (isLive && draft) {
    return {
      lead: {kind: 'unpublished-edits'},
      detail: {kind: 'time-ago', at: draft.version._updatedAt},
    }
  }

  // 3. Never published
  if (!isLive) {
    const lead: AudienceLineLead = {kind: 'not-published-yet'}
    if (draft) return {lead, detail: {kind: 'edited', at: draft.version._updatedAt}}
    const [firstUnscheduled] = unscheduled
    if (firstUnscheduled)
      return {lead, detail: {kind: 'in-release', release: firstUnscheduled.release}}
    return {lead, detail: {kind: 'edited', at: latestUpdate(group.items)}}
  }

  // 4. Waiting in an unscheduled release
  const [firstUnscheduled] = unscheduled
  if (firstUnscheduled) {
    return {
      lead: {kind: 'update-waiting', release: firstUnscheduled.release},
      detail: {kind: 'no-date-set'},
    }
  }

  // 5. Published, nothing pending. A scheduled release that went out after the last publish says
  // "Updated", with its name.
  const [lastGoneOut] = goneOut
  const publishedAt = timeOf(published?.version._updatedAt)
  if (
    lastGoneOut &&
    lastGoneOut.date !== undefined &&
    (publishedAt === undefined || lastGoneOut.date >= publishedAt - 60_000)
  ) {
    return {
      lead: {kind: 'updated', at: new Date(lastGoneOut.date).toISOString()},
      detail: {kind: 'release-name', release: lastGoneOut.release},
    }
  }
  return {lead: {kind: 'published', at: published?.version._updatedAt ?? latestUpdate(group.items)}}
}
