import {describe, expect, it} from 'vitest'

import {actionsToMutations} from './actionsToMutations'
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

function errorOf(run: () => unknown): ContentLakeError {
  try {
    run()
  } catch (error) {
    if (error instanceof ContentLakeError) return error
    throw error
  }
  throw new Error('Expected a ContentLakeError')
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
    const error = errorOf(() =>
      commit(index, [{patch: {id: 'a', ifRevisionID: 'stale', set: {title: 'x'}}}], 'tx-1'),
    )
    expect(error.statusCode).toBe(409)
    expect(error.body).toEqual({
      description:
        'Mutation failed: Document "a" has unexpected revision ID ("seed"), expected "stale"',
      items: [
        {
          error: {
            currentRevisionID: 'seed',
            description: 'Document "a" has unexpected revision ID ("seed"), expected "stale"',
            expectedRevisionID: 'stale',
            type: 'documentRevisionIDDoesNotMatchError',
          },
          index: 0,
        },
      ],
      type: 'mutationError',
    })
  })

  it('applies a patch whose ifRevisionID matches', () => {
    const {index} = commit(
      {a: {_id: 'a', _type: 'doc', _rev: 'seed'}},
      [{patch: {id: 'a', ifRevisionID: 'seed', set: {title: 'x'}}}],
      'tx-1',
    )
    expect(index.a?.title).toBe('x')
  })

  it('rejects a patch on a missing document with a 404, even with an ifRevisionID', () => {
    const error = errorOf(() =>
      commit(
        {a: {_id: 'a', _type: 'doc', _rev: 'seed'}},
        [
          {patch: {id: 'a', set: {title: 'x'}}},
          {patch: {id: 'missing', ifRevisionID: 'whatever', set: {title: 'x'}}},
        ],
        'tx-1',
      ),
    )
    expect(error.statusCode).toBe(404)
    expect(error.body).toEqual({
      description: 'Mutation failed: The document with the ID "missing" was not found',
      items: [
        {
          error: {
            description: 'The document with the ID "missing" was not found',
            id: 'missing',
            type: 'documentNotFoundError',
          },
          index: 1,
        },
      ],
      type: 'mutationError',
    })
  })

  it('rejects a create of an existing document with a 409', () => {
    const error = errorOf(() =>
      commit(
        {a: {_id: 'a', _type: 'doc', _rev: 'seed'}},
        [{create: {_id: 'a', _type: 'doc'}}],
        'tx-1',
      ),
    )
    expect(error.statusCode).toBe(409)
    expect(error.body).toMatchObject({
      description: 'Mutation failed: Document by ID "a" already exists',
      items: [{error: {id: 'a', type: 'documentAlreadyExistsError'}, index: 0}],
      type: 'mutationError',
    })
  })

  it('patches a document created earlier in the same transaction', () => {
    const {index, results} = commit(
      {},
      [{create: {_id: 'a', _type: 'doc', title: 'a'}}, {patch: {id: 'a', set: {title: 'b'}}}],
      'tx-1',
    )
    expect(index.a?.title).toBe('b')
    expect(results).toEqual([{id: 'a', operation: 'create'}])
  })

  it.each(['set', 'setIfMissing'])('creates missing parent objects for a dotted %s path', (op) => {
    const {index} = commit(
      {a: {_id: 'a', _type: 'doc', _rev: 'seed'}},
      [{patch: {id: 'a', [op]: {'outer.inner.leaf': 'v'}}}],
      'tx-1',
    )
    expect(index.a?.outer).toEqual({inner: {leaf: 'v'}})
  })

  it('materialises a draft from published through an edit action like Content Lake', () => {
    const published = {
      _id: 'a',
      _type: 'doc',
      _rev: 'published-rev',
      _createdAt: '2025-06-01T00:00:00.000Z',
      _updatedAt: '2025-06-01T00:00:00.000Z',
      title: 'published',
    }
    const mutations = actionsToMutations({a: published}, [
      {
        actionType: 'sanity.action.document.edit',
        draftId: 'drafts.a',
        publishedId: 'a',
        patch: {set: {title: 'edited'}},
      },
    ])
    const {index, events} = commit({a: published}, mutations, 'tx-1')
    expect(index['drafts.a']).toEqual({
      _id: 'drafts.a',
      _type: 'doc',
      _rev: 'tx-1',
      _createdAt: '2025-06-01T00:00:00.000Z',
      _updatedAt: TIMESTAMP,
      _system: {base: {id: 'a', rev: 'published-rev'}},
      title: 'edited',
    })
    expect(index.a).toEqual(published)
    expect(events).toHaveLength(1)
    expect(events[0]).toMatchObject({documentId: 'drafts.a', transition: 'appear', mutations})
  })
})
