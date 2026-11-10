import {type PromptRequest} from '@sanity/client'
import {describe, expect, it, vi} from 'vitest'

import {
  type GenerateMutationsClient,
  generateMutations,
  GenerateMutationsError,
} from './generateMutations'
import {MAX_GENERATE_ATTEMPTS} from './generateQuery'
import {type MutationBody} from './mutations'

const RESULT = [
  {_id: 'a', _originalId: 'drafts.a', _type: 'post', title: 'Old'},
  {_id: 'b', _type: 'post', title: 'Older'},
]
const CURRENT: Record<string, Record<string, unknown>> = {
  'drafts.a': {_id: 'drafts.a', _type: 'post', _rev: 'r1', title: 'Old'},
  'b': {_id: 'b', _type: 'post', _rev: 'r2', title: 'Older'},
}

/** A rejected mutation request as `@sanity/client` reports it: the API's error on `details` */
function mutationError(description: string, items: {index: number; description: string}[] = []) {
  return Object.assign(new Error(description), {
    details: {
      type: 'mutationError',
      description,
      items: items.map((item) => ({index: item.index, error: {description: item.description}})),
    },
  })
}

function createClient(options: {
  replies: unknown[]
  /** The error a dry run of the mutations fails with, if any */
  reject?: (mutations: MutationBody[]) => Error | undefined
}) {
  const prompts: PromptRequest[] = []
  const dryRuns: {mutations: MutationBody[]; query: Record<string, string>}[] = []
  const apiVersions: string[] = []
  const client: GenerateMutationsClient = {
    withConfig: ({apiVersion}) => {
      apiVersions.push(apiVersion)
      return {
        agent: {
          action: {
            prompt: async (request) => {
              prompts.push(request)
              return options.replies.shift()
            },
          },
        },
      }
    },
    getDataUrl: (operation) => `/data/${operation}/test`,
    request: async ({body, query}) => {
      dryRuns.push({mutations: body.mutations, query})
      const rejection = options.reject?.(body.mutations)
      if (rejection) throw rejection
      return {
        results: body.mutations.flatMap((mutation) => {
          const patch = mutation.patch as {id: string; set: Record<string, unknown>} | undefined
          return patch
            ? [{id: patch.id, operation: 'update', document: {...CURRENT[patch.id], ...patch.set}}]
            : []
        }),
      }
    },
    getDocuments: async (ids) => ids.map((id) => CURRENT[id] ?? null),
  }
  return {client, prompts, dryRuns, apiVersions}
}

const request = 'Change the title of the documents I am looking at to foobar'
const schema = '- post: title: string'
const mutationOptions = {autoGenerateArrayKeys: true}
const PATCHES = [
  {patch: {id: 'drafts.a', set: {title: 'foobar'}}},
  {patch: {id: 'b', set: {title: 'foobar'}}},
]

