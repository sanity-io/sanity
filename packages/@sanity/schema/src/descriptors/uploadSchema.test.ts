import {describe, expect, test} from 'vitest'

import {Schema} from '../legacy/Schema'
import {builtinTypes} from '../sanity/builtinTypes'
import {groupProblems} from '../sanity/groupProblems'
import {validateSchema} from '../sanity/validateSchema'
import {defaultShouldRetry, type DescriptorRequestOptions} from './transport'
import {uploadSchema, type UploadSchemaPhase} from './uploadSchema'

describe('defaultShouldRetry', () => {
  test('retries on 429 and 5xx, not on 4xx or non-http errors', () => {
    expect(defaultShouldRetry({response: {statusCode: 429}})).toBe(true)
    expect(defaultShouldRetry({response: {statusCode: 503}})).toBe(true)
    expect(defaultShouldRetry({response: {statusCode: 404}})).toBe(false)
    expect(defaultShouldRetry({response: {statusCode: 200}})).toBe(false)
    expect(defaultShouldRetry(new Error('boom'))).toBe(false)
    expect(defaultShouldRetry(undefined)).toBe(false)
  })
})

// taken from sanity/src/core/schema/createSchema.ts
function createSchema(schemaDef: {name: string; types: any[]}, skipBuiltins = false) {
  const validated = validateSchema(schemaDef.types).getTypes()
  const validation = groupProblems(validated)
  const hasErrors = validation.some((group) =>
    group.problems.some((problem) => problem.severity === 'error'),
  )

  return Schema.compile({
    name: 'test',
    types: hasErrors
      ? []
      : [...schemaDef.types, ...(skipBuiltins ? [] : builtinTypes)].filter(Boolean),
  })
}

function makeSchema() {
  return createSchema({
    name: 'test',
    types: [{name: 'author', type: 'document', fields: [{name: 'name', type: 'string'}]}],
  })
}

/** Build an uploadSchema caller backed by a recording fake requester. */
function recording(responder: (opts: DescriptorRequestOptions) => unknown) {
  const calls: DescriptorRequestOptions[] = []
  const requester = async <T>(opts: DescriptorRequestOptions): Promise<T> => {
    calls.push(opts)
    return responder(opts) as T
  }
  return {requester, calls}
}

describe('uploadSchema — transport guards', () => {
  test('throws when neither baseUrl nor requester is provided', async () => {
    await expect(
      // @ts-expect-error - exactly one of baseUrl/requester is required (compile-time guard)
      uploadSchema(makeSchema(), {contextKey: 'studio:1'}),
    ).rejects.toThrow(/requester.*baseUrl|baseUrl.*requester/i)
  })

  test('throws when both baseUrl and requester are provided', async () => {
    const {requester} = recording(() => ({}))
    await expect(
      // @ts-expect-error - cannot provide both baseUrl and requester (compile-time guard)
      uploadSchema(makeSchema(), {
        contextKey: 'studio:1',
        baseUrl: 'https://api.example',
        requester,
      }),
    ).rejects.toThrow(/both/i)
  })
})

