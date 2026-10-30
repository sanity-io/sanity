import {type SanityDocument} from '@sanity/types'
import {afterEach, describe, expect, test} from 'vitest'

import {
  expectConverged,
  expectHealthy,
  expectNoLostEdits,
  keysOf,
} from '../../../../../test/sync/oracles'
import {
  createWorld,
  runSteps,
  type SyncTestDefinition,
  type World,
} from '../../../../../test/sync/syncTest'

const PUBLISHED_ID = 'article-3'
const DRAFT_ID = 'drafts.article-3'
const idPair = {publishedId: PUBLISHED_ID, draftId: DRAFT_ID}
const FIELD = 'items'

const initial: SanityDocument = {
  _id: DRAFT_ID,
  _type: 'article',
  _rev: 'seed',
  _createdAt: '2026-01-01T00:00:00.000Z',
  _updatedAt: '2026-01-01T00:00:00.000Z',
  [FIELD]: [{_key: 'a', _type: 'item', title: 'A'}],
}

const definition: SyncTestDefinition = {
  id: 'LSN-LOST-EVENT',
  title:
    "B never receives A's event; B's own later edit cannot chain and the deadline recovery kicks in",
  seam: 'pair',
  initial: [initial],
  idPair,
  clients: ['A', 'B'],
  steps: [
    {client: 'B', do: 'listener', mode: 'hold'},
    {
      client: 'A',
      do: 'patch',
      id: DRAFT_ID,
      patches: [{insert: {after: `${FIELD}[_key=="a"]`, items: [{_key: 'x', _type: 'item'}]}}],
    },
    {client: 'A', do: 'commit'},
    {do: 'advance', ms: 10},
    {
      client: 'B',
      do: 'patch',
      id: DRAFT_ID,
      patches: [{set: {[`${FIELD}[_key=="a"].title`]: 'A by B'}}],
    },
    {client: 'B', do: 'commit'},
    {do: 'advance', ms: 10},
    {client: 'B', do: 'dropEvent'},
    {client: 'B', do: 'listener', mode: 'auto'},
    {client: 'B', do: 'releaseEvents'},
  ],
}

let world: World | undefined
afterEach(() => {
  world?.teardown()
  world = undefined
})

describe('a lost listener event', () => {
  test('LSN-LOST-EVENT: B is stale until the chain deadline, then recovers and converges', async () => {
    const lostEventWorld = await createWorld(definition)
    world = lostEventWorld
    await runSteps(lostEventWorld, definition.steps)

    expect(lostEventWorld.lake.transactions.map((transaction) => transaction.identity)).toEqual([
      'A',
      'B',
    ])
    expect(keysOf(lostEventWorld.clients.B.localDocument(DRAFT_ID), FIELD)).toEqual(['a'])
    expect(() => expectConverged(lostEventWorld)).toThrow()

    // Just under the 30 s resolve-chain deadline.
    await lostEventWorld.advance(29_000)
    expect(keysOf(lostEventWorld.clients.B.localDocument(DRAFT_ID), FIELD)).toEqual(['a'])

    await lostEventWorld.settle()
    expectHealthy(lostEventWorld)
    expectConverged(lostEventWorld)
    expectNoLostEdits(lostEventWorld)
    expect(keysOf(lostEventWorld.lake.get(DRAFT_ID), FIELD)).toEqual(['a', 'x'])
    expect(lostEventWorld.lake.get(DRAFT_ID)?.[FIELD]).toEqual([
      {_key: 'a', _type: 'item', title: 'A by B'},
      {_key: 'x', _type: 'item'},
    ])
  })
})
