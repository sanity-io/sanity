import {type SanityDocument} from '@sanity/types'
import {afterEach, describe, expect, test} from 'vitest'

import {expectQuiescent, expectRevisionsAgree} from '../../../../../test/sync/oracles'
import {
  createWorld,
  runSteps,
  runSyncTest,
  type Step,
  type SyncTestDefinition,
  type World,
} from '../../../../../test/sync/syncTest'

const PUBLISHED_ID = 'article-4'
const DRAFT_ID = 'drafts.article-4'
const idPair = {publishedId: PUBLISHED_ID, draftId: DRAFT_ID}

const initial: SanityDocument = {
  _id: DRAFT_ID,
  _type: 'article',
  _rev: 'seed',
  _createdAt: '2026-01-01T00:00:00.000Z',
  _updatedAt: '2026-01-01T00:00:00.000Z',
  title: 'seed',
  count: 0,
}

let world: World | undefined
afterEach(() => {
  world?.teardown()
  world = undefined
})

interface Rejection {
  statusCode: number
  represents: string
}

const PERMISSION_REVOKED: Rejection = {
  statusCode: 403,
  represents: 'permission revoked mid-session',
}
const TRANSIENT_FAILURE: Rejection = {statusCode: 500, represents: 'a transient server error'}

interface TitleEdits {
  initialTitle: string
  sent: string
  typedDuringFlight?: string
}

const SENT_ONLY: TitleEdits = {initialTitle: 'seed', sent: 'one'}
const SHORT_TYPING: TitleEdits = {initialTitle: 'seed', sent: 'one', typedDuringFlight: 'two'}
// Short strings rebase cleanly by luck; a realistic same-field edit shows what the rebase does to text.
const REALISTIC_TYPING: TitleEdits = {
  initialTitle: 'Hello',
  sent: 'Hello wor',
  typedDuringFlight: 'Hello world',
}

function rejectedCommit(rejection: Rejection, edits: TitleEdits): SyncTestDefinition {
  const {statusCode, represents} = rejection
  const {initialTitle, sent, typedDuringFlight} = edits
  const typed: Step[] = typedDuringFlight
    ? [{client: 'A', do: 'patch', id: DRAFT_ID, patches: [{set: {title: typedDuringFlight}}]}]
    : []
  return {
    id: `CMT-${statusCode < 500 ? 'REJECT' : 'RETRY'}-${statusCode}${typedDuringFlight ? '-TYPING' : ''}`,
    title: `A commits "${sent}"${typedDuringFlight ? `, types "${typedDuringFlight}" while it is in flight,` : ''} and the server answers ${statusCode}`,
    seam: 'pair',
    evidence: 'L2',
    initial: [{...initial, title: initialTitle}],
    idPair,
    clients: ['A'],
    steps: [
      {client: 'A', do: 'commits', mode: 'hold', represents: 'a save request still in flight'},
      {client: 'A', do: 'patch', id: DRAFT_ID, patches: [{set: {title: sent}}]},
      {client: 'A', do: 'commit'},
      ...typed,
      {client: 'A', do: 'rejectCommit', statusCode, represents},
      {client: 'A', do: 'commits', mode: 'auto'},
      {do: 'advance', ms: 10},
      {client: 'A', do: 'commit'},
    ],
  }
}

