import {type SanityDocument} from '@sanity/types'
import {describe, expect, it, test} from 'vitest'

import {
  collate,
  documentIdEquals,
  getIdPair,
  getPublishedId,
  getVersionFromId,
  getVersionId,
  removeDupes,
} from '../draftUtils'

test('collate()', () => {
  const foo = {_type: 'foo', _id: 'foo'}
  const fooDraft = {_type: 'foo', _id: 'drafts.foo'}
  const fooAlphaVersion = {_type: 'foo', _id: 'versions.alpha.foo'}
  const fooBetaVersion = {_type: 'foo', _id: 'versions.beta.foo'}
  const barDraft = {_type: 'foo', _id: 'drafts.bar'}
  const baz = {_type: 'foo', _id: 'baz'}

  expect(collate([foo, fooDraft, barDraft, baz, fooAlphaVersion, fooBetaVersion])).toEqual([
    {
      type: 'foo',
      id: 'foo',
      draft: fooDraft,
      published: foo,
      versions: [
        {
          _id: 'versions.alpha.foo',
          _type: 'foo',
        },
        {
          _id: 'versions.beta.foo',
          _type: 'foo',
        },
      ],
    },
    {type: 'foo', id: 'bar', draft: barDraft, versions: []},
    {type: 'foo', id: 'baz', published: baz, versions: []},
  ])
})

test('removeDupes()', () => {
  const foo = {_type: 'foo', _id: 'foo'} as SanityDocument
  const fooDraft = {_type: 'foo', _id: 'drafts.foo'} as SanityDocument
  const barDraft = {_type: 'foo', _id: 'drafts.bar'} as SanityDocument
  const baz = {_type: 'foo', _id: 'baz'} as SanityDocument

  expect(removeDupes([foo, fooDraft, barDraft, baz])).toEqual([fooDraft, barDraft, baz])
})

test.each([
  ['full equality, published', 'agot', 'agot', true],
  ['full equality, drafts', 'drafts.agot', 'drafts.agot', true],
  ['lhs draft, rhs published', 'drafts.agot', 'agot', true],
  ['rhs draft, lhs published', 'agot', 'drafts.agot', true],
  ['differing documents', 'agot', 'adwd', false],
  ['differing documents, draft lhs', 'drafts.agot', 'adwd', false],
  ['differing documents, draft rhs', 'agot', 'drafts.adwd', false],
  ['lhs non-draft prefix, otherwise equality', 'notes.agot', 'agot', false],
  ['rhs non-draft prefix, otherwise equality', 'agot', 'notes.agot', false],
])('documentIdEquals(): %s', (_, documentId, equalsDocumentId, shouldEqual) => {
  expect(documentIdEquals(documentId, equalsDocumentId)).toEqual(shouldEqual)
})

test.each([
  ['From published id', 'agot', 'summer-drop', 'versions.summer-drop.agot'],
  ['From draft id', 'drafts.agot', 'summer-drop', 'versions.summer-drop.agot'],
  ['From same version id', 'versions.summer-drop.agot', 'summer-drop', 'versions.summer-drop.agot'],
  [
    'From other version id',
    'versions.winter-drop.agot',
    'summer-drop',
    'versions.summer-drop.agot',
  ],
  ['Should support published id', 'agot', 'published', 'agot'],
  ['Should support drafts id', 'agot', 'drafts', 'drafts.agot'],
])('getVersionId(): %s', (_, documentId, equalsDocumentId, shouldEqual) => {
  expect(getVersionId(documentId, equalsDocumentId)).toEqual(shouldEqual)
})

test.each([
  ['from published id', 'agot', 'agot'],
  ['from draft id', 'drafts.agot', 'agot'],
  ['from version id', 'versions.summer-drop.agot', 'agot'],
  ['from complex id with version', 'versions.summer-drop.foo.agot', 'foo.agot'],
])('getPublishedId(): %s', (_, documentId, shouldEqual) => {
  expect(getPublishedId(documentId)).toEqual(shouldEqual)
})

describe('getVersionFromId', () => {
  it('should return the bundle slug', () => {
    expect(getVersionFromId('versions.summer.my-document-id')).toBe('summer')
  })

  it('should return the undefined if no bundle slug is found and document is a draft', () => {
    expect(getVersionFromId('drafts.my-document-id')).toBe(undefined)
  })

  it('should return the undefined if no bundle slug is found and document is published', () => {
    expect(getVersionFromId('my-document-id')).toBe(undefined)
  })
})

describe('getIdPair', () => {
  test.each([
    ['foo', undefined, {draftId: 'drafts.foo', publishedId: 'foo'}],
    ['drafts.foo', undefined, {draftId: 'drafts.foo', publishedId: 'foo'}],
    ['versions.r1.foo', undefined, {draftId: 'drafts.foo', publishedId: 'foo'}],
    [
      'foo',
      {version: 'r1'},
      {draftId: 'drafts.foo', publishedId: 'foo', versionId: 'versions.r1.foo'},
    ],
    [
      'drafts.foo',
      {version: 'r1'},
      {draftId: 'drafts.foo', publishedId: 'foo', versionId: 'versions.r1.foo'},
    ],
    [
      'versions.r1.foo',
      {version: 'r1'},
      {draftId: 'drafts.foo', publishedId: 'foo', versionId: 'versions.r1.foo'},
    ],
    [
      'versions.r1.foo',
      {version: 'r2'},
      // Id is converted to the version specified in the options
      {draftId: 'drafts.foo', publishedId: 'foo', versionId: 'versions.r2.foo'},
    ],
  ])('documentIdEquals(): %s', (id, options, result) => {
    expect(getIdPair(id, options)).toEqual(result)
  })
  it("should return error if version is 'drafts'", () => {
    expect(() => getIdPair('foo', {version: 'drafts'})).toThrowError(
      'Version can not be "published" or "drafts"',
    )
  })
  it("should return error if version is 'published'", () => {
    expect(() => getIdPair('foo', {version: 'published'})).toThrowError(
      'Version can not be "published" or "drafts"',
    )
  })
})
