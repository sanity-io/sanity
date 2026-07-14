import {describe, expect, it} from 'vitest'

import {DocumentStore} from '../store'

describe('DocumentStore.commit', () => {
  it('creates a document with an appear event and no previousRev', () => {
    const store = new DocumentStore()
    const {events} = store.commit(
      [{createIfNotExists: {_id: 'drafts.a', _type: 'singleString'}}],
      'tx-1',
    )
    expect(events).toHaveLength(1)
    expect(events[0]).toMatchObject({
      documentId: 'drafts.a',
      transactionId: 'tx-1',
      resultRev: 'tx-1',
      transition: 'appear',
      transactionTotalEvents: 1,
      transactionCurrentEvent: 1,
      visibility: 'transaction',
    })
    expect('previousRev' in events[0]).toBe(false)
    expect(store.get('drafts.a')?._rev).toBe('tx-1')
  })

  it('chains previousRev → resultRev across sequential commits', () => {
    const store = new DocumentStore()
    store.commit([{createIfNotExists: {_id: 'drafts.a', _type: 'singleString'}}], 'tx-1')
    const second = store.commit([{patch: {id: 'drafts.a', set: {stringField: 'x'}}}], 'tx-2')
    expect(second.events[0]).toMatchObject({
      previousRev: 'tx-1',
      resultRev: 'tx-2',
      transition: 'update',
    })
    const third = store.commit([{patch: {id: 'drafts.a', set: {stringField: 'xy'}}}], 'tx-3')
    expect(third.events[0]).toMatchObject({previousRev: 'tx-2', resultRev: 'tx-3'})
    expect(store.get('drafts.a')?.stringField).toBe('xy')
  })

  it('applies patch operations with @sanity/mutator semantics', () => {
    const store = new DocumentStore()
    store.seed([{_id: 'a', _type: 'doc', title: 'hello', tags: ['x']}])
    store.commit(
      [
        {
          patch: {
            id: 'a',
            set: {title: 'hello world'},
            setIfMissing: {subtitle: 'sub'},
            insert: {after: 'tags[-1]', items: ['y']},
          },
        },
      ],
      'tx-1',
    )
    const doc = store.get('a')
    expect(doc).toMatchObject({
      title: 'hello world',
      subtitle: 'sub',
      tags: ['x', 'y'],
      _rev: 'tx-1',
    })
  })

  it('supports diffMatchPatch patches (the studio typing path)', () => {
    const store = new DocumentStore()
    store.seed([{_id: 'drafts.a', _type: 'singleString', stringField: 'hello'}])
    store.commit(
      [{patch: {id: 'drafts.a', diffMatchPatch: {stringField: '@@ -1,5 +1,6 @@\n hello\n+!\n'}}}],
      'tx-1',
    )
    expect(store.get('drafts.a')?.stringField).toBe('hello!')
  })

  it('groups a multi-document transaction into per-document events with correct totals', () => {
    const store = new DocumentStore()
    store.seed([{_id: 'a', _type: 'doc'}])
    const {events} = store.commit(
      [{patch: {id: 'a', set: {title: 'x'}}}, {createIfNotExists: {_id: 'b', _type: 'doc'}}],
      'tx-1',
    )
    expect(events).toHaveLength(2)
    expect(events.map((e) => e.transactionTotalEvents)).toEqual([2, 2])
    expect(events.map((e) => e.transactionCurrentEvent)).toEqual([1, 2])
    expect(events.map((e) => e.documentId).toSorted()).toEqual(['a', 'b'])
  })

  it('emits disappear on delete and drops the document', () => {
    const store = new DocumentStore()
    store.seed([{_id: 'a', _type: 'doc'}])
    const {events} = store.commit([{delete: {id: 'a'}}], 'tx-1')
    expect(events[0]).toMatchObject({transition: 'disappear', resultRev: 'tx-1'})
    expect(store.get('a')).toBeNull()
  })

  it('emits no event when deleting a nonexistent document', () => {
    const store = new DocumentStore()
    const {events} = store.commit([{delete: {id: 'nope'}}], 'tx-1')
    expect(events).toHaveLength(0)
  })

  it('seeding emits no events and resets cleanly', () => {
    const store = new DocumentStore()
    store.seed([{_id: 'a', _type: 'doc'}])
    expect(store.get('a')).not.toBeNull()
    store.reset()
    expect(store.get('a')).toBeNull()
    expect(store.getAll()).toEqual([])
  })
})
