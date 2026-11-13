import {describe, expect, test} from 'vitest'

import {createFakeContentLakeServer, type RecordedCall} from './__fixtures__/fakeContentLakeServer'
import {loadFixtureReport} from './__fixtures__/loadFixtureReport'
import {createContentLakeHttp} from './contentLakeHttp'
import {openWorkspace, verifyFailures, verifyReport, workspaceErrorResults} from './liveReplay'

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

  test.each([408, 429, 503])(
    'turns a transient %i on a replayed submission into an error verdict',
    async (status) => {
      const server = createFakeContentLakeServer((call) =>
        call.path.includes('/data/actions/')
          ? new Response('upstream unavailable', {status})
          : undefined,
      )
      const [verdict] = await verifyFailures(
        {...report, failures: [report.failures[0]]},
        httpFor(server),
        'run1',
      )
      expect(verdict.verdict).toBe('error')
      expect(verdict.fakeSignature).toBeUndefined()
      expect(verdict.summary).toContain(`HTTP ${status}`)
    },
  )

  test('turns a hung replayed submission into an error verdict and still cleans up', async () => {
    const server = createFakeContentLakeServer()
    const hangingOnSubmission = ((input: string | URL | Request, init?: RequestInit) =>
      String(input).includes('/data/actions/')
        ? new Promise<Response>((_resolve, reject) => {
            init?.signal?.addEventListener('abort', () => reject(init.signal?.reason))
          })
        : server.fetch(input, init)) as typeof fetch
    const http = createContentLakeHttp({
      projectId: 'ittbm412',
      dataset: 'cursor_ci_sync_test',
      token: 'token',
      apiHost: 'api.sanity.work',
      fetch: hangingOnSubmission,
      sleep: async () => undefined,
      requestTimeoutMs: 20,
    })
    const [verdict] = await verifyFailures(
      {...report, failures: [report.failures[0]]},
      http,
      'run1',
    )
    expect(verdict.verdict).toBe('error')
    expect(verdict.summary).toContain('timed out after 20ms')
    const lastBody = server.calls.at(-1)?.body as {mutations?: Array<{delete?: unknown}>}
    expect(lastBody.mutations?.every((mutation) => mutation.delete !== undefined)).toBe(true)
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

describe('verifyReport', () => {
  test('replays the samples after the failures and confirms the ones the server agrees with', async () => {
    const server = createFakeContentLakeServer()
    const {verdicts, samples} = await verifyReport(report, httpFor(server), 'run1')
    expect(verdicts).toHaveLength(report.failures.length)
    expect(samples).toEqual([
      expect.objectContaining({seed: 11, runIndex: 40, verdict: 'confirmed', replayed: 3}),
      expect.objectContaining({seed: 12, runIndex: 80, verdict: 'confirmed', replayed: 1}),
    ])
    const seededPrefixes = server.calls.flatMap((call) => {
      const seeded = (call.body as {mutations?: Array<{createOrReplace?: {_id: string}}>})
        ?.mutations?.[0]?.createOrReplace?._id
      return seeded ? [/fv-probe-run1-(\w+)-/.exec(seeded)?.[1]] : []
    })
    expect(seededPrefixes).toEqual(['f0', 'f1', 'f2', 'f3', 'f4', 's0', 's1'])
  })

  test('signs a sample and a failure that hit the same gap identically', async () => {
    const rejectsReferences = createFakeContentLakeServer((call) => {
      const mutations = (call.body as {mutations?: unknown[]})?.mutations
      return JSON.stringify(mutations ?? []).includes('"_ref"')
        ? new Response(JSON.stringify({error: {type: 'mutationError'}}), {status: 409})
        : undefined
    })
    const [, referenceSample] = report.samples ?? []
    const failure = {
      ...report.failures[4],
      signature: 'converged',
      definition: referenceSample.definition,
      submissions: referenceSample.submissions,
    }
    const {verdicts, samples = []} = await verifyReport(
      {...report, failures: [failure], samples: [referenceSample]},
      httpFor(rejectsReferences),
      'run1',
    )
    expect(samples[0]).toMatchObject({
      verdict: 'fake-mismatch',
      fakeSignature: 'fake-mismatch | mutations | patch:set | 200->409 | mutationError',
    })
    expect(verdicts[0].fakeSignature).toBe(samples[0].fakeSignature)
  })

  test('leaves samples out when the report has none', async () => {
    const {samples: _samples, ...withoutSamples} = report
    const results = await verifyReport(
      {...withoutSamples, failures: []},
      httpFor(createFakeContentLakeServer()),
      'run1',
    )
    expect(results).toEqual({verdicts: []})
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
    const {verdicts, samples = []} = workspaceErrorResults(report, new Error('HTTP 401'))
    expect(verdicts).toHaveLength(report.failures.length)
    expect(samples).toHaveLength(2)
    expect([...verdicts, ...samples].every(({verdict}) => verdict === 'error')).toBe(true)
  })
})
