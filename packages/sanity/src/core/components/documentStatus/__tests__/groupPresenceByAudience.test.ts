import {describe, expect, it} from 'vitest'

import {type VersionInfoDocumentStub} from '../../../releases/store/types'
import {type DocumentPresence} from '../../../store/presence/types'
import {groupPresenceByAudience} from '../groupPresenceByAudience'
import {type DocumentVersionStatusGroup} from '../sortDocumentVersionsForStatus'

const GROUP_ID = 'article-1'
const GERMAN = '_.variants.german'

function item(id: string): DocumentVersionStatusGroup['items'][number] {
  return {
    version: {
      _id: id,
      _type: 'article',
      _rev: '',
      _createdAt: '',
      _updatedAt: '',
      _system: {group: {_ref: GROUP_ID, _weak: true}},
    } as VersionInfoDocumentStub,
  }
}

function person(userId: string, documentId?: string): Omit<DocumentPresence, 'path'> {
  return {
    user: {id: userId, displayName: userId},
    sessionId: `session-${userId}`,
    documentId,
    lastActiveAt: '2026-11-17T10:00:00.000Z',
  }
}

// Variant versions live at an opaque scope id: `versions.<scopeId>.<groupId>`
const groups: DocumentVersionStatusGroup[] = [
  {items: [item(GROUP_ID), item(`versions.rBlackFriday.${GROUP_ID}`)]},
  {variantId: GERMAN, items: [item(`versions.k8f3a.${GROUP_ID}`)]},
]

function ids(map: Map<string, Omit<DocumentPresence, 'path'>[]>, key: string) {
  return (map.get(key) ?? []).map((entry) => entry.user.id)
}

describe('groupPresenceByAudience', () => {
  it('puts each person on the audience that holds the version they have open', () => {
    const map = groupPresenceByAudience(groups, [
      person('madison', `versions.k8f3a.${GROUP_ID}`),
      person('pedro', `versions.rBlackFriday.${GROUP_ID}`),
    ])
    expect(ids(map, GERMAN)).toEqual(['madison'])
    expect(ids(map, 'default')).toEqual(['pedro'])
  })

  it('puts the draft and published ids on the default audience, even before the draft exists', () => {
    const map = groupPresenceByAudience(groups, [
      person('madison', `drafts.${GROUP_ID}`),
      person('pedro', GROUP_ID),
    ])
    expect(ids(map, 'default')).toEqual(['madison', 'pedro'])
  })

  it('lists a person once per audience, however many sessions they have there', () => {
    const map = groupPresenceByAudience(groups, [
      person('madison', `drafts.${GROUP_ID}`),
      person('madison', GROUP_ID),
    ])
    expect(ids(map, 'default')).toEqual(['madison'])
  })

  it('puts nobody on a row for a version no row holds, or a report without a version', () => {
    const map = groupPresenceByAudience(groups, [
      person('madison', `versions.unknown.${GROUP_ID}`),
      person('pedro'),
    ])
    expect(map.size).toBe(0)
  })
})
