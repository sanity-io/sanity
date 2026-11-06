import {SanityClient} from '@sanity/client'
import {Schema} from '@sanity/schema'
import {builtinTypes} from '@sanity/schema/_internal'
import {type SanityDocument} from '@sanity/types'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {validateDocument, validateDocuments, validationMarkerCodes} from '../src'
import {inferFromSchema} from '../src/_internal'

function createSchema(compiled: boolean) {
  const parent = Schema.compile({name: 'builtin', types: builtinTypes})
  if (compiled) inferFromSchema(parent)
  const schema = Schema.compile({
    name: 'test',
    parent,
    types: [
      {name: 'knowledgePage', type: 'document', fields: []},
      {name: 'pageReference', type: 'reference', to: [{type: 'knowledgePage'}]},
      {name: 'weakPageReference', type: 'reference', to: [{type: 'knowledgePage'}], weak: true},
      {
        name: 'designEntity',
        type: 'document',
        fields: [
          {name: 'owningPageRef', type: 'pageReference'},
          {name: 'weakPageRef', type: 'weakPageReference'},
          {
            name: 'related',
            type: 'reference',
            to: [{type: 'knowledgePage'}, {type: 'designEntity'}],
          },
          {name: 'pages', type: 'array', of: [{type: 'pageReference'}]},
        ],
      },
    ],
  })
  return compiled ? inferFromSchema(schema) : schema
}

function document(id: string, fields: Record<string, unknown> = {}): SanityDocument {
  return {_id: id, _type: 'designEntity', _rev: 'rev', _createdAt: '', _updatedAt: '', ...fields}
}

function reference(id: string) {
  return {_type: 'reference', _ref: id}
}

function createClient(
  targets: Record<string, string>,
  {restricted = [] as string[], unpublished = [] as string[]} = {},
) {
  const request = vi.fn(async (options: {url?: string; signal?: AbortSignal}) => {
    const url = new URL(options.url!, 'https://api.sanity.io')
    if (url.pathname.includes('/data/doc/')) {
      const ids = decodeURIComponent(url.pathname.split('/').at(-1)!).split(',')
      return {
        omitted: ids.flatMap((id) => {
          if (restricted.includes(id)) return [{id, reason: 'permission'}]
          return id in targets ? [] : [{id, reason: 'existence'}]
        }),
      }
    }
    const ids: string[] | null = JSON.parse(url.searchParams.get('$ids') ?? 'null')
    if (ids) {
      return {
        result: ids.flatMap((id) =>
          id in targets && !restricted.includes(id) ? [{_id: id, _type: targets[id]}] : [],
        ),
      }
    }
    return {result: unpublished.includes(JSON.parse(url.searchParams.get('$id')!))}
  })
  const client = new SanityClient(request, {
    projectId: 'project',
    dataset: 'production',
    apiVersion: '2025-02-19',
    useCdn: false,
  })
  return {client, request}
}

afterEach(() => vi.useRealTimers())

