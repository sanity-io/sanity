import {describe, expect, test} from 'vitest'

import {
  findSharedGroups,
  getReleaseImpact,
  getReleaseMemberImpact,
  getReleaseMemberTarget,
  groupReleaseImpactByEffect,
  type ReleaseMemberImpact,
} from '../releaseImpact'

const version = (id: string, extra: Record<string, unknown> = {}) => ({
  _id: `versions.rA.${id}`,
  _type: 'article',
  publishedDocumentExists: false,
  ...extra,
})

describe('getReleaseMemberImpact', () => {
  test('a group with no published document is added', () => {
    expect(getReleaseMemberImpact(version('doc1'))).toEqual({
      groupId: 'doc1',
      documentType: 'article',
      lane: {kind: 'release-version', versionId: 'versions.rA.doc1'},
      effect: 'add',
      draftDiffers: false,
    })
  })

  test('a group with a published document is updated', () => {
    expect(getReleaseMemberImpact(version('doc1', {publishedDocumentExists: true})).effect).toBe(
      'update',
    )
  })

  test('a version marked for deletion unpublishes, and its draft never counts as differing', () => {
    const impact = getReleaseMemberImpact(
      version('doc1', {
        publishedDocumentExists: true,
        draftDocumentExists: true,
        _system: {delete: true},
      }),
    )
    expect(impact.effect).toBe('unpublish')
    expect(impact.draftDiffers).toBe(false)
  })

  test('an existing draft next to the version differs', () => {
    expect(getReleaseMemberImpact(version('doc1', {draftDocumentExists: true})).draftDiffers).toBe(
      true,
    )
  })

  test('getReleaseImpact maps every document in the release', () => {
    expect(getReleaseImpact([{document: version('a')}, {document: version('b')}])).toHaveLength(2)
  })
})

describe('findSharedGroups', () => {
  test('returns only the groups that sit in two or more releases', () => {
    const shared = findSharedGroups(
      new Map([
        ['rA', ['doc1', 'doc2']],
        ['rB', ['doc2', 'doc3']],
        ['rC', ['doc2', 'doc2']],
      ]),
    )
    expect([...shared]).toEqual([['doc2', ['rA', 'rB', 'rC']]])
  })
})

describe('getReleaseMemberTarget', () => {
  const base: ReleaseMemberImpact = {
    groupId: 'doc1',
    documentType: 'article',
    lane: {kind: 'release-version', versionId: 'versions.rA.doc1'},
    effect: 'update',
    draftDiffers: false,
  }

  test('a version in the release targets the version', () => {
    expect(getReleaseMemberTarget(base)).toEqual({documentId: 'versions.rA.doc1'})
  })

  test('a member that points at the Default draft targets the group', () => {
    expect(getReleaseMemberTarget({...base, lane: {kind: 'default-draft'}})).toEqual({
      documentId: 'doc1',
    })
  })

  test('a member that points at a variant targets the group and the variant', () => {
    expect(
      getReleaseMemberTarget({...base, lane: {kind: 'variant', variantId: 'variant-a'}}),
    ).toEqual({documentId: 'doc1', variantId: 'variant-a'})
  })
})

describe('groupReleaseImpactByEffect', () => {
  test('groups by effect in a fixed order, keeps member order, and leaves out empty groups', () => {
    const impacts = getReleaseImpact([
      {document: version('u1', {publishedDocumentExists: true})},
      {document: version('a1')},
      {document: version('u2', {publishedDocumentExists: true})},
      {document: version('a2')},
    ])
    const groups = groupReleaseImpactByEffect(impacts)
    expect(groups.map((group) => group.effect)).toEqual(['add', 'update'])
    expect(groups[0].members.map((member) => member.groupId)).toEqual(['a1', 'a2'])
    expect(groups[1].members.map((member) => member.groupId)).toEqual(['u1', 'u2'])
  })

  test('returns no groups for an empty release', () => {
    expect(groupReleaseImpactByEffect([])).toEqual([])
  })
})