describe('commit failures', () => {
  test('CMT-REJECT-403: a terminal rejection resets the client to the server copy', async () => {
    world = await runSyncTest(rejectedCommit(PERMISSION_REVOKED, SENT_ONLY))

    expectRevisionsAgree(world)
    expect(world.lake.transactions).toHaveLength(0)
    expect(world.lake.rejectedCommits).toEqual([
      {clientId: 'A', transactionId: expect.any(String), statusCode: 403},
    ])
    expect(world.clients.A.localDocument(DRAFT_ID)?.title).toBe('seed')
  })

  test('CMT-REJECT-403-TYPING: a terminal rejection while typing drops the typing and shows what the server holds', async () => {
    const definition = rejectedCommit(PERMISSION_REVOKED, REALISTIC_TYPING)
    world = await createWorld(definition)
    // Checked before settling, so the failure shows what the user sees rather than only that the world never settled.
    await runSteps(world, definition.steps)

    expect({
      local: world.clients.A.localDocument(DRAFT_ID)?.title,
      server: world.lake.get(DRAFT_ID)?.title,
    }).toEqual({local: 'Hello', server: 'Hello'})

    await world.settle()
    expectQuiescent(world)
    expect(world.lake.transactions).toHaveLength(0)
  })

  test('CMT-REJECT-403-REFETCHES: a terminal rejection refetches the document, including an accepted save whose echo has not arrived', async () => {
    const definition: SyncTestDefinition = {
      id: 'CMT-REJECT-403-REFETCHES',
      title:
        'A saves "one", B edits from outside, both echoes are held, then A types again and the server answers 403',
      seam: 'pair',
      evidence: 'L2',
      initial: [initial],
      idPair,
      clients: ['A'],
      steps: [
        {client: 'A', do: 'listener', mode: 'hold', represents: 'a slow listener connection'},
        {client: 'A', do: 'commits', mode: 'hold', represents: 'a save request still in flight'},
        {client: 'A', do: 'patch', id: DRAFT_ID, patches: [{set: {title: 'one'}}]},
        {client: 'A', do: 'commit'},
        {client: 'A', do: 'acceptCommit'},
        {do: 'outside', mutations: [{patch: {id: DRAFT_ID, set: {subtitle: 'from outside'}}}]},
        {client: 'A', do: 'patch', id: DRAFT_ID, patches: [{set: {body: 'two'}}]},
        {client: 'A', do: 'commit'},
        {
          client: 'A',
          do: 'rejectCommit',
          statusCode: 403,
          represents: 'permission revoked mid-session',
        },
        {do: 'advance', ms: 100},
      ],
    }
    world = await createWorld(definition)
    await runSteps(world, definition.steps)

    expect(world.clients.A.localDocument(DRAFT_ID)).toEqual(world.lake.get(DRAFT_ID))
    expect(world.clients.A.consistent()).toBe(true)
    expect(world.clients.A.syncErrorRecoveries()).toEqual([
      expect.objectContaining({name: 'RejectedSaveResyncError'}),
    ])

    await runSteps(world, [
      {client: 'A', do: 'listener', mode: 'auto'},
      {client: 'A', do: 'commits', mode: 'auto'},
    ])
    await world.settle()
    expectQuiescent(world)
    expect(world.lake.get(DRAFT_ID)).toMatchObject({title: 'one', subtitle: 'from outside'})
    expect(world.lake.get(DRAFT_ID)?.body).toBeUndefined()
  })

  test('CMT-RETRY-500-TYPING: a transient failure is retried and every edit lands', async () => {
    world = await runSyncTest(rejectedCommit(TRANSIENT_FAILURE, SHORT_TYPING))

    expectRevisionsAgree(world)
    expect(world.lake.get(DRAFT_ID)?.title).toBe('two')
    expect(world.lake.rejectedCommits.map((rejected) => rejected.statusCode)).toEqual([500])
    expect(world.lake.transactions.length).toBeGreaterThanOrEqual(1)
  })

  test('CMT-UNACKED-REMOTE-FLOOD: an unacknowledged commit survives a flood of remote edits', async () => {
    const syncTest: SyncTestDefinition = {
      id: 'CMT-UNACKED-REMOTE-FLOOD',
      title: 'A commits and the server does not answer; B lands five edits before it does',
      seam: 'pair',
      evidence: 'L2',
      initial: [initial],
      idPair,
      clients: ['A', 'B'],
      steps: [
        {
          client: 'A',
          do: 'commits',
          mode: 'hold',
          represents: 'a slow save response',
        },
        {client: 'A', do: 'patch', id: DRAFT_ID, patches: [{set: {title: 'from A'}}]},
        {client: 'A', do: 'commit'},
        ...[1, 2, 3, 4, 5].flatMap((step): Step[] => [
          {
            client: 'B',
            do: 'patch',
            id: DRAFT_ID,
            patches: [{inc: {count: 1}}, {set: {[`note${step}`]: `B ${step}`}}],
          },
          {client: 'B', do: 'commit'},
          {do: 'advance', ms: 50},
        ]),
        {client: 'A', do: 'patch', id: DRAFT_ID, patches: [{set: {subtitle: 'A again'}}]},
        {client: 'A', do: 'acceptCommit'},
        {client: 'A', do: 'commits', mode: 'auto'},
        {do: 'advance', ms: 10},
        {client: 'A', do: 'commit'},
        {do: 'settle'},
      ],
    }
    world = await runSyncTest(syncTest)

    expectRevisionsAgree(world)
    const server = world.lake.get(DRAFT_ID)
    expect(server?.title).toBe('from A')
    expect(server?.subtitle).toBe('A again')
    expect(server?.count).toBe(5)
    expect([1, 2, 3, 4, 5].map((step) => server?.[`note${step}`])).toEqual([
      'B 1',
      'B 2',
      'B 3',
      'B 4',
      'B 5',
    ])
    expect(world.lake.transactions.map((transaction) => transaction.identity)).toEqual([
      'B',
      'B',
      'B',
      'B',
      'B',
      'A',
      'A',
    ])
  })
})
