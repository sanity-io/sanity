import {describe, expect, it} from 'vitest'

import {commitTransaction} from './commitTransaction'
import {ContentLakeError} from './contentLakeError'
import {type DocumentIndex, type MutationPayload} from './types'

const TIMESTAMP = '2026-01-01T00:00:00.000Z'

function commit(index: DocumentIndex, mutations: MutationPayload[], transactionId: string) {
  return commitTransaction({
    index,
    mutations,
    transactionId,
    identity: 'user',
    timestamp: TIMESTAMP,
  })
}

describe('commitTransaction', () => {
  it('creates a document with an appear event and no previousRev', () => {
    const {index, events, results} = commit(
      {},
      [{createIfNotExists: {_id: 'drafts.a', _type: 'singleString'}}],
      'tx-1',
    )
    expect(events).toHaveLength(1)
    expect(events[0]).toMatchObject({
      documentId: 'drafts.a',
      transactionId: 'tx-1',
      identity: 'user',
      resultRev: 'tx-1',
      transition: 'appear',
      transactionTotalEvents: 1,
      transactionCurrentEvent: 1,
      visibility: 'transaction',
    })
    expect('previousRev' in events[0]).toBe(false)
    expect(index['drafts.a']).toMatchObject({
      _rev: 'tx-1',
      _createdAt: TIMESTAMP,
      _updatedAt: TIMESTAMP,
    })
    expect(results).toEqual([{id: 'drafts.a', operation: 'create'}])
  })

  it('chains previousRev to resultRev across sequential commits', () => {
    const first = commit(
      {},
      [{createIfNotExists: {_id: 'drafts.a', _type: 'singleString'}}],
      'tx-1',
    )
    const second = commit(first.index, [{patch: {id: 'drafts.a', set: {stringField: 'x'}}}], 'tx-2')
    expect(second.events[0]).toMatchObject({
      previousRev: 'tx-1',
      resultRev: 'tx-2',
      transition: 'update',
    })
    const third = commit(
      second.index,
      [{patch: {id: 'drafts.a', set: {stringField: 'xy'}}}],
      'tx-3',
    )
    expect(third.events[0]).toMatchObject({previousRev: 'tx-2', resultRev: 'tx-3'})
    expect(third.index['drafts.a']?.stringField).toBe('xy')
  })

  it('applies set, setIfMissing and insert in one patch', () => {
    const {index} = commit(
      {a: {_id: 'a', _type: 'doc', _rev: 'seed', title: 'hello', tags: ['x']}},
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
    expect(index.a).toMatchObject({
      title: 'hello world',
      subtitle: 'sub',
      tags: ['x', 'y'],
      _rev: 'tx-1',
    })
  })

  it('applies diffMatchPatch patches', () => {
    const {index} = commit(
      {'drafts.a': {_id: 'drafts.a', _type: 'singleString', stringField: 'hello'}},
      [{patch: {id: 'drafts.a', diffMatchPatch: {stringField: '@@ -1,5 +1,6 @@\n hello\n+!\n'}}}],
      'tx-1',
    )
    expect(index['drafts.a']?.stringField).toBe('hello!')
  })

  it('emits an update for a patch that leaves the content unchanged', () => {
    const {index, events} = commit(
      {a: {_id: 'a', _type: 'doc', _rev: 'seed'}},
      [{patch: {id: 'a', unset: ['missing']}}],
      'tx-1',
    )
    expect(events).toHaveLength(1)
    expect(events[0]).toMatchObject({previousRev: 'seed', resultRev: 'tx-1', transition: 'update'})
    expect(index.a?._rev).toBe('tx-1')
  })

  it('groups a multi-document transaction into per-document events with correct totals', () => {
    const {events} = commit(
      {a: {_id: 'a', _type: 'doc'}},
      [{patch: {id: 'a', set: {title: 'x'}}}, {createIfNotExists: {_id: 'b', _type: 'doc'}}],
      'tx-1',
    )
    expect(events.map((event) => event.documentId)).toEqual(['a', 'b'])
    expect(events.map((event) => event.transactionTotalEvents)).toEqual([2, 2])
    expect(events.map((event) => event.transactionCurrentEvent)).toEqual([1, 2])
  })

  it('emits disappear on delete and drops the document', () => {
    const {index, events, results} = commit(
      {a: {_id: 'a', _type: 'doc', _rev: 'seed'}},
      [{delete: {id: 'a'}}],
      'tx-1',
    )
    expect(events[0]).toMatchObject({
      transition: 'disappear',
      previousRev: 'seed',
      resultRev: 'tx-1',
    })
    expect(index).toEqual({})
    expect(results).toEqual([{id: 'a', operation: 'delete'}])
  })

  it('counts only emitted events when deleting a missing document', () => {
    const {events} = commit(
      {},
      [{delete: {id: 'nope'}}, {createIfNotExists: {_id: 'b', _type: 'doc'}}],
      'tx-1',
    )
    expect(events.map((event) => event.documentId)).toEqual(['b'])
    expect(events[0]).toMatchObject({transactionTotalEvents: 1, transactionCurrentEvent: 1})
  })

  it('rejects a patch whose ifRevisionID does not match with a 409', () => {
    const index = {a: {_id: 'a', _type: 'doc', _rev: 'seed'}}
    const mismatch = () =>
      commit(index, [{patch: {id: 'a', ifRevisionID: 'stale', set: {title: 'x'}}}], 'tx-1')
    expect(mismatch).toThrow(ContentLakeError)
    expect(mismatch).toThrow(expect.objectContaining({statusCode: 409}))
  })

  it('applies a patch whose ifRevisionID matches', () => {
    const {index} = commit(
      {a: {_id: 'a', _type: 'doc', _rev: 'seed'}},
      [{patch: {id: 'a', ifRevisionID: 'seed', set: {title: 'x'}}}],
      'tx-1',
    )
    expect(index.a?.title).toBe('x')
  })
})
