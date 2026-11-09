import {type SanityDocument} from '@sanity/types'
import {afterEach, describe, expect, test} from 'vitest'

import {runSyncTest, type Step, type World} from '../../../../../test/sync/syncTest'

const PUBLISHED_ID = 'article-7'
const DRAFT_ID = 'drafts.article-7'
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

const PAST_THE_LISTENER_DEADLINE_MS = 31_000

const deleteDraftFromOutside: Step = {do: 'outside', mutations: [{delete: {id: DRAFT_ID}}]}

let world: World | undefined
afterEach(() => {
  world?.teardown()
  world = undefined
})

describe('a delete after a snapshot with no draft', () => {
  test('LSN-NULL-SNAPSHOT-REVERSED-CREATE-DELETE: B applies a create and delete delivered in reverse', async () => {
    world = await runSyncTest({
      id: 'LSN-NULL-SNAPSHOT-REVERSED-CREATE-DELETE',
      title: 'B has no draft; someone creates and deletes it, and B gets the delete first',
      seam: 'pair',
      evidence: 'L2',
      initial: [document(PUBLISHED_ID, 'Published title')],
      idPair,
      clients: ['B'],
      steps: [
        {
          client: 'B',
          do: 'listener',
          mode: 'hold',
          represents: 'events from two transactions delivered out of order',
        },
        {do: 'outside', mutations: [{create: {_id: DRAFT_ID, _type: 'article', title: 'Draft'}}]},
        deleteDraftFromOutside,
        {client: 'B', do: 'listener', mode: 'auto'},
        {client: 'B', do: 'releaseEvents', order: 'reverse'},
        {do: 'advance', ms: PAST_THE_LISTENER_DEADLINE_MS},
      ],
    })

    expect(world.clients.B.localDocument(DRAFT_ID)).toBeNull()
    expect(world.clients.B.syncErrorRecoveries()).toEqual([])
  })

  // Waits out the 30s deadline and resyncs: safe but slow. A shorter grace period needs onSyncErrorRecovery data.
  test.fails('LSN-DELETE-DURING-SNAPSHOT-READ: B takes a delete committed while it read the snapshot without resyncing', async () => {
    world = await runSyncTest({
      id: 'LSN-DELETE-DURING-SNAPSHOT-READ',
      title: 'B reconnects with a reset; the draft is deleted before B reads the snapshot',
      seam: 'pair',
      evidence: 'L2',
      knownBug: 'C3',
      initial: [document(PUBLISHED_ID, 'Published title'), document(DRAFT_ID, 'Draft title')],
      idPair,
      clients: ['B'],
      steps: [
        {client: 'B', do: 'snapshots', latencyMs: 100},
        {client: 'B', do: 'disconnect', represents: 'a network drop'},
        {client: 'B', do: 'reconnect', resume: false},
        deleteDraftFromOutside,
        {do: 'advance', ms: 200},
        {client: 'B', do: 'snapshots', latencyMs: 0},
        {do: 'advance', ms: PAST_THE_LISTENER_DEADLINE_MS},
      ],
    })

    expect(world.clients.B.localDocument(DRAFT_ID)).toBeNull()
    expect(world.clients.B.syncErrorRecoveries()).toEqual([])
  })
})