describe('uploadSchema — header merging', () => {
  test('derives Authorization from token and forwards headers; header entry overrides token', async () => {
    const {requester, calls} = recording((opts) => {
      if (opts.url.endsWith('/claim')) return {synchronization: {type: 'complete'}, commitId: 'c1'}
      if (opts.url.endsWith('/commit')) return {}
      throw new Error(`unexpected call to ${opts.url}`)
    })
    await uploadSchema(makeSchema(), {
      contextKey: 'studio:1',
      requester,
      token: 'tok',
      headers: {'x-sanity-project-id': 'p1'},
    })
    expect(calls[0]!.headers).toMatchObject({
      'Authorization': 'Bearer tok',
      'x-sanity-project-id': 'p1',
    })

    const override = recording((opts) => {
      if (opts.url.endsWith('/claim')) return {synchronization: {type: 'complete'}, commitId: 'c1'}
      if (opts.url.endsWith('/commit')) return {}
      throw new Error(`unexpected call to ${opts.url}`)
    })
    await uploadSchema(makeSchema(), {
      contextKey: 'studio:1',
      requester: override.requester,
      token: 'tok',
      headers: {Authorization: 'Bearer other'},
    })
    expect(override.calls[0]!.headers).toMatchObject({Authorization: 'Bearer other'})
  })

  test('a lowercase authorization header suppresses the derived token (no duplicate)', async () => {
    const {requester, calls} = recording((opts) => {
      if (opts.url.endsWith('/claim')) return {synchronization: {type: 'complete'}, commitId: 'c1'}
      if (opts.url.endsWith('/commit')) return {}
      throw new Error(`unexpected call to ${opts.url}`)
    })
    await uploadSchema(makeSchema(), {
      contextKey: 'studio:1',
      requester,
      token: 'tok',
      headers: {authorization: 'Bearer other'},
    })
    const sent = calls[0]!.headers!
    expect(sent['authorization']).toBe('Bearer other')
    expect(sent['Authorization']).toBeUndefined()
  })
})