describe.each([false, true])('reference types with compiled schema=%s', (compiled) => {
  const schema = createSchema(compiled)

  it('rejects an existing asset where a page is required by an inherited reference', async () => {
    const {client} = createClient({image: 'sanity.imageAsset'})
    const result = await validateDocument({
      client,
      schema,
      document: document('entity', {owningPageRef: reference('image')}),
    })
    expect(result.complete).toBe(true)
    expect(result.markers).toEqual([
      expect.objectContaining({
        code: validationMarkerCodes.referenceTargetTypeMismatch,
        level: 'error',
        path: ['owningPageRef'],
        details: {
          referenceId: 'image',
          actualType: 'sanity.imageAsset',
          allowedTypes: ['knowledgePage'],
        },
      }),
    ])
  })

  it('accepts every declared target type and validates references inside arrays', async () => {
    const {client} = createClient({
      page: 'knowledgePage',
      other: 'designEntity',
      image: 'sanity.imageAsset',
    })
    const results = await validateDocuments({
      client,
      schema,
      documents: [
        document('one', {owningPageRef: reference('page'), related: reference('other')}),
        document('two', {
          related: reference('page'),
          pages: [{...reference('image'), _type: 'pageReference', _key: 'a'}],
        }),
      ],
    })
    expect(results[0]).toMatchObject({complete: true, markers: []})
    expect(results[1].markers).toEqual([
      expect.objectContaining({
        code: validationMarkerCodes.referenceTargetTypeMismatch,
        path: ['pages', {_key: 'a'}],
      }),
    ])
  })

  it('checks existing weak targets while allowing missing weak targets', async () => {
    const {client} = createClient({image: 'sanity.imageAsset'})
    const results = await validateDocuments({
      client,
      schema,
      documents: [
        document('one', {weakPageRef: reference('image')}),
        document('two', {weakPageRef: reference('missing')}),
      ],
    })
    expect(results[0].markers).toEqual([
      expect.objectContaining({code: validationMarkerCodes.referenceTargetTypeMismatch}),
    ])
    expect(results[1]).toMatchObject({complete: true, markers: []})
  })

  it('checks self-references locally without requiring the document to be published', async () => {
    const {client, request} = createClient({})
    const result = await validateDocument({
      client,
      schema,
      document: document('drafts.self', {
        owningPageRef: reference('self'),
        related: reference('self'),
      }),
    })
    expect(result.markers).toEqual([
      expect.objectContaining({
        code: validationMarkerCodes.referenceTargetTypeMismatch,
        path: ['owningPageRef'],
      }),
    ])
    expect(result.complete).toBe(true)
    expect(request).not.toHaveBeenCalled()
  })

  it('can disable type lookups while retaining strong reference existence checks', async () => {
    const {client, request} = createClient({image: 'sanity.imageAsset'})
    const results = await validateDocuments({
      client,
      schema,
      validateReferenceTypes: false,
      documents: [
        document('one', {owningPageRef: reference('image'), weakPageRef: reference('missing')}),
        document('two', {owningPageRef: reference('missing')}),
      ],
    })
    expect(results[0]).toMatchObject({complete: true, markers: []})
    expect(results[1].markers).toEqual([
      expect.objectContaining({code: validationMarkerCodes.referenceNotPublished}),
    ])
    expect(request).toHaveBeenCalledOnce()
    expect(request.mock.calls[0][0].url).toContain('/data/doc/')
  })

  it.each(['owningPageRef', 'weakPageRef'])(
    'reports unreadable %s types as incomplete rather than a type mismatch',
    async (field) => {
      const {client} = createClient({private: 'knowledgePage'}, {restricted: ['private']})
      const result = await validateDocument({
        client,
        schema,
        document: document('entity', {[field]: reference('private')}),
      })
      expect(result).toMatchObject({
        complete: false,
        markers: [expect.objectContaining({code: validationMarkerCodes.validationException})],
      })
    },
  )

  it('requires a client for type lookups even when existence is supplied', async () => {
    const options = {
      schema,
      document: document('entity', {owningPageRef: reference('page')}),
      getDocumentExists: async () => true,
    }
    await expect(validateDocument(options)).resolves.toMatchObject({complete: false, markers: []})
    await expect(
      validateDocument({...options, validateReferenceTypes: false}),
    ).resolves.toMatchObject({complete: true, markers: []})
  })

  it('checks the same release target chosen by the existence check', async () => {
    const {client} = createClient({
      'page': 'knowledgePage',
      'versions.release.page': 'designEntity',
    })
    const results = await validateDocuments({
      client,
      schema,
      documents: [
        document('drafts.entity', {owningPageRef: reference('page')}),
        document('versions.release.entity', {owningPageRef: reference('page')}),
        document('versions.release.variant', {
          owningPageRef: reference('page'),
          _system: {variants: [{_ref: '_.variants.a', _key: 'a'}]},
        }),
      ],
    })
    expect(results[0]).toMatchObject({complete: true, markers: []})
    expect(results[1]).toMatchObject({
      complete: true,
      markers: [
        expect.objectContaining({details: expect.objectContaining({actualType: 'designEntity'})}),
      ],
    })
    expect(results[2]).toMatchObject({complete: true, markers: []})
  })

  it('checks unpublished targets in the same release and rejects release unpublish markers', async () => {
    const {client} = createClient(
      {
        'versions.release.page': 'knowledgePage',
        'removed': 'knowledgePage',
        'versions.release.removed': 'knowledgePage',
      },
      {unpublished: ['versions.release.removed']},
    )
    const results = await validateDocuments({
      client,
      schema,
      documents: [
        document('versions.release.one', {owningPageRef: reference('page')}),
        document('versions.release.two', {owningPageRef: reference('removed')}),
      ],
    })
    expect(results[0]).toMatchObject({complete: true, markers: []})
    expect(results[1]).toMatchObject({
      complete: true,
      markers: [expect.objectContaining({code: validationMarkerCodes.referenceNotPublished})],
    })
  })
})

