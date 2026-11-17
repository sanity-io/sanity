import {describe, expect, test} from 'vitest'

import {findSharedGroups, getReleaseImpact, getReleaseMemberImpact} from '../releaseImpact'

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
