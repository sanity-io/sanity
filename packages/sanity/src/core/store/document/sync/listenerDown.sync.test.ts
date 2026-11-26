import {type SanityDocument} from '@sanity/types'
import {afterEach, describe, expect, test} from 'vitest'

import {expectConverged, expectHealthy} from '../../../../../test/sync/oracles'
import {runSyncTest, type SyncTestDefinition, type World} from '../../../../../test/sync/syncTest'

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

const listenerDownBeforeWelcome: SyncTestDefinition = {
  id: 'LSN-DOWN-BEFORE-WELCOME',
  title: "B checks the pair out while its listener is down, and it comes back after A's edit",
  seam: 'pair',
  initial: [document(PUBLISHED_ID, 'Published title'), document(DRAFT_ID, 'Draft title')],
  idPair,
  clients: ['A', 'B'],
  listenersDown: ['B'],
  steps: [],
}

const channelErrorWhileEditing: SyncTestDefinition = {
  id: 'LSN-CHANNEL-ERROR',
  title: "B's listener ends with a channel error, A edits while B reconnects",
  seam: 'pair',
  initial: [document(PUBLISHED_ID, 'Published title'), document(DRAFT_ID, 'Draft title')],
  idPair,
  clients: ['A', 'B'],
  steps: [
    {client: 'B', do: 'failListener'},
    {client: 'A', do: 'patch', id: DRAFT_ID, patches: [{set: {title: 'Edited by A'}}]},
    {client: 'A', do: 'commit'},
    {do: 'settle'},
  ],
}

// B goes down while A edits, and the snapshot fetch B makes when it comes back is held: B must not
// read as connected (the form is editable once it does) while it still holds the stale draft.
function comesBackWithAFetchHeld(
  id: string,
  goDown: SyncTestDefinition['steps'],
  comeBack: SyncTestDefinition['steps'],
): SyncTestDefinition {
  return {
    id,
    title: "B's listener comes back after A's edit, and its snapshot fetch is held",
    seam: 'pair',
    initial: [document(PUBLISHED_ID, 'Published title'), document(DRAFT_ID, 'Draft title')],
    idPair,
    clients: ['A', 'B'],
    steps: [
      ...goDown,
      {client: 'A', do: 'patch', id: DRAFT_ID, patches: [{set: {title: 'Edited by A'}}]},
      {client: 'A', do: 'commit'},
      {do: 'advance', ms: 250},
      {client: 'B', do: 'snapshotFetches', mode: 'hold'},
      ...comeBack,
    ],
  }
}

const welcomeWithFetchHeld = comesBackWithAFetchHeld(
  'LSN-WELCOME-BEFORE-SNAPSHOT',
  [{client: 'B', do: 'breakListener'}],
  [{client: 'B', do: 'restoreListener'}],
)

const resetWithFetchHeld = comesBackWithAFetchHeld(
  'LSN-RESET-BEFORE-SNAPSHOT',
  [{client: 'B', do: 'disconnect'}],
  [{client: 'B', do: 'reconnect', resume: false}],
)

let world: World | undefined
afterEach(() => {
  world?.teardown()
  world = undefined
})

describe('a pair listener that is down before it welcomes', () => {
  test('LSN-DOWN-BEFORE-WELCOME: B loads the documents while its listener is down', async () => {
    world = await runSyncTest(listenerDownBeforeWelcome)
    expect(world.clients.B.localDocument(DRAFT_ID)?.title).toBe('Draft title')
    expect(world.clients.B.localDocument(PUBLISHED_ID)?.title).toBe('Published title')
  })

  test('LSN-DOWN-BEFORE-WELCOME: B catches up with an edit made while it was down', async () => {
    world = await runSyncTest({
      ...listenerDownBeforeWelcome,
      steps: [
        {client: 'A', do: 'patch', id: DRAFT_ID, patches: [{set: {title: 'Edited by A'}}]},
        {client: 'A', do: 'commit'},
        {do: 'advance', ms: 10},
        {client: 'B', do: 'restoreListener'},
        {do: 'settle'},
      ],
    })
    expectConverged(world)
    expectHealthy(world)
    expect(world.clients.B.localDocument(DRAFT_ID)?.title).toBe('Edited by A')
  })
})

describe('a pair listener that comes back without resuming', () => {
  test.each([welcomeWithFetchHeld, resetWithFetchHeld])(
    '$id: B stays disconnected until the fresh snapshots arrive',
    async (definition) => {
      world = await runSyncTest(definition)
      const B = world.clients.B
      expect(B.localDocument(DRAFT_ID)?.title).toBe('Draft title')
      expect(B.connectionState?.()).toBe('reconnecting')

      world.lake.client('B').releaseSnapshotFetches()
      await world.settle()
      expect(B.localDocument(DRAFT_ID)?.title).toBe('Edited by A')
      expect(B.connectionState?.()).toBe('connected')
      expectConverged(world)
      expectHealthy(world)
    },
  )
})

describe('a pair listener that ends with a channel error', () => {
  test('LSN-CHANNEL-ERROR: B reconnects and catches up without an error', async () => {
    world = await runSyncTest(channelErrorWhileEditing)
    expectConverged(world)
    expectHealthy(world)
    expect(world.clients.B.localDocument(DRAFT_ID)?.title).toBe('Edited by A')
  })
})
