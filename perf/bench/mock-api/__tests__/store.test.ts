import {describe, expect, it} from 'vitest'

import {BENCH_USER} from '../../constants'
import {DocumentStore} from '../store'

describe('DocumentStore', () => {
  it('stamps seeded documents with the fixed seed revision and timestamps', () => {
    const store = new DocumentStore()
    store.seed([{_id: 'a', _type: 'doc'}])
    expect(store.get('a')).toEqual({
      _id: 'a',
      _type: 'doc',
      _rev: 'seed',
      _createdAt: '2020-01-01T00:00:00.000Z',
      _updatedAt: '2020-01-01T00:00:00.000Z',
    })
  })

  it('chains commits from the seeded revision as the bench user', () => {
    const store = new DocumentStore()
    store.seed([{_id: 'drafts.a', _type: 'singleString'}])
    const first = store.commit([{patch: {id: 'drafts.a', set: {stringField: 'x'}}}], 'tx-1')
    expect(first.events[0]).toMatchObject({
      previousRev: 'seed',
      resultRev: 'tx-1',
      identity: BENCH_USER.id,
    })
    const second = store.commit([{patch: {id: 'drafts.a', set: {stringField: 'xy'}}}], 'tx-2')
    expect(second.events[0]).toMatchObject({previousRev: 'tx-1', resultRev: 'tx-2'})
    expect(store.get('drafts.a')).toMatchObject({stringField: 'xy', _rev: 'tx-2'})
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
