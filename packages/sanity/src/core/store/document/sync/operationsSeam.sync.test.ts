import {type SanityDocument} from '@sanity/types'
import {afterEach, describe, expect, test} from 'vitest'

import {
  expectConverged,
  expectHealthy,
  expectNoLostEdits,
  expectRevisionsAgree,
  keysOf,
} from '../../../../../test/sync/oracles'
import {runSyncTest, type SyncTestDefinition, type World} from '../../../../../test/sync/syncTest'
import {captureUnhandledRejections} from '../../../../../test/sync/unhandledRejections'
import {createSchema} from '../../../schema/createSchema'

const schema = createSchema({
  name: 'sync',
  types: [
    {
      name: 'article',
      type: 'document',
      fields: [
        {name: 'title', type: 'string'},
        {
          name: 'items',
          type: 'array',
          of: [{type: 'object', name: 'item', fields: [{name: 'title', type: 'string'}]}],
        },
      ],
    },
  ],
})

const PUBLISHED_ID = 'article-5'
const DRAFT_ID = 'drafts.article-5'
const idPair = {publishedId: PUBLISHED_ID, draftId: DRAFT_ID}

function document(id: string, title: string): SanityDocument {
  return {
    _id: id,
    _type: 'article',
    _rev: 'seed',
    _createdAt: '2026-01-01T00:00:00.000Z',
    _updatedAt: '2026-01-01T00:00:00.000Z',
    title,
    items: [{_key: 'a', _type: 'item', title: 'A'}],
  }
}

let world: World | undefined
afterEach(() => {
  world?.teardown()
  world = undefined
})

describe('editOperations and editState, two clients', () => {
  test('OPS-AUTOCOMMIT-CONCURRENT: two clients typing into different fields both land through autocommit', async () => {
    const syncTest: SyncTestDefinition = {
      id: 'OPS-AUTOCOMMIT-CONCURRENT',
      title: 'A types a title and B appends an item within the same autocommit window',
      seam: 'operations',
      initial: [document(PUBLISHED_ID, 'Published'), document(DRAFT_ID, 'Draft')],
      idPair,
      clients: ['A', 'B'],
      steps: [
        {client: 'A', do: 'listener', mode: 'auto', latencyMs: 150},
        {client: 'B', do: 'listener', mode: 'auto', latencyMs: 150},
        {client: 'A', do: 'commits', mode: 'auto', latencyMs: 400},
        {client: 'B', do: 'commits', mode: 'auto', latencyMs: 400},
        {client: 'A', do: 'patch', id: DRAFT_ID, patches: [{set: {title: 'Draft by A'}}]},
        {do: 'advance', ms: 100},
        {
          client: 'B',
          do: 'patch',
          id: DRAFT_ID,
          patches: [
            {insert: {after: 'items[-1]', items: [{_key: 'b', _type: 'item', title: 'B'}]}},
          ],
        },
        {do: 'advance', ms: 300},
        {client: 'A', do: 'patch', id: DRAFT_ID, patches: [{set: {title: 'Draft by A, again'}}]},
        {do: 'settle'},
      ],
    }
    world = await runSyncTest(syncTest, {schema, typeName: 'article'})

    expectHealthy(world)
    expectConverged(world)
    expectNoLostEdits(world)
    expectRevisionsAgree(world)
    const server = world.lake.get(DRAFT_ID)
    expect(server?.title).toBe('Draft by A, again')
    expect(keysOf(server, 'items')).toEqual(['a', 'b'])
    expect(world.lake.transactions.length).toBeGreaterThanOrEqual(2)
  })

  const editWithoutDraft: SyncTestDefinition = {
    id: 'OPS-EDIT-WITHOUT-DRAFT',
    title: 'Only a published document exists; A edits it and B watches',
    seam: 'operations',
    initial: [document(PUBLISHED_ID, 'Published')],
    idPair,
    clients: ['A', 'B'],
    steps: [
      {client: 'A', do: 'patch', id: DRAFT_ID, patches: [{set: {title: 'Edited by A'}}]},
      {do: 'settle'},
    ],
  }

  test('OPS-EDIT-WITHOUT-DRAFT: the first edit creates the draft from the published document', async () => {
    world = await runSyncTest(editWithoutDraft, {schema, typeName: 'article'})

    expectHealthy(world)
    expectNoLostEdits(world)
    expectRevisionsAgree(world)
    expect(world.lake.get(DRAFT_ID)?.title).toBe('Edited by A')
    expect(world.lake.get(PUBLISHED_ID)?.title).toBe('Published')
    expect(world.clients.B.localDocument(DRAFT_ID)?.title).toBe('Edited by A')
  })

  test.fails('OPS-EDIT-WITHOUT-DRAFT-SYSTEM-BASE (SAPP-4795): the editor sees the server-added _system on the draft it created', async () => {
    world = await runSyncTest(editWithoutDraft, {schema, typeName: 'article'})

    expect(world.clients.A.localDocument(DRAFT_ID)?._system).toEqual(
      world.lake.get(DRAFT_ID)?._system,
    )
  })

  test('OPS-REJECTED-SAVE-WITH-QUEUED-SAVE (SAPP-4794): a terminal rejection with a save queued behind it raises no unhandled rejection', async () => {
    const syncTest: SyncTestDefinition = {
      id: 'OPS-REJECTED-SAVE-WITH-QUEUED-SAVE',
      title: 'A holds a save, queues a second behind it, and the server answers 409 to the first',
      seam: 'operations',
      initial: [document(PUBLISHED_ID, 'Published'), document(DRAFT_ID, 'Draft')],
      idPair,
      clients: ['A'],
      steps: [
        {client: 'A', do: 'commits', mode: 'hold'},
        {
          client: 'A',
          do: 'patch',
          id: DRAFT_ID,
          patches: [{set: {'items[_key=="a"].title': 'one'}}],
        },
        {client: 'A', do: 'patch', id: DRAFT_ID, patches: [{set: {title: 'one'}}]},
        {client: 'A', do: 'commit'},
        {client: 'A', do: 'rejectCommit', statusCode: 409},
        {client: 'A', do: 'commits', mode: 'auto'},
        {client: 'A', do: 'commit'},
        {do: 'advance', ms: 5_000},
      ],
    }
    const unhandled = captureUnhandledRejections()
    world = await runSyncTest(syncTest, {schema, typeName: 'article'}).finally(unhandled.stop)

    expectConverged(world)
    expect(unhandled.reasons).toEqual([])
  })
})
