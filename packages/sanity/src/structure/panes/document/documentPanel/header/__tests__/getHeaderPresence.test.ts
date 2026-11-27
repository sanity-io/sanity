import {type DocumentPresence} from 'sanity'
import {describe, expect, it} from 'vitest'

import {getHeaderPresence} from '../getHeaderPresence'

function presence(
  userId: string,
  documentId: string | undefined,
  path: DocumentPresence['path'] = [],
): DocumentPresence {
  return {
    user: {id: userId, displayName: userId},
    path,
    sessionId: `session-${userId}`,
    documentId,
    lastActiveAt: '2026-11-17T10:00:00.000Z',
  }
}

const everyVersion = [
  presence('on-published', 'doc-1'),
  presence('on-draft', 'drafts.doc-1'),
  presence('on-release', 'versions.rSpring.doc-1'),
  presence('on-variant', 'versions.vMarketDe.doc-1'),
  presence('on-other-document', 'drafts.doc-2'),
]

function userIds(items: DocumentPresence[]) {
  return items.map((item) => item.user.id)
}

describe('getHeaderPresence', () => {
  it.each([
    ['the published document', 'doc-1', ['on-published']],
    ['the draft', 'drafts.doc-1', ['on-draft']],
    ['a release version', 'versions.rSpring.doc-1', ['on-release']],
    ['a variant version', 'versions.vMarketDe.doc-1', ['on-variant']],
  ])('keeps only the people on %s when it is displayed', (_label, displayedId, expected) => {
    expect(userIds(getHeaderPresence(everyVersion, displayedId))).toEqual(expected)
  })

  it('shows nobody when no one is on the displayed version', () => {
    expect(getHeaderPresence(everyVersion, 'versions.rAutumn.doc-1')).toEqual([])
  })

  it('leaves out people who are in a field of the displayed version', () => {
    const items = [
      presence('at-root', 'drafts.doc-1'),
      presence('in-title', 'drafts.doc-1', ['title']),
    ]

    expect(userIds(getHeaderPresence(items, 'drafts.doc-1'))).toEqual(['at-root'])
  })

  it('leaves out a report that has no version id', () => {
    expect(getHeaderPresence([presence('unknown', undefined)], 'doc-1')).toEqual([])
  })
})
