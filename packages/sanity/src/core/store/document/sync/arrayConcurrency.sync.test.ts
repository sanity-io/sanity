import {type SanityDocument} from '@sanity/types'
import {afterEach, describe, expect, test} from 'vitest'

import {
  expectConverged,
  expectHealthy,
  expectNoLostEdits,
  expectKeysConserved,
  expectRevisionsAgree,
  fieldOf,
  keysOf,
} from '../../../../../test/sync/oracles'
import {runSyncTest, type SyncTestDefinition, type World} from '../../../../../test/sync/syncTest'

const PUBLISHED_ID = 'article-1'
const DRAFT_ID = 'drafts.article-1'
const idPair = {publishedId: PUBLISHED_ID, draftId: DRAFT_ID}
const FIELD = 'items'

function item(key: string, title = key.toUpperCase()) {
  return {_key: key, _type: 'item', title}
}

function draftWithItems(keys: string[]): SanityDocument {
  return {
    _id: DRAFT_ID,
    _type: 'article',
    _rev: 'seed',
    _createdAt: '2026-01-01T00:00:00.000Z',
    _updatedAt: '2026-01-01T00:00:00.000Z',
    [FIELD]: keys.map((key) => item(key)),
  }
}

function move(key: string, position: 'before' | 'after', referenceKey: string, moved = item(key)) {
  return [
    {unset: [`${FIELD}[_key=="${key}"]`]},
    {insert: {[position]: `${FIELD}[_key=="${referenceKey}"]`, items: [moved]}},
  ]
}

let world: World | undefined
afterEach(() => {
  world?.teardown()
  world = undefined
})

describe('array of objects, two clients', () => {
  test('ARR-INSERT-CONCURRENT: both inserts land when A and B insert at the same time', async () => {
    const syncTest: SyncTestDefinition = {
      id: 'ARR-INSERT-CONCURRENT',
      title: 'A inserts after b while B inserts before a, neither has seen the other',
      seam: 'pair',
      initial: [draftWithItems(['a', 'b', 'c'])],
      idPair,
      clients: ['A', 'B'],
      steps: [
        {client: 'A', do: 'listener', mode: 'hold'},
        {client: 'B', do: 'listener', mode: 'hold'},
        {
          client: 'A',
          do: 'patch',
          id: DRAFT_ID,
          patches: [{insert: {after: `${FIELD}[_key=="b"]`, items: [item('x')]}}],
        },
        {
          client: 'B',
          do: 'patch',
          id: DRAFT_ID,
          patches: [{insert: {before: `${FIELD}[_key=="a"]`, items: [item('y')]}}],
        },
        {client: 'A', do: 'commit'},
        {client: 'B', do: 'commit'},
        {do: 'advance', ms: 10},
        {client: 'A', do: 'listener', mode: 'auto'},
        {client: 'B', do: 'listener', mode: 'auto'},
        {client: 'A', do: 'releaseEvents'},
        {client: 'B', do: 'releaseEvents', order: 'reverse'},
        {do: 'settle'},
      ],
    }
    world = await runSyncTest(syncTest)

    expectHealthy(world)
    expectConverged(world)
    expectNoLostEdits(world)
    expectRevisionsAgree(world)
    expectKeysConserved(['a', 'b', 'c'], keysOf(world.lake.get(DRAFT_ID), FIELD), {
      added: ['x', 'y'],
    })
    expect(keysOf(world.lake.get(DRAFT_ID), FIELD)).toEqual(['y', 'a', 'b', 'x', 'c'])
  })

  test("ARR-REORDER-VS-EDIT: a rapid reorder by A keeps B's edit to an item field", async () => {
    const syncTest: SyncTestDefinition = {
      id: 'ARR-REORDER-VS-EDIT',
      title: 'A drags c to the top and then a to the bottom while B renames b',
      seam: 'pair',
      initial: [draftWithItems(['a', 'b', 'c', 'd'])],
      idPair,
      clients: ['A', 'B'],
      steps: [
        {client: 'A', do: 'listener', mode: 'hold'},
        {client: 'B', do: 'listener', mode: 'hold'},
        {
          client: 'B',
          do: 'patch',
          id: DRAFT_ID,
          patches: [{set: {[`${FIELD}[_key=="b"].title`]: 'B renamed'}}],
        },
        {client: 'B', do: 'commit'},
        {client: 'A', do: 'patch', id: DRAFT_ID, patches: move('c', 'before', 'a')},
        {client: 'A', do: 'commit'},
        {client: 'A', do: 'patch', id: DRAFT_ID, patches: move('a', 'after', 'd')},
        {client: 'A', do: 'commit'},
        {do: 'advance', ms: 10},
        {client: 'A', do: 'listener', mode: 'auto'},
        {client: 'B', do: 'listener', mode: 'auto'},
        {client: 'A', do: 'releaseEvents'},
        {client: 'B', do: 'releaseEvents'},
        {do: 'settle'},
      ],
    }
    world = await runSyncTest(syncTest)

    expectHealthy(world)
    expectConverged(world)
    expectNoLostEdits(world)
    expectRevisionsAgree(world)
    const serverDraft = world.lake.get(DRAFT_ID)
    expectKeysConserved(['a', 'b', 'c', 'd'], keysOf(serverDraft, FIELD))
    expect(keysOf(serverDraft, FIELD), "A's final order").toEqual(['c', 'b', 'd', 'a'])
    expect(fieldOf(serverDraft, FIELD, 'b', 'title'), "B's rename").toBe('B renamed')
  })

  test('ARR-REORDER-VS-EDIT-SAME-ITEM: A moves the item B is renaming and both clients converge with no item lost or duplicated', async () => {
    const syncTest: SyncTestDefinition = {
      id: 'ARR-REORDER-VS-EDIT-SAME-ITEM',
      title: 'A moves b to the end while B renames b',
      seam: 'pair',
      initial: [draftWithItems(['a', 'b', 'c'])],
      idPair,
      clients: ['A', 'B'],
      steps: [
        {client: 'A', do: 'listener', mode: 'hold'},
        {client: 'B', do: 'listener', mode: 'hold'},
        {
          client: 'B',
          do: 'patch',
          id: DRAFT_ID,
          patches: [{set: {[`${FIELD}[_key=="b"].title`]: 'B renamed'}}],
        },
        {client: 'B', do: 'commit'},
        {client: 'A', do: 'patch', id: DRAFT_ID, patches: move('b', 'after', 'c')},
        {client: 'A', do: 'commit'},
        {do: 'advance', ms: 10},
        {client: 'A', do: 'listener', mode: 'auto'},
        {client: 'B', do: 'listener', mode: 'auto'},
        {client: 'A', do: 'releaseEvents'},
        {client: 'B', do: 'releaseEvents'},
        {do: 'settle'},
      ],
    }
    world = await runSyncTest(syncTest)

    expectHealthy(world)
    expectConverged(world)
    expectNoLostEdits(world)
    const serverDraft = world.lake.get(DRAFT_ID)
    expectKeysConserved(['a', 'b', 'c'], keysOf(serverDraft, FIELD))
    expect(keysOf(serverDraft, FIELD)).toEqual(['a', 'c', 'b'])
  })
})
