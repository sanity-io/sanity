import {type SanityDocument} from '@sanity/types'
import {afterEach, describe, expect, test} from 'vitest'

import {expectConverged, expectHealthy} from '../../../../../test/sync/oracles'
import {
  createWorld,
  runSteps,
  type Step,
  type SyncTestDefinition,
  type World,
} from '../../../../../test/sync/syncTest'
import {LISTENER_PAUSE_GRACE_PERIOD} from '../../listenerGate/listenerGate'

const PUBLISHED_ID = 'article-5'
const DRAFT_ID = 'drafts.article-5'
const idPair = {publishedId: PUBLISHED_ID, draftId: DRAFT_ID}

const initial: SanityDocument = {
  _id: DRAFT_ID,
  _type: 'article',
  _rev: 'seed',
  _createdAt: '2026-01-01T00:00:00.000Z',
  _updatedAt: '2026-01-01T00:00:00.000Z',
  title: 'seed',
}

function definition(id: string, title: string): SyncTestDefinition {
  return {id, title, seam: 'pair', initial: [initial], idPair, clients: ['A'], steps: []}
}

const editFromOutside: Step = {
  do: 'outside',
  mutations: [{patch: {id: DRAFT_ID, set: {title: 'edited elsewhere'}}}],
}

let world: World | undefined
afterEach(() => {
  world?.teardown()
  world = undefined
})

describe('listeners on a hidden page', () => {
  test('LSN-PAUSE-HIDDEN: A disconnects while hidden, and catches up on an edit made meanwhile when shown', async () => {
    world = await createWorld(
      definition('LSN-PAUSE-HIDDEN', 'A hides the page, the document is edited elsewhere'),
    )
    await runSteps(world, [
      {do: 'setDocumentVisibility', visibility: 'hidden'},
      {do: 'advance', ms: LISTENER_PAUSE_GRACE_PERIOD},
    ])
    expect(world.lake.openListeners('A')).toBe(0)

    await runSteps(world, [editFromOutside])
    expect(world.clients.A.localDocument(DRAFT_ID)?.title).toBe('seed')

    await runSteps(world, [{do: 'setDocumentVisibility', visibility: 'visible'}, {do: 'settle'}])
    expect(world.lake.openListeners('A')).toBe(1)
    expect(world.clients.A.localDocument(DRAFT_ID)?.title).toBe('edited elsewhere')
    expectHealthy(world)
    expectConverged(world)
  })

  test('LSN-PAUSE-SHORT-HIDE: A keeps its connection when the page is shown within the grace period', async () => {
    world = await createWorld(
      definition('LSN-PAUSE-SHORT-HIDE', 'A hides the page briefly, the document is edited'),
    )
    await runSteps(world, [
      {do: 'setDocumentVisibility', visibility: 'hidden'},
      {do: 'advance', ms: LISTENER_PAUSE_GRACE_PERIOD / 2},
      editFromOutside,
      {do: 'setDocumentVisibility', visibility: 'visible'},
      {do: 'advance', ms: LISTENER_PAUSE_GRACE_PERIOD * 2},
    ])

    expect(world.lake.openedListeners('A')).toBe(1)
    expectHealthy(world)
    expectConverged(world)
  })

  test('LSN-PAUSE-BACKGROUND-TAB: A, opened in a background tab, connects when it is first shown', async () => {
    world = await createWorld(
      definition('LSN-PAUSE-BACKGROUND-TAB', 'A opens the document in a hidden page'),
      {initialDocumentVisibility: 'hidden'},
    )
    await runSteps(world, [{do: 'advance', ms: LISTENER_PAUSE_GRACE_PERIOD * 2}, editFromOutside])
    expect(world.lake.openedListeners('A')).toBe(0)

    await runSteps(world, [{do: 'setDocumentVisibility', visibility: 'visible'}, {do: 'settle'}])
    expect(world.lake.openedListeners('A')).toBe(1)
    expectHealthy(world)
    expectConverged(world)
  })
})

describe('listeners on a hidden page with pending mutations', () => {
  test('CMT-HOLD-HIDDEN: an unconfirmed commit keeps listeners connected until it is confirmed', async () => {
    world = await createWorld(
      definition('CMT-HOLD-HIDDEN', 'A edits, hides the page, and the commit is held'),
    )
    await runSteps(world, [
      {client: 'A', do: 'commits', mode: 'hold'},
      {client: 'A', do: 'patch', id: DRAFT_ID, patches: [{set: {title: 'edited'}}]},
      {client: 'A', do: 'commit'},
      {do: 'setDocumentVisibility', visibility: 'hidden'},
      {do: 'advance', ms: LISTENER_PAUSE_GRACE_PERIOD * 2},
    ])
    expect(world.listenersActive()).toBe(true)
    expect(world.lake.openListeners('A')).toBe(1)

    await runSteps(world, [{client: 'A', do: 'acceptCommit'}, {do: 'settle'}])
    expect(world.listenersActive()).toBe(false)
    expect(world.lake.openListeners('A')).toBe(0)
    expect(world.lake.content(DRAFT_ID)?.title).toBe('edited')

    await runSteps(world, [{do: 'setDocumentVisibility', visibility: 'visible'}, {do: 'settle'}])
    expectHealthy(world)
    expectConverged(world)
  })

  test('CMT-HOLD-TEARDOWN: closing a document with an unconfirmed commit releases its hold', async () => {
    world = await createWorld(
      definition('CMT-HOLD-TEARDOWN', 'A edits, hides the page, and closes the document'),
    )
    await runSteps(world, [
      {client: 'A', do: 'commits', mode: 'hold'},
      {client: 'A', do: 'patch', id: DRAFT_ID, patches: [{set: {title: 'edited'}}]},
      {client: 'A', do: 'commit'},
      {do: 'setDocumentVisibility', visibility: 'hidden'},
      {do: 'advance', ms: LISTENER_PAUSE_GRACE_PERIOD},
    ])
    expect(world.listenersActive()).toBe(true)

    world.clients.A.teardown()
    expect(world.listenersActive()).toBe(false)
  })
})
