import {type SanityDocument} from '@sanity/types'
import {afterEach, describe, expect, test} from 'vitest'

import {expectConverged, expectHealthy, keysOf} from '../../../../../test/sync/oracles'
import {runSyncTest, type SyncTestDefinition, type World} from '../../../../../test/sync/syncTest'

const PUBLISHED_ID = 'article-6'
const DRAFT_ID = 'drafts.article-6'
const idPair = {publishedId: PUBLISHED_ID, draftId: DRAFT_ID}
const FIELD = 'items'

const initial: SanityDocument = {
  _id: DRAFT_ID,
  _type: 'article',
  _rev: 'seed',
  _createdAt: '2026-01-01T00:00:00.000Z',
  _updatedAt: '2026-01-01T00:00:00.000Z',
  [FIELD]: [
    {_key: 'a', _type: 'item', title: 'A'},
    {_key: 'b', _type: 'item', title: 'B'},
  ],
  title: 'seed',
}

const definition: SyncTestDefinition = {
  id: 'LSN-STALL-OWN-SAVE',
  title: "B's listener goes silent; A deletes an item; B saves and its save is never echoed",
  seam: 'pair',
  initial: [initial],
  idPair,
  clients: ['A', 'B'],
  steps: [
    {client: 'B', do: 'listener', mode: 'hold'},
    {client: 'A', do: 'patch', id: DRAFT_ID, patches: [{unset: [`${FIELD}[_key=="a"]`]}]},
    {client: 'A', do: 'commit'},
    {do: 'advance', ms: 10},
    {client: 'B', do: 'patch', id: DRAFT_ID, patches: [{set: {title: 'from B'}}]},
    {client: 'B', do: 'commit'},
    {do: 'advance', ms: 10},
    {client: 'B', do: 'listener', mode: 'auto'},
  ],
}

let world: World | undefined
afterEach(() => {
  world?.teardown()
  world = undefined
})

describe('a silent listener', () => {
  // The listener never echoes B's own save, so B stays stuck on the deleted item and never recovers.
  test.fails('LSN-STALL-OWN-SAVE: B restarts its silent listener, converges and sees the deleted item gone', async () => {
    const stalledWorld = await runSyncTest(definition)
    world = stalledWorld
    await stalledWorld.settle()

    expectHealthy(stalledWorld)
    expectConverged(stalledWorld)
    expect(keysOf(stalledWorld.clients.B.localDocument(DRAFT_ID), FIELD)).toEqual(['b'])
    expect(stalledWorld.clients.B.localDocument(DRAFT_ID)?.title).toBe('from B')
  })
})
