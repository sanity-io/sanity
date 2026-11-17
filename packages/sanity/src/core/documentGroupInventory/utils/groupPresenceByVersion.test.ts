import {type User} from '@sanity/types'
import {describe, expect, it} from 'vitest'

import {type DocumentPresence} from '../../store/presence/types'
import {getVersionPresence, groupPresenceByVersion} from './groupPresenceByVersion'

const GROUP_ID = 'article'

// The ids the inventory rows hold, as `useDocumentVersions` lists them for the group.
const PUBLISHED = GROUP_ID
const DRAFT = `drafts.${GROUP_ID}`
const RELEASE = `versions.rBlackFriday.${GROUP_ID}`
// A variant version lives under an opaque scope id, whatever its bundle (draft, published or a
// release); the bundle is in `_system.bundleId`, not in the id.
const VARIANT_DRAFT = `versions.sGermanyDraft.${GROUP_ID}`
const VARIANT_IN_RELEASE = `versions.sGermanyBlackFriday.${GROUP_ID}`

function user(id: string): User {
  return {id, displayName: id}
}

function report(
  userId: string,
  documentId: string | undefined,
  lastActiveAt = '2026-11-17T10:00:00.000Z',
): DocumentPresence {
  return {
    user: user(userId),
    documentId,
    lastActiveAt,
    path: [],
    sessionId: `${userId}-${documentId}-${lastActiveAt}`,
  }
}

function userIds(presence: ReturnType<typeof getVersionPresence>): string[] {
  return presence.map((entry) => entry.user.id)
}

describe('groupPresenceByVersion', () => {
  it('puts each person on the row of the exact version they have open', () => {
    const grouped = groupPresenceByVersion([
      report('pat', DRAFT),
      report('max', VARIANT_IN_RELEASE),
      report('kim', RELEASE),
      report('lee', PUBLISHED),
    ])

    expect(userIds(getVersionPresence(grouped, DRAFT))).toEqual(['pat'])
    expect(userIds(getVersionPresence(grouped, VARIANT_IN_RELEASE))).toEqual(['max'])
    expect(userIds(getVersionPresence(grouped, RELEASE))).toEqual(['kim'])
    expect(userIds(getVersionPresence(grouped, PUBLISHED))).toEqual(['lee'])
  })

  it('keeps a variant row apart from the base row of the same bundle', () => {
    const grouped = groupPresenceByVersion([report('pat', DRAFT), report('max', VARIANT_DRAFT)])

    expect(userIds(getVersionPresence(grouped, DRAFT))).toEqual(['pat'])
    expect(userIds(getVersionPresence(grouped, VARIANT_DRAFT))).toEqual(['max'])
  })

  it('leaves a row nobody has open empty', () => {
    const grouped = groupPresenceByVersion([report('pat', DRAFT)])

    expect(getVersionPresence(grouped, RELEASE)).toEqual([])
  })

  it('counts a person once on a row they have open in several sessions, keeping the latest', () => {
    const grouped = groupPresenceByVersion([
      report('pat', DRAFT, '2026-11-17T10:00:00.000Z'),
      report('pat', DRAFT, '2026-11-17T10:05:00.000Z'),
    ])

    const draft = getVersionPresence(grouped, DRAFT)
    expect(userIds(draft)).toEqual(['pat'])
    expect(draft[0].lastActiveAt).toBe('2026-11-17T10:05:00.000Z')
  })

  it('shows a person with two versions open on both rows', () => {
    const grouped = groupPresenceByVersion([report('pat', DRAFT), report('pat', RELEASE)])

    expect(userIds(getVersionPresence(grouped, DRAFT))).toEqual(['pat'])
    expect(userIds(getVersionPresence(grouped, RELEASE))).toEqual(['pat'])
  })

  it('orders a row from least to most recently active, so the stack shows the latest last', () => {
    const grouped = groupPresenceByVersion([
      report('late', DRAFT, '2026-11-17T10:09:00.000Z'),
      report('early', DRAFT, '2026-11-17T10:01:00.000Z'),
      report('middle', DRAFT, '2026-11-17T10:05:00.000Z'),
    ])

    expect(userIds(getVersionPresence(grouped, DRAFT))).toEqual(['early', 'middle', 'late'])
  })

  it('skips a report without a version id', () => {
    const grouped = groupPresenceByVersion([report('pat', undefined)])

    expect(grouped.size).toBe(0)
  })
})
