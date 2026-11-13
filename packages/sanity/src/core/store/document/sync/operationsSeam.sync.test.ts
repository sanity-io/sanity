import {type SanityDocument} from '@sanity/types'
import {afterEach, describe, expect, test} from 'vitest'

import {expectRevisionsAgree, keysOf} from '../../../../../test/sync/oracles'
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

  test('OPS-HELD-EDIT-AFTER-PEER-CREATES-DRAFT: a held first edit lands as an edit of the draft a peer created meanwhile', async () => {
    const syncTest: SyncTestDefinition = {
      id: 'OPS-HELD-EDIT-AFTER-PEER-CREATES-DRAFT',
      title: 'Only a published document exists; A holds its first edit while B creates the draft',
      seam: 'operations',
      evidence: 'L2',
      initial: [document(PUBLISHED_ID, 'Published')],
      idPair,
      clients: ['A', 'B'],
      steps: [
        {client: 'A', do: 'commits', mode: 'hold', represents: 'a slow save request'},
        {client: 'A', do: 'patch', id: DRAFT_ID, patches: [{set: {title: 'Edited by A'}}]},
        {client: 'A', do: 'commit'},
        {
          client: 'B',
          do: 'patch',
          id: DRAFT_ID,
          patches: [
            {insert: {after: 'items[-1]', items: [{_key: 'b', _type: 'item', title: 'B'}]}},
          ],
        },
        {client: 'B', do: 'commit'},
        {do: 'advance', ms: 10},
        {client: 'A', do: 'commits', mode: 'auto'},
        {client: 'A', do: 'acceptCommit'},
        {do: 'settle'},
      ],
    }
    world = await runSyncTest(syncTest, {schema, typeName: 'article'})

    const outcomes = world.lake.submissions.map((submission) => submission.outcome)
    expect(new Set(outcomes)).toEqual(new Set(['accepted']))
    const server = world.lake.get(DRAFT_ID)
    expect(server?.title).toBe('Edited by A')
    expect(keysOf(server, 'items')).toEqual(['a', 'b'])
  })

  // The rejected save leaves its queued commit promise rejected with no handler.
  test.fails('OPS-FIRST-EDIT-QUEUED-BEHIND-REJECTED-CREATE: an edit queued behind the draft-creating save is discarded with it when that save gets a 403', async () => {
    const insert = (key: string) => [
      {setIfMissing: {items: []}},
      {insert: {after: 'items[-1]', items: [{_key: key, _type: 'item', title: key}]}},
    ]
    const syncTest: SyncTestDefinition = {
      id: 'OPS-FIRST-EDIT-QUEUED-BEHIND-REJECTED-CREATE',
      title:
        'Only a published document exists; A edits it while holding saves, and its draft-creating save gets a 403',
      seam: 'operations',
      evidence: 'L2',
      knownBug: 'B1',
      initial: [document(PUBLISHED_ID, 'Published')],
      idPair,
      clients: ['A', 'B'],
      steps: [
        {client: 'B', do: 'patch', id: DRAFT_ID, patches: insert('b')},
        {client: 'A', do: 'commits', mode: 'hold', represents: 'a save request still in flight'},
        {client: 'A', do: 'patch', id: DRAFT_ID, patches: insert('k')},
        {
          client: 'A',
          do: 'rejectCommit',
          statusCode: 403,
          represents: 'permission revoked mid-session',
        },
        {client: 'A', do: 'commits', mode: 'auto'},
        {client: 'A', do: 'commit'},
        {client: 'B', do: 'commit'},
        {do: 'settle'},
      ],
    }
    const unhandled = captureUnhandledRejections()
    world = await runSyncTest(syncTest, {schema, typeName: 'article'}).finally(unhandled.stop)

    expect(unhandled.reasons).toEqual([])
    const fromA = world.lake.submissions.filter((submission) => submission.clientId === 'A')
    expect(fromA.map(({outcome, injected}) => ({outcome, injected}))).toEqual([
      {outcome: 'rejected', injected: true},
    ])
    expect(keysOf(world.lake.get(DRAFT_ID), 'items')).toEqual(['a', 'b'])
  })
})
