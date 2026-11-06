import {type SanityDocument} from '@sanity/types'
import {afterEach, describe, expect, test} from 'vitest'

import {type SubmissionRecord} from '../../../../../test/sync/fakeContentLake'
import {describeLostEdit, lostEdits} from '../../../../../test/sync/lostEdits'
import {expectNoLostEdits} from '../../../../../test/sync/oracles'
import {
  type EditRecord,
  runSyncTest,
  type SyncTestDefinition,
  type World,
} from '../../../../../test/sync/syncTest'
import {captureUnhandledRejections} from '../../../../../test/sync/unhandledRejections'

const PUBLISHED_ID = 'article-7'
const DRAFT_ID = 'drafts.article-7'
const idPair = {publishedId: PUBLISHED_ID, draftId: DRAFT_ID}

const initial: SanityDocument = {
  _id: DRAFT_ID,
  _type: 'article',
  _rev: 'seed',
  _createdAt: '2026-01-01T00:00:00.000Z',
  _updatedAt: '2026-01-01T00:00:00.000Z',
  title: 'seed',
}

let world: World | undefined
afterEach(() => {
  world?.teardown()
  world = undefined
})

describe('lost edits', () => {
  test('EDIT-LOST-DMP-AFTER-UNSET (SAPP-4792): an edit made while someone else unsets the field still reaches the server', async () => {
    const syncTest: SyncTestDefinition = {
      id: 'EDIT-LOST-DMP-AFTER-UNSET',
      title: 'A sets the title, an outside edit unsets it, then A commits',
      seam: 'pair',
      initial: [initial],
      idPair,
      clients: ['A'],
      steps: [
        {client: 'A', do: 'patch', id: DRAFT_ID, patches: [{set: {title: 'one'}}]},
        {do: 'outside', mutations: [{patch: {id: DRAFT_ID, unset: ['title']}}]},
        {client: 'A', do: 'commit'},
        {do: 'advance', ms: 5_000},
      ],
    }
    const unhandled = captureUnhandledRejections()
    world = await runSyncTest(syncTest).finally(unhandled.stop)

    expectNoLostEdits(world)
    expect(world.lake.get(DRAFT_ID)?.title).toBe('one')
    expect(unhandled.reasons).toEqual([])
  })

  test('EDIT-LOST-DMP-ON-REMOVED-FIELD: an edit saved after someone else removed the field still reaches the server', async () => {
    const syncTest: SyncTestDefinition = {
      id: 'EDIT-LOST-DMP-ON-REMOVED-FIELD',
      title: 'B sets the title, A unsets it and saves, then B saves before seeing the unset',
      seam: 'pair',
      initial: [initial],
      idPair,
      clients: ['A', 'B'],
      steps: [
        {client: 'B', do: 'listener', mode: 'hold'},
        {client: 'B', do: 'patch', id: DRAFT_ID, patches: [{set: {title: 'one'}}]},
        {client: 'A', do: 'patch', id: DRAFT_ID, patches: [{unset: ['title']}]},
        {client: 'A', do: 'commit'},
        {client: 'B', do: 'commit'},
        {client: 'B', do: 'listener', mode: 'auto'},
        {client: 'B', do: 'releaseEvents'},
        {do: 'settle'},
      ],
    }
    const unhandled = captureUnhandledRejections()
    world = await runSyncTest(syncTest).finally(unhandled.stop)

    expectNoLostEdits(world)
    expect(world.lake.get(DRAFT_ID)?.title).toBe('one')
    expect(unhandled.reasons).toEqual([])
  })

  test('EDIT-REJECTED-ON-PURPOSE: an edit discarded by an injected 409 is accounted for', async () => {
    const syncTest: SyncTestDefinition = {
      id: 'EDIT-REJECTED-ON-PURPOSE',
      title: 'A commits a title and the server answers 409',
      seam: 'pair',
      initial: [initial],
      idPair,
      clients: ['A'],
      steps: [
        {client: 'A', do: 'commits', mode: 'hold'},
        {client: 'A', do: 'patch', id: DRAFT_ID, patches: [{set: {title: 'one'}}]},
        {client: 'A', do: 'commit'},
        {client: 'A', do: 'rejectCommit', statusCode: 409},
        {do: 'settle'},
      ],
    }
    world = await runSyncTest(syncTest)

    expect(world.lake.get(DRAFT_ID)?.title).toBe('seed')
    expectNoLostEdits(world)
  })

  test('EDIT-LOST-ITEM-RENAME-BEHIND-INSERT: a save that only inserts an item does not account for a pending rename of another item', () => {
    function withItemTitle(title: string): SanityDocument {
      return {...initial, items: [{_key: 'a', _type: 'item', title}]}
    }
    const rename: EditRecord = {
      client: 'A',
      documentId: DRAFT_ID,
      at: 0,
      before: withItemTitle('A'),
      after: withItemTitle('one'),
      mutations: [{patch: {id: DRAFT_ID, set: {'items[_key=="a"].title': 'one'}}}],
    }
    const insert: EditRecord = {
      client: 'A',
      documentId: DRAFT_ID,
      at: 0,
      before: withItemTitle('one'),
      after: withItemTitle('one'),
      mutations: [
        {patch: {id: DRAFT_ID, setIfMissing: {items: []}}},
        {patch: {id: DRAFT_ID, insert: {after: 'items[-1]', items: [{_key: 'k1'}]}}},
      ],
    }
    const insertOnlySave: SubmissionRecord = {
      clientId: 'A',
      transactionId: 'insert-only',
      submittedAt: 1,
      settledAt: 2,
      outcome: 'accepted',
      mutations: insert.mutations,
    }
    const lake = {submissions: [insertOnlySave]}
    const lostRename = ['A {"set":{"items[_key==\\"a\\"].title":"one"}} on drafts.article-7']

    expect(lostEdits({edits: [rename], lake}).map(describeLostEdit)).toEqual(lostRename)
    expect(lostEdits({edits: [rename, insert], lake}).map(describeLostEdit)).toEqual(lostRename)
  })

  test('EDIT-LOST-BEHIND-UNRELATED-REJECTION: an injected 409 on a later save does not account for an earlier edit it never carried', () => {
    const lostTitle: EditRecord = {
      client: 'A',
      documentId: DRAFT_ID,
      at: 0,
      before: initial,
      after: {...initial, title: 'one'},
      mutations: [{patch: {id: DRAFT_ID, set: {title: 'one'}}}],
    }
    const later: EditRecord = {
      client: 'A',
      documentId: DRAFT_ID,
      at: 3,
      before: {...initial, title: 'one'},
      after: {...initial, title: 'one', subtitle: 'two'},
      mutations: [{patch: {id: DRAFT_ID, set: {subtitle: 'two'}}}],
    }
    const unrelatedSave: SubmissionRecord = {
      clientId: 'A',
      transactionId: 'unrelated',
      submittedAt: 1,
      settledAt: 2,
      outcome: 'accepted',
      mutations: [{patch: {id: DRAFT_ID, set: {other: 1}}}],
    }
    const rejectedLater: SubmissionRecord = {
      clientId: 'A',
      transactionId: 'rejected-later',
      submittedAt: 4,
      settledAt: 5,
      outcome: 'rejected',
      statusCode: 409,
      injected: true,
      mutations: later.mutations,
    }
    const lake = {submissions: [unrelatedSave, rejectedLater]}

    expect(lostEdits({edits: [lostTitle, later], lake}).map(describeLostEdit)).toEqual([
      'A {"set":{"title":"one"}} on drafts.article-7',
    ])
  })

  test('EDIT-SUPERSEDED-LOCALLY: an edit undone by a later edit before saving is accounted for', async () => {
    const syncTest: SyncTestDefinition = {
      id: 'EDIT-SUPERSEDED-LOCALLY',
      title: 'A saves "one", then types "two" and back to "one" before saving again',
      seam: 'pair',
      initial: [initial],
      idPair,
      clients: ['A'],
      steps: [
        {client: 'A', do: 'patch', id: DRAFT_ID, patches: [{set: {title: 'one'}}]},
        {client: 'A', do: 'commit'},
        {do: 'advance', ms: 10},
        {client: 'A', do: 'patch', id: DRAFT_ID, patches: [{set: {title: 'two'}}]},
        {client: 'A', do: 'patch', id: DRAFT_ID, patches: [{set: {title: 'one'}}]},
        {client: 'A', do: 'commit'},
        {do: 'advance', ms: 10},
      ],
    }
    world = await runSyncTest(syncTest)

    expect(world.lake.submissions).toHaveLength(1)
    expect(world.lake.get(DRAFT_ID)?.title).toBe('one')
    expectNoLostEdits(world)
  })
})
