import {SanityClient} from '@sanity/client'
import {Schema as SchemaBuilder} from '@sanity/schema'
import {builtinTypes} from '@sanity/schema/_internal'
import {type FieldDefinition, type SanityDocument} from '@sanity/types'
import {firstValueFrom, Subject} from 'rxjs'
import {describe, expect, it, vi} from 'vitest'

import {validateDocuments, validationMarkerCodes} from '../src'
import {inferFromSchema} from '../src/_internal'

const builtinSchema = inferFromSchema(SchemaBuilder.compile({name: 'studio', types: builtinTypes}))

function createSchema(fields: FieldDefinition[] = []) {
  return inferFromSchema(
    SchemaBuilder.compile({
      name: 'test',
      parent: builtinSchema,
      types: [{name: 'article', type: 'document', fields}],
    }),
  )
}

function document(id: string, content: Record<string, unknown>): SanityDocument {
  return {
    _id: id,
    _type: 'article',
    _rev: 'rev',
    _createdAt: '2026-01-01T00:00:00Z',
    _updatedAt: '2026-01-01T00:00:00Z',
    ...content,
  }
}

function createClient(omitted: Array<{id: string; reason: 'existence' | 'permission'}> = []) {
  const request = vi
    .fn<(options: {url?: string; signal?: AbortSignal}) => Promise<unknown>>()
    .mockResolvedValue({omitted})
  const client = new SanityClient(request, {
    projectId: 'project',
    dataset: 'production',
    apiVersion: '2025-02-19',
    useCdn: false,
  })
  vi.spyOn(client, 'withConfig')
  return {client, request}
}

const referenceFields = [{name: 'author', type: 'reference', to: [{type: 'article'}]}]