describe('generateMutations', () => {
  it('prompts on the experimental API with the result, and dry-runs the mutations', async () => {
    const {client, prompts, dryRuns, apiVersions} = createClient({replies: [{mutations: PATCHES}]})
    const onAttempt = vi.fn()

    const generated = await generateMutations({
      request,
      result: RESULT,
      schema,
      client,
      mutationOptions,
      onAttempt,
    })
    expect(generated.mutations).toEqual(PATCHES)
    expect(generated.preview.changes.map(({id, operation}) => ({id, operation}))).toEqual([
      {id: 'drafts.a', operation: 'update'},
      {id: 'b', operation: 'update'},
    ])
    expect(apiVersions).toEqual(['vX'])
    expect(onAttempt.mock.calls).toEqual([[1]])
    expect(prompts).toHaveLength(1)
    expect(prompts[0]).toMatchObject({format: 'json', instructionParams: {request, schema}})
    // Everything the user or the dataset wrote goes in as a template param, so a $ is no param
    expect(prompts[0].instruction).toContain('$request')
    expect(prompts[0].instruction).toContain('$result')
    // A draft is listed under the ID it is stored under
    expect(prompts[0].instructionParams?.documents).toBe('- drafts.a (post)\n- b (post)')
    expect(prompts[0].instructionParams?.result).toBe(JSON.stringify(RESULT))
    expect(dryRuns).toEqual([
      {
        mutations: PATCHES,
        query: expect.objectContaining({dryRun: 'true', autoGenerateArrayKeys: 'true'}),
      },
    ])
  })

  it('retries with what the dry run turned down, mutation by mutation', async () => {
    const {client, prompts} = createClient({
      replies: [
        {mutations: [{patch: {id: ['drafts.a', 'b'], set: {title: 'foobar'}}}]},
        {mutations: PATCHES},
      ],
      reject: (mutations) =>
        mutations.length === 1
          ? mutationError('unexpected value of type "array"', [
              {index: 0, description: 'The id must be a string'},
            ])
          : undefined,
    })
    const onAttempt = vi.fn()

    const generated = await generateMutations({
      request,
      result: RESULT,
      schema,
      client,
      mutationOptions,
      onAttempt,
    })
    expect(generated.mutations).toEqual(PATCHES)
    expect(onAttempt.mock.calls).toEqual([[1], [2]])
    expect(prompts[1].instruction).toContain('$previous')
    const previous = String(prompts[1].instructionParams?.previous)
    expect(previous).toContain('"id":["drafts.a","b"]')
    expect(previous).toContain(
      'Error: unexpected value of type "array"\nMutation 1: The id must be a string',
    )
  })

  it('asks again for a reply that is no list of mutations', async () => {
    const {client, prompts} = createClient({
      replies: [{mutations: [{upsert: {}}]}, 'Sorry', {mutations: PATCHES}],
    })

    expect(
      (await generateMutations({request, result: RESULT, schema, client, mutationOptions}))
        .mutations,
    ).toEqual(PATCHES)
    expect(String(prompts[1].instructionParams?.previous)).toContain(
      'Mutation 1 needs exactly one of create, createOrReplace, createIfNotExists, delete or patch',
    )
    expect(String(prompts[2].instructionParams?.previous)).toContain(
      'The reply had no list of mutations',
    )
  })

  it('gives up after the last attempt, keeping the last one the dry run turned down', async () => {
    const deleted = [{delete: {id: 'b'}}]
    const {client, prompts} = createClient({
      replies: [
        ...Array.from({length: MAX_GENERATE_ATTEMPTS - 1}, () => ({mutations: deleted})),
        {nothing: true},
      ],
      reject: () => mutationError('Document "b" cannot be deleted as there are references to it'),
    })

    const error = await generateMutations({
      request: 'Delete them',
      result: RESULT,
      schema,
      client,
      mutationOptions,
    }).catch((reason: unknown) => reason)
    expect(error).toBeInstanceOf(GenerateMutationsError)
    expect(error).toMatchObject({
      message: expect.stringContaining('Mutation 1 needs exactly one of'),
      lastAttempt: deleted,
    })
    expect(prompts).toHaveLength(MAX_GENERATE_ATTEMPTS)
  })

  it('cuts a long result short, and says when the result holds no documents', async () => {
    const {client, prompts} = createClient({replies: [{mutations: PATCHES}]})
    const long = Array.from({length: 2000}, (_, index) => ({title: `Title ${index}`}))

    await generateMutations({request, result: long, schema, client, mutationOptions})
    const result = String(prompts[0].instructionParams?.result)
    expect(result.length).toBeLessThan(12_100)
    expect(result).toMatch(/… \(cut short\)$/)
    expect(prompts[0].instructionParams?.documents).toBe('(none: the result holds no documents)')
  })

  it('rejects right away when the prompt itself fails', async () => {
    const {client} = createClient({replies: []})
    client.withConfig = () => ({
      agent: {
        action: {
          prompt: () => Promise.reject(new Error('Agent Actions are not enabled for this project')),
        },
      },
    })
    await expect(
      generateMutations({request, result: RESULT, schema, client, mutationOptions}),
    ).rejects.toThrow('Agent Actions are not enabled for this project')
  })

  it('stops when aborted during a dry run', async () => {
    const controller = new AbortController()
    const {client, prompts} = createClient({
      replies: [{mutations: PATCHES}, {mutations: PATCHES}],
      reject: () => {
        controller.abort()
        return mutationError('Mutation failed')
      },
    })

    await expect(
      generateMutations({
        request,
        result: RESULT,
        schema,
        client,
        mutationOptions,
        signal: controller.signal,
      }),
    ).rejects.toMatchObject({name: 'AbortError'})
    expect(prompts).toHaveLength(1)
  })
})
