import {type SanityDocument} from '@sanity/types'
import {afterEach, describe, expect, test} from 'vitest'

import {runSyncTest, type SyncTestDefinition, type World} from '../../../../../test/sync/syncTest'

const PUBLISHED_ID = 'article-8'
const DRAFT_ID = 'drafts.article-8'
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

describe('edits with no net change', () => {
  test('NOOP-SET-TO-CURRENT-VALUE (SAPP-4793): setting a field to the value it already has leaves the client in sync', async () => {
    const syncTest: SyncTestDefinition = {
      id: 'NOOP-SET-TO-CURRENT-VALUE',
      title: 'Someone else sets the title to "one", then A sets it to "one" and commits',
      seam: 'pair',
      initial: [initial],
      idPair,
      clients: ['A'],
      steps: [
        {do: 'outside', mutations: [{patch: {id: DRAFT_ID, set: {title: 'one'}}}]},
        {client: 'A', do: 'patch', id: DRAFT_ID, patches: [{set: {title: 'one'}}]},
        {client: 'A', do: 'commit'},
        {do: 'advance', ms: 5_000},
      ],
    }
    world = await runSyncTest(syncTest)

    expect(world.clients.A.consistent(), 'A consistent').toBe(true)
  })
})