describe('validateDocuments', () => {
  it('shares reference requests across documents and preserves input order and permission omissions', async () => {
    const {client, request} = createClient([
      {id: 'missing', reason: 'existence'},
      {id: 'restricted', reason: 'permission'},
    ])
    const results = await validateDocuments({
      client,
      schema: createSchema(referenceFields),
      documents: ['shared', 'missing', 'shared', 'restricted'].map((ref, index) =>
        document(`drafts.article-${index}`, {author: {_type: 'reference', _ref: ref}}),
      ),
    })

    expect(request).toHaveBeenCalledOnce()
    expect(request.mock.calls[0][0]).toMatchObject({
      url: expect.stringContaining('/data/doc/production/shared,missing,restricted'),
    })
    expect(results.map(({status}) => status)).toEqual(['passed', 'failed', 'passed', 'passed'])
    expect(results[1].markers).toEqual([
      expect.objectContaining({
        code: validationMarkerCodes.referenceNotPublished,
        path: ['author'],
        details: {referenceId: 'missing'},
      }),
    ])
  })

  it('splits reference requests at 100 IDs and allows only one request in flight', async () => {
    const refs = Array.from({length: 205}, (_, index) => `author-${index}`)
    const firstResponse = new Subject<{omitted: []}>()
    const {client, request} = createClient()
    request.mockReturnValueOnce(firstValueFrom(firstResponse))
    const validation = validateDocuments({
      client,
      schema: createSchema(referenceFields),
      documents: refs.map((ref, index) =>
        document(`drafts.article-${index}`, {author: {_type: 'reference', _ref: ref}}),
      ),
    })

    await vi.waitFor(() => expect(request).toHaveBeenCalledOnce())
    firstResponse.next({omitted: []})
    firstResponse.complete()
    const results = await validation

    expect(results.every(({status}) => status === 'passed')).toBe(true)
    expect(request.mock.calls.map(([options]) => new URL(options.url || '').pathname)).toEqual([
      `/v2025-02-19/data/doc/production/${refs.slice(0, 100).join(',')}`,
      `/v2025-02-19/data/doc/production/${refs.slice(100, 200).join(',')}`,
      `/v2025-02-19/data/doc/production/${refs.slice(200).join(',')}`,
    ])
  })

  it('shares the fetch limit across documents and reconfigured clients', async () => {
    let active = 0
    let peak = 0
    const {client, request: fetch} = createClient()
    fetch.mockImplementation(async () => {
      active++
      peak = Math.max(peak, active)
      await new Promise((resolve) => setTimeout(resolve, 0))
      active--
      return {result: true, ms: 0}
    })

    const results = await validateDocuments({
      client,
      schema: createSchema([{name: 'slug', type: 'slug'}]),
      maxFetchConcurrency: 2,
      documents: Array.from({length: 8}, (_, index) =>
        document(`drafts.article-${index}`, {slug: {_type: 'slug', current: `article-${index}`}}),
      ),
    })

    expect(fetch).toHaveBeenCalledTimes(8)
    expect(peak).toBe(2)
    expect(results.every(({status}) => status === 'passed')).toBe(true)
  })

  it('reports a failed reference request for every affected document', async () => {
    const {client, request} = createClient()
    request.mockRejectedValue(new Error('Unavailable'))
    const results = await validateDocuments({
      client,
      schema: createSchema(referenceFields),
      documents: [0, 1].map((index) =>
        document(`drafts.article-${index}`, {author: {_type: 'reference', _ref: 'shared'}}),
      ),
    })

    expect(request).toHaveBeenCalledOnce()
    for (const result of results) {
      expect(result.markers).toEqual([
        expect.objectContaining({
          code: validationMarkerCodes.validationException,
          path: ['author'],
        }),
      ])
    }
  })

  it('supports local validation without a client', async () => {
    const results = await validateDocuments({
      schema: createSchema([
        {name: 'title', type: 'string', validation: (rule) => rule.required()},
      ]),
      documents: [document('valid', {title: 'Hello'}), document('invalid', {})],
    })

    expect(results[0]).toEqual({status: 'passed', markers: []})
    expect(results[1]).toMatchObject({
      status: 'failed',
      markers: [
        expect.objectContaining({code: validationMarkerCodes.valueRequired, path: ['title']}),
      ],
    })
  })

  it('uses a supplied reference checker instead of requesting availability', async () => {
    const {client, request} = createClient()
    const getDocumentExists = vi.fn(async () => true)
    await validateDocuments({
      client,
      schema: createSchema(referenceFields),
      documents: [document('article', {author: {_type: 'reference', _ref: 'author'}})],
      getDocumentExists,
    })

    expect(getDocumentExists).toHaveBeenCalledWith({id: 'author', signal: undefined})
    expect(request).not.toHaveBeenCalled()
  })

  it('rejects pre-aborted batches without configuring the client', async () => {
    const {client} = createClient()
    const reason = new Error('cancelled')
    await expect(
      validateDocuments({
        client,
        documents: [document('article', {})],
        schema: createSchema(),
        signal: AbortSignal.abort(reason),
      }),
    ).rejects.toBe(reason)
    expect(client.withConfig).not.toHaveBeenCalled()
  })

  it('cancels active fetches and prevents queued fetches from starting', async () => {
    const {client, request: fetch} = createClient()
    const controller = new AbortController()
    const reason = new Error('cancelled')
    fetch.mockImplementation(
      (options) =>
        new Promise((_resolve, reject) => {
          options?.signal?.addEventListener('abort', () => reject(options.signal?.reason), {
            once: true,
          })
        }),
    )
    const validation = validateDocuments({
      client,
      schema: createSchema([{name: 'slug', type: 'slug'}]),
      maxFetchConcurrency: 1,
      signal: controller.signal,
      documents: [0, 1].map((index) =>
        document(`drafts.article-${index}`, {slug: {_type: 'slug', current: `article-${index}`}}),
      ),
    })

    await vi.waitFor(() => expect(fetch).toHaveBeenCalledOnce())
    controller.abort(reason)
    await expect(validation).rejects.toBe(reason)
    expect(fetch).toHaveBeenCalledOnce()
  })

  it('returns an empty result without configuring a client for an empty batch', async () => {
    const {client} = createClient()
    await expect(
      validateDocuments({client, schema: createSchema(), documents: []}),
    ).resolves.toEqual([])
    expect(client.withConfig).not.toHaveBeenCalled()
  })
})