describe('uploadSchema — synchronization', () => {
  test('claim returns complete → commits without a synchronize call, returns descriptorId', async () => {
    const {requester, calls} = recording((opts) => {
      if (opts.url.endsWith('/claim')) return {synchronization: {type: 'complete'}, commitId: 'c1'}
      if (opts.url.endsWith('/commit')) return {}
      throw new Error(`unexpected call to ${opts.url}`)
    })
    const id = await uploadSchema(makeSchema(), {contextKey: 'studio:1', requester})
    expect(typeof id).toBe('string')
    expect(id.length).toBeGreaterThan(0)
    expect(calls.map((c) => c.url)).toEqual([
      '/v2025-06-01/descriptors/claim',
      '/v2025-06-01/descriptors/commit',
    ])
  })

  test('incomplete then complete → one synchronize round then commit, returns id', async () => {
    let descriptorId = ''
    const {requester, calls} = recording((opts) => {
      if (opts.url.endsWith('/claim')) {
        descriptorId = (opts.body as {descriptorId: string}).descriptorId
        return {synchronization: {type: 'incomplete', missingIds: [descriptorId]}, commitId: 'c1'}
      }
      if (opts.url.endsWith('/synchronize')) return {type: 'complete'}
      if (opts.url.endsWith('/commit')) return {}
      throw new Error(`unexpected call to ${opts.url}`)
    })
    const id = await uploadSchema(makeSchema(), {contextKey: 'studio:1', requester})
    expect(id).toBe(descriptorId)
    expect(calls.map((c) => c.url)).toEqual([
      '/v2025-06-01/descriptors/claim',
      '/v2025-06-01/descriptors/synchronize',
      '/v2025-06-01/descriptors/commit',
    ])
  })

  test('claim POSTs a permanent claim, then commits with the returned commitId', async () => {
    const {requester, calls} = recording((opts) => {
      if (opts.url.endsWith('/claim')) return {synchronization: {type: 'complete'}, commitId: 'c1'}
      if (opts.url.endsWith('/commit')) return {}
      throw new Error(`unexpected call to ${opts.url}`)
    })
    await uploadSchema(makeSchema(), {contextKey: 'studio:1', requester})

    const claimBody = calls[0]!.body as {contextKey: string; permanent: boolean}
    expect(claimBody.contextKey).toBe('studio:1')
    expect(claimBody.permanent).toBe(true)

    const commitCall = calls.find((c) => c.url.endsWith('/commit'))!
    expect(commitCall.body).toEqual({contextKey: 'studio:1', id: 'c1'})
  })

  test('throws when the permanent claim response is missing commitId', async () => {
    const {requester} = recording((opts) => {
      if (opts.url.endsWith('/claim')) return {synchronization: {type: 'complete'}}
      throw new Error(`unexpected call to ${opts.url}`)
    })
    await expect(uploadSchema(makeSchema(), {contextKey: 'studio:1', requester})).rejects.toThrow(
      /missing `commitId`/,
    )
  })

  test('claim already complete returns the id even with maxSyncIterations 0', async () => {
    const {requester, calls} = recording((opts) => {
      if (opts.url.endsWith('/claim')) return {synchronization: {type: 'complete'}, commitId: 'c1'}
      if (opts.url.endsWith('/commit')) return {}
      throw new Error(`unexpected call to ${opts.url}`)
    })
    const id = await uploadSchema(makeSchema(), {
      contextKey: 'studio:1',
      requester,
      maxSyncIterations: 0,
    })
    expect(typeof id).toBe('string')
    expect(calls.map((c) => c.url)).toEqual([
      '/v2025-06-01/descriptors/claim',
      '/v2025-06-01/descriptors/commit',
    ])
  })

  test('throws on a negative or non-integer maxSyncIterations', async () => {
    const {requester} = recording((opts) => {
      if (opts.url.endsWith('/claim')) return {synchronization: {type: 'complete'}, commitId: 'c1'}
      if (opts.url.endsWith('/commit')) return {}
      throw new Error(`unexpected call to ${opts.url}`)
    })
    await expect(
      uploadSchema(makeSchema(), {contextKey: 'studio:1', requester, maxSyncIterations: -1}),
    ).rejects.toThrow(/non-negative integer/)
    await expect(
      uploadSchema(makeSchema(), {contextKey: 'studio:1', requester, maxSyncIterations: 2.5}),
    ).rejects.toThrow(/non-negative integer/)
  })

  test('never completes → throws and does not commit', async () => {
    const {requester, calls} = recording((opts) => {
      if (opts.url.endsWith('/claim')) {
        const did = (opts.body as {descriptorId: string}).descriptorId
        return {synchronization: {type: 'incomplete', missingIds: [did]}, commitId: 'c1'}
      }
      if (opts.url.endsWith('/commit')) return {}
      const did = (opts.body as {id: string}).id
      return {type: 'incomplete', missingIds: [did]}
    })
    await expect(
      uploadSchema(makeSchema(), {contextKey: 'studio:1', requester, maxSyncIterations: 2}),
    ).rejects.toThrow(/didn't succeed in 2 iterations/)
    expect(calls.some((c) => c.url.endsWith('/commit'))).toBe(false)
  })
})

describe('uploadSchema — onPhaseComplete', () => {
  test('claim already complete → emits convert, claim, commit, total in order (no synchronize)', async () => {
    const {requester} = recording((opts) => {
      if (opts.url.endsWith('/claim')) return {synchronization: {type: 'complete'}, commitId: 'c1'}
      if (opts.url.endsWith('/commit')) return {}
      throw new Error(`unexpected call to ${opts.url}`)
    })
    const events: UploadSchemaPhase[] = []
    await uploadSchema(makeSchema(), {
      contextKey: 'studio:1',
      requester,
      onPhaseComplete: (event) => events.push(event),
    })
    expect(events.map((e) => e.phase)).toEqual(['convert', 'claim', 'commit', 'total'])
  })

  test('incomplete then complete → one synchronize phase (iteration 0) before commit and total', async () => {
    const {requester} = recording((opts) => {
      if (opts.url.endsWith('/claim')) {
        const did = (opts.body as {descriptorId: string}).descriptorId
        return {synchronization: {type: 'incomplete', missingIds: [did]}, commitId: 'c1'}
      }
      if (opts.url.endsWith('/synchronize')) return {type: 'complete'}
      if (opts.url.endsWith('/commit')) return {}
      throw new Error(`unexpected call to ${opts.url}`)
    })
    const events: UploadSchemaPhase[] = []
    await uploadSchema(makeSchema(), {
      contextKey: 'studio:1',
      requester,
      onPhaseComplete: (event) => events.push(event),
    })
    expect(events.map((e) => e.phase)).toEqual([
      'convert',
      'claim',
      'synchronize',
      'commit',
      'total',
    ])
    const synchronize = events.find((e) => e.phase === 'synchronize')!
    expect(synchronize.iteration).toBe(0)
  })

  test('iteration is present only on synchronize phases and is zero-based', async () => {
    let round = 0
    const {requester} = recording((opts) => {
      if (opts.url.endsWith('/claim')) {
        const did = (opts.body as {descriptorId: string}).descriptorId
        return {synchronization: {type: 'incomplete', missingIds: [did]}, commitId: 'c1'}
      }
      if (opts.url.endsWith('/synchronize')) {
        round += 1
        // Stay incomplete for the first round (echo the requested id so the sync
        // protocol keeps asking), then complete on the second.
        if (round >= 2) return {type: 'complete'}
        const did = (opts.body as {id: string}).id
        return {type: 'incomplete', missingIds: [did]}
      }
      if (opts.url.endsWith('/commit')) return {}
      throw new Error(`unexpected call to ${opts.url}`)
    })
    const events: UploadSchemaPhase[] = []
    await uploadSchema(makeSchema(), {
      contextKey: 'studio:1',
      requester,
      onPhaseComplete: (event) => events.push(event),
    })
    const syncIterations = events.filter((e) => e.phase === 'synchronize').map((e) => e.iteration)
    expect(syncIterations).toEqual([0, 1])
    for (const event of events) {
      if (event.phase !== 'synchronize') expect(event.iteration).toBeUndefined()
    }
  })

  test('every emitted durationSeconds is a finite number >= 0', async () => {
    const {requester} = recording((opts) => {
      if (opts.url.endsWith('/claim')) return {synchronization: {type: 'complete'}, commitId: 'c1'}
      if (opts.url.endsWith('/commit')) return {}
      throw new Error(`unexpected call to ${opts.url}`)
    })
    const events: UploadSchemaPhase[] = []
    await uploadSchema(makeSchema(), {
      contextKey: 'studio:1',
      requester,
      onPhaseComplete: (event) => events.push(event),
    })
    expect(events.length).toBeGreaterThan(0)
    for (const event of events) {
      expect(Number.isFinite(event.durationSeconds)).toBe(true)
      expect(event.durationSeconds).toBeGreaterThanOrEqual(0)
    }
  })

  test('a hook that throws is swallowed; the upload still resolves the descriptorId', async () => {
    const {requester} = recording((opts) => {
      if (opts.url.endsWith('/claim')) return {synchronization: {type: 'complete'}, commitId: 'c1'}
      if (opts.url.endsWith('/commit')) return {}
      throw new Error(`unexpected call to ${opts.url}`)
    })
    const id = await uploadSchema(makeSchema(), {
      contextKey: 'studio:1',
      requester,
      onPhaseComplete: () => {
        throw new Error('boom')
      },
    })
    expect(typeof id).toBe('string')
    expect(id.length).toBeGreaterThan(0)
  })

  test('failure path → emits convert, claim, synchronize but neither commit nor total', async () => {
    const {requester} = recording((opts) => {
      if (opts.url.endsWith('/claim')) {
        const did = (opts.body as {descriptorId: string}).descriptorId
        return {synchronization: {type: 'incomplete', missingIds: [did]}, commitId: 'c1'}
      }
      if (opts.url.endsWith('/commit')) return {}
      const did = (opts.body as {id: string}).id
      return {type: 'incomplete', missingIds: [did]}
    })
    const events: UploadSchemaPhase[] = []
    await expect(
      uploadSchema(makeSchema(), {
        contextKey: 'studio:1',
        requester,
        maxSyncIterations: 2,
        onPhaseComplete: (event) => events.push(event),
      }),
    ).rejects.toThrow(/didn't succeed in 2 iterations/)
    const phases = events.map((e) => e.phase)
    expect(phases).toContain('convert')
    expect(phases).toContain('claim')
    expect(phases).toContain('synchronize')
    expect(phases).not.toContain('commit')
    expect(phases).not.toContain('total')
  })
})
