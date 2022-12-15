import {SanityDocument} from '@sanity/types'
import {collate, documentIdEquals, removeDupes} from './draftUtils'

test('collate()', () => {
  const foo = {_type: 'foo', _id: 'foo'}
  const fooDraft = {_type: 'foo', _id: 'drafts.foo'}
  const barDraft = {_type: 'foo', _id: 'drafts.bar'}
  const baz = {_type: 'foo', _id: 'baz'}

  expect(collate([foo, fooDraft, barDraft, baz])).toEqual([
    {type: 'foo', id: 'foo', draft: fooDraft, published: foo},
    {type: 'foo', id: 'bar', draft: barDraft},
    {type: 'foo', id: 'baz', published: baz},
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
