import {describe, expect, test} from 'vitest'

import {createFakeContentLakeServer, type RecordedCall} from './__fixtures__/fakeContentLakeServer'
import {loadFixtureReport} from './__fixtures__/loadFixtureReport'
import {createContentLakeHttp} from './contentLakeHttp'
import {openWorkspace, verifyFailures, workspaceErrorVerdicts} from './liveReplay'

const report = loadFixtureReport()

function httpFor(server: ReturnType<typeof createFakeContentLakeServer>) {
  return createContentLakeHttp({
    projectId: 'ittbm412',
    dataset: 'cursor_ci_sync_test',
    token: 'token',
    apiHost: 'api.sanity.work',
    fetch: server.fetch,
    sleep: async () => undefined,
  })
}

function isDatasetCall(call: RecordedCall, method: string): boolean {
  return call.method === method && call.path.includes('/datasets/')
}

describe('verifyFailures', () => {
  test('classifies every fixture failure against a server that behaves like the fake', async () => {
    const server = createFakeContentLakeServer()
    const verdicts = await verifyFailures(report, httpFor(server), 'run1')
    expect(
      verdicts.map(({signature, verdict, replayed}) => ({signature, verdict, replayed})),
    ).toEqual([
      {signature: report.failures[0].signature, verdict: 'confirmed', replayed: 2},
      {signature: report.failures[1].signature, verdict: 'assumed', replayed: 1},
      {signature: report.failures[2].signature, verdict: 'assumed', replayed: 1},
      {signature: report.failures[3].signature, verdict: 'assumed', replayed: 0},
      {signature: report.failures[4].signature, verdict: 'confirmed', replayed: 3},
    ])
  })

  test('sends namespaced ids and the real revision in preconditions', async () => {
    const server = createFakeContentLakeServer()
    await verifyFailures({...report, failures: [report.failures[4]]}, httpFor(server), 'run1')
    const mutations = server.calls
      .filter((call) => call.path.endsWith('/data/mutate/cursor_ci_sync_test'))
      .map(
        (call) =>
          (call.body as {mutations: Array<{patch?: {id: string; ifRevisionID?: string}}>})
            .mutations,
      )
    const [seed, first, second, stale] = mutations
    expect(seed).toHaveLength(2)
    expect(first[0].patch).toMatchObject({
      id: 'fv-probe-run1-f0-article-gen',
      ifRevisionID: 'real-1',
    })
    expect(second[0].patch?.ifRevisionID).toBe('real-2')
    expect(stale[0].patch?.ifRevisionID).toBe('real-1')
    expect(server.state.index).toEqual({})
  })

  test('reports the exact differences when the real server disagrees', async () => {
    const server = createFakeContentLakeServer((call) =>
      call.path.includes('/data/actions/')
        ? new Response(JSON.stringify({error: {type: 'documentNotFoundError'}}), {status: 404})
        : undefined,
    )
    const [verdict] = await verifyFailures(
      {...report, failures: [report.failures[0]]},
      httpFor(server),
      'run1',
    )
    expect(verdict.verdict).toBe('fake-mismatch')
    expect(verdict.differences).toEqual([
      {submission: 1, transactionId: 'A-tx-1', field: 'statusCode', fake: 400, real: 404},
      {
        submission: 1,
        transactionId: 'A-tx-1',
        field: 'errorType',
        fake: 'mutationError',
        real: 'documentNotFoundError',
      },
    ])
  })

  test('turns one failure into an error verdict without stopping the rest', async () => {
    const server = createFakeContentLakeServer((call) => {
      const seeding = (call.body as {mutations?: Array<{createOrReplace?: {_id: string}}>})
        ?.mutations
      const seedsFirstFailure = seeding?.some((mutation) =>
        mutation.createOrReplace?._id.includes('-f0-'),
      )
      return seedsFirstFailure ? new Response('upstream down', {status: 500}) : undefined
    })
    const verdicts = await verifyFailures(report, httpFor(server), 'run1')
    expect(verdicts[0]).toMatchObject({verdict: 'error', replayed: 0})
    expect(verdicts[0].summary).toContain('HTTP 500')
    expect(verdicts.slice(1).map(({verdict}) => verdict)).toEqual([
      'assumed',
      'assumed',
      'assumed',
      'confirmed',
    ])
  })
})

describe('openWorkspace', () => {
  test('creates the dataset and deletes it once on close', async () => {
    const server = createFakeContentLakeServer()
    const workspace = await openWorkspace(httpFor(server), 'create')
    await Promise.all([workspace.close(), workspace.close()])
    expect(server.calls.filter((call) => isDatasetCall(call, 'PUT'))).toHaveLength(1)
    expect(server.calls.filter((call) => isDatasetCall(call, 'DELETE'))).toHaveLength(1)
  })

  test('deletes a created dataset that never becomes ready', async () => {
    const server = createFakeContentLakeServer((call) =>
      call.path.includes('/data/query/') ? new Response('{}', {status: 403}) : undefined,
    )
    await expect(openWorkspace(httpFor(server), 'create')).rejects.toThrow('HTTP 403')
    expect(server.calls.filter((call) => isDatasetCall(call, 'DELETE'))).toHaveLength(1)
  })

  test('leaves an existing dataset alone', async () => {
    const server = createFakeContentLakeServer()
    const workspace = await openWorkspace(httpFor(server), 'existing')
    await workspace.close()
    expect(server.calls).toEqual([])
  })

  test('gives every failure an error verdict when the dataset cannot be prepared', () => {
    const verdicts = workspaceErrorVerdicts(report, new Error('HTTP 401'))
    expect(verdicts).toHaveLength(report.failures.length)
    expect(verdicts.every(({verdict}) => verdict === 'error')).toBe(true)
  })
})
