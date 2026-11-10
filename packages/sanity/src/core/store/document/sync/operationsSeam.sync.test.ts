import {type SanityDocument} from '@sanity/types'
import {afterEach, describe, expect, test} from 'vitest'

import {expectQuiescent, expectRevisionsAgree, keysOf} from '../../../../../test/sync/oracles'
import {
  createWorld,
  runSteps,
  runSyncTest,
  type SyncTestDefinition,
  type World,
} from '../../../../../test/sync/syncTest'
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
    {
      name: 'liveArticle',
      type: 'document',
      liveEdit: true,
      fields: [{name: 'title', type: 'string'}],
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
      evidence: 'L2',
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

    expectRevisionsAgree(world)
    const server = world.lake.get(DRAFT_ID)
    expect(server?.title).toBe('Draft by A, again')
    expect(keysOf(server, 'items')).toEqual(['a', 'b'])
    expect(world.lake.transactions.length).toBeGreaterThanOrEqual(2)
  })

  test('OPS-EDIT-WITHOUT-DRAFT: the first edit creates the draft from the published document', async () => {
    const syncTest: SyncTestDefinition = {
      id: 'OPS-EDIT-WITHOUT-DRAFT',
      title: 'Only a published document exists; A edits it and B watches',
      seam: 'operations',
      evidence: 'L1',
      initial: [document(PUBLISHED_ID, 'Published')],
      idPair,
      clients: ['A', 'B'],
      steps: [
        {client: 'A', do: 'patch', id: DRAFT_ID, patches: [{set: {title: 'Edited by A'}}]},
        {do: 'settle'},
      ],
    }
    world = await runSyncTest(syncTest, {schema, typeName: 'article'})

    expectRevisionsAgree(world)
    expect(world.lake.get(DRAFT_ID)?.title).toBe('Edited by A')
    expect(world.lake.get(PUBLISHED_ID)?.title).toBe('Published')
    expect(world.lake.get(DRAFT_ID)?._system).toEqual({base: {id: PUBLISHED_ID, rev: 'seed'}})
    expect(world.clients.B.localDocument(DRAFT_ID)?.title).toBe('Edited by A')
  })
})

describe('editOperations and editState, live-edit document', () => {
  const LIVE_ID = 'live-article-1'
  const liveIdPair = {publishedId: LIVE_ID, draftId: `drafts.${LIVE_ID}`}
  const liveDocument: SanityDocument = {
    _id: LIVE_ID,
    _type: 'liveArticle',
    _rev: 'seed',
    _createdAt: '2026-01-01T00:00:00.000Z',
    _updatedAt: '2026-01-01T00:00:00.000Z',
    title: 'Hello',
  }

  test('OPS-LIVE-EDIT-NO-NET-CHANGE-DELETE: a delete completes after an edit and its revert inside one autocommit window', async () => {
    const syncTest: SyncTestDefinition = {
      id: 'OPS-LIVE-EDIT-NO-NET-CHANGE-DELETE',
      title:
        'A saves an edit to a live-edit document, then types a character and deletes it before the next autocommit, then deletes the document',
      seam: 'operations',
      // L2: the bug is in BufferedDocument.add(), which runs for real here; the fake lake only supplies the echo
      evidence: 'L2',
      knownBug: 'B3',
      initial: [liveDocument],
      idPair: liveIdPair,
      clients: ['A'],
      steps: [
        {client: 'A', do: 'listener', mode: 'auto', latencyMs: 100},
        {client: 'A', do: 'commits', mode: 'auto', latencyMs: 100},
        {client: 'A', do: 'patch', id: LIVE_ID, patches: [{set: {title: 'Hello world'}}]},
        {do: 'advance', ms: 400},
        {client: 'A', do: 'patch', id: LIVE_ID, patches: [{set: {title: 'Hello world!'}}]},
        {do: 'advance', ms: 100},
        {client: 'A', do: 'patch', id: LIVE_ID, patches: [{set: {title: 'Hello world'}}]},
        {do: 'advance', ms: 1_500},
        {client: 'A', do: 'delete'},
        {do: 'advance', ms: 5_000},
      ],
    }
    const deleteWorld = await createWorld(syncTest, {schema, typeName: 'liveArticle'})
    world = deleteWorld
    await runSteps(deleteWorld, syncTest.steps)

    expect(deleteWorld.lake.get(LIVE_ID)).toBeNull()
    await deleteWorld.settle()
    expectQuiescent(deleteWorld)
  })
})