it('marks every affected document incomplete when a batched type read fails', async () => {
  vi.useFakeTimers()
  const {client, request} = createClient({page: 'knowledgePage'})
  const original = request.getMockImplementation()!
  request.mockImplementation(async (options) => {
    if (options.url?.includes('/data/query/')) throw new Error('Type lookup failed')
    return original(options)
  })
  const validation = validateDocuments({
    client,
    schema: createSchema(true),
    documents: [
      document('one', {owningPageRef: reference('page')}),
      document('two', {owningPageRef: reference('page')}),
    ],
  })
  await vi.runAllTimersAsync()
  for (const result of await validation) {
    expect(result).toMatchObject({
      complete: false,
      markers: [expect.objectContaining({code: validationMarkerCodes.validationException})],
    })
  }
  expect(request).toHaveBeenCalledTimes(2)
})

it('cancels active type lookups with the validation signal', async () => {
  vi.useFakeTimers()
  const {client, request} = createClient({page: 'knowledgePage'})
  const original = request.getMockImplementation()!
  let typeSignal: AbortSignal | undefined
  request.mockImplementation((options) => {
    if (!options.url?.includes('/data/query/')) return original(options)
    typeSignal = options.signal
    return new Promise((_resolve, reject) => {
      options.signal?.addEventListener('abort', () => reject(options.signal?.reason), {once: true})
    })
  })
  const controller = new AbortController()
  const reason = new Error('cancelled')
  const validation = validateDocument({
    client,
    schema: createSchema(true),
    signal: controller.signal,
    document: document('entity', {owningPageRef: reference('page')}),
  })
  const rejected = expect(validation).rejects.toBe(reason)
  await vi.runAllTimersAsync()
  expect(typeSignal).toBeDefined()
  controller.abort(reason)
  await rejected
  expect(typeSignal?.aborted).toBe(true)
})

it('batches type reads across documents and deduplicates shared targets', async () => {
  vi.useFakeTimers()
  const {client, request} = createClient(
    Object.fromEntries(Array.from({length: 205}, (_, i) => [`page-${i}`, 'knowledgePage'])),
  )
  const results = validateDocuments({
    client,
    schema: createSchema(true),
    documents: Array.from({length: 206}, (_, i) =>
      document(`entity-${i}`, {owningPageRef: reference(`page-${i % 205}`)}),
    ),
  })
  await vi.runAllTimersAsync()
  expect((await results).every(({complete, markers}) => complete && markers.length === 0)).toBe(
    true,
  )
  const typeRequests = request.mock.calls.filter(([{url}]) => url?.includes('/data/query/'))
  const ids = typeRequests.flatMap(([{url}]) => JSON.parse(new URL(url!).searchParams.get('$ids')!))
  expect(typeRequests).toHaveLength(3)
  expect(ids).toHaveLength(205)
  expect(new Set(ids).size).toBe(205)
})

it('honors a custom existence checker while looking up readable target types', async () => {
  vi.useFakeTimers()
  const {client, request} = createClient({page: 'knowledgePage', image: 'sanity.imageAsset'})
  const validation = validateDocuments({
    client,
    schema: createSchema(true),
    getDocumentExists: async ({id}) => id === 'page',
    documents: [
      document('one', {owningPageRef: reference('page')}),
      document('two', {owningPageRef: reference('image')}),
    ],
  })
  await vi.runAllTimersAsync()
  const results = await validation
  expect(results[0]).toMatchObject({complete: true, markers: []})
  expect(results[1].markers).toEqual([
    expect.objectContaining({code: validationMarkerCodes.referenceNotPublished}),
  ])
  expect(request).toHaveBeenCalledOnce()
  expect(request.mock.calls[0][0].url).toContain('/data/query/')
})

it('reads target types again on the next validation call', async () => {
  vi.useFakeTimers()
  const targets = {page: 'knowledgePage'}
  const {client} = createClient(targets)
  const options = {
    client,
    schema: createSchema(true),
    document: document('entity', {owningPageRef: reference('page')}),
  }
  const first = validateDocument(options)
  await vi.runAllTimersAsync()
  expect(await first).toMatchObject({complete: true, markers: []})
  targets.page = 'sanity.imageAsset'
  const second = validateDocument(options)
  await vi.runAllTimersAsync()
  expect((await second).markers).toEqual([
    expect.objectContaining({code: validationMarkerCodes.referenceTargetTypeMismatch}),
  ])
})
