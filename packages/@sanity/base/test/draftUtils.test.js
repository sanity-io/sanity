import {collate, removeDupes} from '../src/util/draftUtils'

test('collate()', () => {
  const foo = {_id: 'foo'}
  const fooDraft = {_id: 'drafts.foo'}
  const barDraft = {_id: 'drafts.bar'}
  const baz = {_id: 'baz'}

  expect(collate([foo, fooDraft, barDraft, baz])).toEqual([
    {id: 'foo', draft: fooDraft, published: foo},
    {id: 'bar', draft: barDraft},
    {id: 'baz', published: baz},
  ])
})

test('removeDupes()', () => {
  const foo = {_id: 'foo'}
  const fooDraft = {_id: 'drafts.foo'}
  const barDraft = {_id: 'drafts.bar'}
  const baz = {_id: 'baz'}

  expect(removeDupes([foo, fooDraft, barDraft, baz])).toEqual([fooDraft, barDraft, baz])
})
