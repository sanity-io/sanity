import {type SanityDocument} from '@sanity/types'
import {afterEach, describe, expect, test} from 'vitest'

import {expectConverged} from '../../../../../test/sync/oracles'
import {
  runSyncTest,
  type SyncTestDefinition,
  type Step,
  type World,
} from '../../../../../test/sync/syncTest'
import {createSchema} from '../../../schema/createSchema'
import {DEFAULT_DEADLINE_MS} from '../utils/sequentializeListenerEvents'

const schema = createSchema({
  name: 'sync',
  types: [{name: 'article', type: 'document', fields: [{name: 'title', type: 'string'}]}],
})

const PUBLISHED_ID = 'article-2'
const DRAFT_ID = 'drafts.article-2'
const idPair = {publishedId: PUBLISHED_ID, draftId: DRAFT_ID}

function document(id: string, title: string): SanityDocument {
  return {
    _id: id,
    _type: 'article',
    _rev: 'seed',
    _createdAt: '2026-01-01T00:00:00.000Z',
    _updatedAt: '2026-01-01T00:00:00.000Z',
    title,
  }
}

const publishFromOutside: Step = {
  do: 'outside',
  mutations: [
    {createOrReplace: {_id: PUBLISHED_ID, _type: 'article', title: 'Draft title'}},
    {delete: {id: DRAFT_ID}},
  ],
}

function reconnectMidTransaction(resume: boolean): SyncTestDefinition {
  return {
    id: resume ? 'LSN-RECONNECT-MID-TX-RESUME' : 'LSN-RECONNECT-MID-TX-RESET',
    title: `B receives event 1 of 2, the connection drops, and comes back with ${resume ? 'welcomeback' : 'reset'}`,
    seam: 'pair',
    evidence: 'L2',
    initial: [document(PUBLISHED_ID, 'Published title'), document(DRAFT_ID, 'Draft title')],
    idPair,
    clients: ['A', 'B'],
    steps: [
      {client: 'B', do: 'listener', mode: 'hold', represents: 'listener latency'},
      publishFromOutside,
      {client: 'B', do: 'releaseEvents', count: 1},
      {client: 'B', do: 'disconnect', represents: 'a network drop'},
      {client: 'B', do: 'reconnect', resume},
      {client: 'B', do: 'listener', mode: 'auto'},
      {client: 'B', do: 'releaseEvents'},
      {do: 'settle'},
    ],
  }
}

let world: World | undefined
afterEach(() => {
  world?.teardown()
  world = undefined
})

describe('listener reconnect in the middle of a two-event transaction', () => {
  test('LSN-RECONNECT-MID-TX: A, whose listener stayed up, sees the publish', async () => {
    world = await runSyncTest(reconnectMidTransaction(true))
    expect(world.clients.A.localDocument(DRAFT_ID)).toBeNull()
    expect(world.clients.A.localDocument(PUBLISHED_ID)?.title).toBe('Draft title')
    expect(world.clients.A.transactionLocked()).toBe(false)
    expect(world.clients.A.syncErrorRecoveries()).toEqual([])
    expect(world.clients.B.syncErrorRecoveries()).toEqual([])
  })

  test('LSN-RECONNECT-MID-TX-RESUME: B converges after a resumed reconnect', async () => {
    world = await runSyncTest(reconnectMidTransaction(true))
    expect(world.clients.B.localDocument(DRAFT_ID)).toBeNull()
    expect(world.clients.B.transactionLocked()).toBe(false)
    expect(world.clients.B.syncErrorRecoveries()).toEqual([])
  })

  test("LSN-RECONNECT-MID-TX-RESUME-LOCK: B's form unlocks after a resumed reconnect", async () => {
    world = await runSyncTest(
      {
        ...reconnectMidTransaction(true),
        id: 'LSN-RECONNECT-MID-TX-RESUME-LOCK',
        seam: 'operations',
      },
      {schema, typeName: 'article'},
    )
    expect(world.clients.B.transactionLocked()).toBe(false)
    expect(world.clients.B.syncErrorRecoveries()).toEqual([])
  })

  test("LSN-RECONNECT-MID-TX-DEADLINE-LOCK: B's form unlocks once a transaction left open passes its deadline", async () => {
    world = await runSyncTest(
      {
        id: 'LSN-RECONNECT-MID-TX-DEADLINE-LOCK',
        title: 'B receives event 1 of 2, the connection resumes, and event 2 never arrives',
        seam: 'operations',
        evidence: 'L3',
        initial: [document(PUBLISHED_ID, 'Published title'), document(DRAFT_ID, 'Draft title')],
        idPair,
        clients: ['A', 'B'],
        steps: [
          {client: 'B', do: 'listener', mode: 'hold', represents: 'listener latency'},
          publishFromOutside,
          {client: 'B', do: 'releaseEvents', count: 1},
          {client: 'B', do: 'disconnect', represents: 'a network drop'},
          {client: 'B', do: 'reconnect', resume: true},
          {
            client: 'B',
            do: 'dropEvent',
            represents: 'a resumed stream that never replays the rest of the transaction',
          },
          {client: 'B', do: 'listener', mode: 'auto'},
          {do: 'advance', ms: DEFAULT_DEADLINE_MS},
          {do: 'settle'},
        ],
      },
      {schema, typeName: 'article'},
    )
    expect(world.clients.B.transactionLocked()).toBe(false)
    expect(world.clients.B.syncErrorRecoveries()).toMatchObject([
      {name: 'TransactionDeadlineExceededError'},
    ])
  })

  test('LSN-RECONNECT-MID-TX-RESET: B converges after a reset, because the snapshot is refetched', async () => {
    world = await runSyncTest(reconnectMidTransaction(false))
    expectConverged(world)
  })

  test('LSN-RECONNECT-MID-TX-RESET: B releases the pending-transaction lock after a reset', async () => {
    world = await runSyncTest(reconnectMidTransaction(false))
    expect(world.clients.B.transactionLocked()).toBe(false)
  })

  test('LSN-RECONNECT-MID-TX-RESET-FORM: B can edit and publish again after a reset', async () => {
    world = await runSyncTest(
      {
        ...reconnectMidTransaction(false),
        id: 'LSN-RECONNECT-MID-TX-RESET-FORM',
        seam: 'operations',
      },
      {schema, typeName: 'article'},
    )
    expect(world.clients.B.transactionLocked()).toBe(false)
  })
})
