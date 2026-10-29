import {type SanityDocument} from '@sanity/types'
import {afterEach, describe, expect, test} from 'vitest'

import {
  expectConverged,
  expectHealthy,
  expectRevisionsAgree,
} from '../../../../../test/sync/oracles'
import {
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

function rejectedCommit(statusCode: number, typingDuringFlight: boolean): SyncTestDefinition {
  const typed: Step[] = typingDuringFlight
    ? [{client: 'A', do: 'patch', id: DRAFT_ID, patches: [{set: {title: 'two'}}]}]
    : []
  return {
    id: `CMT-REJECT-${statusCode}${typingDuringFlight ? '-TYPING' : ''}`,
    title: `A commits "one"${typingDuringFlight ? ', types "two" while it is in flight,' : ''} and the server answers ${statusCode}`,
    seam: 'pair',
    initial: [initial],
    idPair,
    clients: ['A'],
    steps: [
      {client: 'A', do: 'commits', mode: 'hold'},
      {client: 'A', do: 'patch', id: DRAFT_ID, patches: [{set: {title: 'one'}}]},
      {client: 'A', do: 'commit'},
      ...typed,
      {client: 'A', do: 'rejectCommit', statusCode},
      {client: 'A', do: 'commits', mode: 'auto'},
      {do: 'advance', ms: 10},
      {client: 'A', do: 'commit'},
      {do: 'settle'},
    ],
  }
}

describe('commit failures', () => {
  test('CMT-REJECT-409: a terminal rejection resets the client to the server copy', async () => {
    world = await runSyncTest(rejectedCommit(409, false))

    expectHealthy(world)
    expectConverged(world)
    expectRevisionsAgree(world)
    expect(world.lake.transactions).toHaveLength(0)
    expect(world.lake.rejectedCommits).toEqual([
      {clientId: 'A', transactionId: expect.any(String), statusCode: 409},
    ])
    expect(world.clients.A.localDocument(DRAFT_ID)?.title).toBe('seed')
  })

  test('CMT-REJECT-409-TYPING: a terminal rejection while typing leaves the client converged and consistent', async () => {
    world = await runSyncTest(rejectedCommit(409, true))

    expectHealthy(world)
    expectConverged(world)
    expectRevisionsAgree(world)
    expect(world.lake.rejectedCommits.map((rejected) => rejected.statusCode)).toEqual([409])
    expect(world.lake.transactions).toHaveLength(1)
    expect(world.lake.get(DRAFT_ID)?.title).toBe('two')
  })

  test('CMT-RETRY-500-TYPING: a transient failure is retried and every edit lands', async () => {
    world = await runSyncTest(rejectedCommit(500, true))

    expectHealthy(world)
    expectConverged(world)
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
      initial: [initial],
      idPair,
      clients: ['A', 'B'],
      steps: [
        {client: 'A', do: 'commits', mode: 'hold'},
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

    expectHealthy(world)
    expectConverged(world)
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
