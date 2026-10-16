import {ClientError} from '@sanity/client'
import {describe, expect, it, vi} from 'vitest'

import {
  addMutation,
  applyMutations,
  createMutationTemplate,
  documentsInResult,
  type MutateClient,
  previewMutations,
  PREVIEW_LIMIT,
  readMutationFailure,
  readMutations,
} from './mutations'

function createClient(response: unknown, documents: Record<string, unknown>[] = []) {
  const request = vi.fn<MutateClient['request']>(() => Promise.resolve(response))
  const getDocuments = vi.fn<MutateClient['getDocuments']>((ids) =>
    Promise.resolve(ids.map((id) => documents.find((document) => document._id === id) ?? null)),
  )
  const client: MutateClient = {
    getDataUrl: (operation) => `/v2025-02-19/data/${operation}/test`,
    request,
    getDocuments,
  }
  return {client, request, getDocuments}
}

describe('readMutations', () => {
  it('reads a list, a request body and a single mutation', () => {
    const patch = {patch: {id: 'a', set: {title: 'New'}}}
    expect(readMutations(JSON.stringify([patch]))).toEqual({status: 'valid', mutations: [patch]})
    expect(readMutations(JSON.stringify({mutations: [patch]}))).toEqual({
      status: 'valid',
      mutations: [patch],
    })
    expect(readMutations(JSON.stringify(patch))).toEqual({status: 'valid', mutations: [patch]})
  })

  it('tells empty text and lists, invalid JSON, and what is no list of mutations apart', () => {
    expect(readMutations('  ')).toEqual({status: 'empty'})
    expect(readMutations('[]')).toEqual({status: 'empty'})
    expect(readMutations('[{"patch": ')).toMatchObject({status: 'invalid-json'})
    expect(readMutations('42')).toEqual({status: 'not-a-list'})
  })

  it('names the first mutation that has not exactly one thing to do, counting from 1', () => {
    expect(readMutations('[{"delete": {"id": "a"}}, {"frobnicate": {}}]')).toEqual({
      status: 'invalid-mutation',
      index: 2,
    })
    expect(readMutations('[{"create": {"_type": "a"}, "delete": {"id": "a"}}]')).toEqual({
      status: 'invalid-mutation',
      index: 1,
    })
    expect(readMutations('["create"]')).toEqual({status: 'invalid-mutation', index: 1})
  })
})

describe('documentsInResult', () => {
  it('lists the documents by the IDs they are stored under, once each', () => {
    expect(
      documentsInResult([
        {_id: 'a', _originalId: 'drafts.a', _type: 'post'},
        {_id: 'b', _type: 'author'},
        {_id: 'b', _type: 'author'},
        {title: 'No ID'},
        'text',
      ]),
    ).toEqual([
      {id: 'drafts.a', type: 'post'},
      {id: 'b', type: 'author'},
    ])
    expect(documentsInResult({_id: 'c', _type: 'post'})).toEqual([{id: 'c', type: 'post'}])
    expect(documentsInResult(3)).toEqual([])
  })
})

describe('mutation templates', () => {
  const documents = [
    {id: 'drafts.a', type: 'post'},
    {id: 'b', type: 'author'},
  ]

  it('aims at the documents of the result', () => {
    expect(createMutationTemplate('patch', documents)).toEqual({
      patch: {id: ['drafts.a', 'b'], set: {}},
    })
    expect(createMutationTemplate('patch', documents.slice(0, 1))).toEqual({
      patch: {id: 'drafts.a', set: {}},
    })
    expect(createMutationTemplate('delete', documents)).toEqual({delete: {id: ['drafts.a', 'b']}})
    expect(createMutationTemplate('create', documents)).toEqual({create: {_type: 'post'}})
  })

  it('leaves the ID and the type to fill in without documents', () => {
    expect(createMutationTemplate('patch', [])).toEqual({patch: {id: '', set: {}}})
    expect(createMutationTemplate('create', [])).toEqual({create: {_type: ''}})
  })

  it('adds a mutation to the list, or starts one, and leaves text that is no list alone', () => {
    const create = {create: {_type: 'post'}}
    expect(JSON.parse(addMutation('', create) ?? '')).toEqual([create])
    expect(JSON.parse(addMutation('{"delete": {"id": "a"}}', create) ?? '')).toEqual([
      {delete: {id: 'a'}},
      create,
    ])
    expect(addMutation('[{"delete": ', create)).toBeUndefined()
  })
})

describe('previewMutations', () => {
  const current = [
    {_id: 'a', _rev: 'r1', _type: 'post', _updatedAt: '2026-10-14T10:00:00Z', title: 'Old'},
    {_id: 'b', _rev: 'r1', _type: 'post', _updatedAt: '2026-10-14T10:00:00Z', title: 'Same'},
    {_id: 'c', _rev: 'r1', _type: 'post', title: 'Gone'},
  ]

  it('runs a dry run and compares each document with what the mutations make it', async () => {
    // The API answers per document, with the operation and the document the mutations leave
    const {client, request, getDocuments} = createClient(
      {
        transactionId: 'tx',
        results: [
          {id: 'a', operation: 'update', document: {...current[0], _rev: 'tx', title: 'New'}},
          {id: 'b', operation: 'update', document: {...current[1], _rev: 'tx'}},
          {id: 'c', operation: 'delete', document: current[2]},
          {id: 'd', operation: 'create', document: {_id: 'd', _rev: 'tx', _type: 'post'}},
        ],
      },
      current,
    )
    const mutations = [{patch: {query: '*[_type == "post"]', set: {title: 'New'}}}]
    const preview = await previewMutations(client, mutations, {autoGenerateArrayKeys: true})

    expect(request).toHaveBeenCalledWith({
      url: '/v2025-02-19/data/mutate/test',
      method: 'POST',
      body: {mutations},
      query: {
        returnIds: 'true',
        visibility: 'sync',
        dryRun: 'true',
        returnDocuments: 'true',
        autoGenerateArrayKeys: 'true',
      },
      tag: 'vista.mutate',
    })
    expect(getDocuments).toHaveBeenCalledWith(['a', 'b', 'c', 'd'], {tag: 'vista.mutate'})
    expect(preview.notShown).toBe(0)
    expect(preview.changes.map(({id, operation}) => [id, operation])).toEqual([
      ['a', 'update'],
      // Setting what is there gives the document a new revision, and nothing else
      ['b', 'none'],
      ['c', 'delete'],
      ['d', 'create'],
    ])
    expect(preview.changes[0]).toMatchObject({before: current[0], after: {title: 'New'}})
    expect(preview.changes[2]).toMatchObject({before: current[2], after: null})
    expect(preview.changes[3]).toMatchObject({before: null, after: {_id: 'd'}})
  })

  it('compares the first documents and counts the rest', async () => {
    const results = Array.from({length: PREVIEW_LIMIT + 2}, (_, index) => ({
      id: `doc-${index}`,
      operation: 'create',
      document: {_id: `doc-${index}`, _type: 'post'},
    }))
    const {client, getDocuments} = createClient({results})
    const preview = await previewMutations(client, [{create: {_type: 'post'}}], {
      autoGenerateArrayKeys: false,
    })
    expect(preview.changes).toHaveLength(PREVIEW_LIMIT)
    expect(preview.notShown).toBe(2)
    expect(getDocuments.mock.calls[0][0]).toHaveLength(PREVIEW_LIMIT)
  })

  it('asks for nothing more when the mutations touch no documents', async () => {
    const {client, request, getDocuments} = createClient({transactionId: 'tx', results: []})
    const preview = await previewMutations(client, [{delete: {id: 'missing'}}], {
      autoGenerateArrayKeys: false,
    })
    expect(preview).toEqual({changes: [], notShown: 0})
    expect(request.mock.calls[0][0].query).not.toHaveProperty('autoGenerateArrayKeys')
    expect(getDocuments).not.toHaveBeenCalled()
  })
})

describe('applyMutations', () => {
  it('commits the mutations, without a dry run or the documents', async () => {
    const {client, request} = createClient({
      transactionId: 'tx-1',
      results: [{id: 'a', operation: 'update'}],
    })
    const applied = await applyMutations(client, [{delete: {id: 'a'}}], {
      autoGenerateArrayKeys: false,
    })
    expect(applied).toEqual({transactionId: 'tx-1', documentIds: ['a']})
    expect(request.mock.calls[0][0].query).toEqual({returnIds: 'true', visibility: 'sync'})
  })
})

describe('readMutationFailure', () => {
  it('lists what the API says about each mutation', () => {
    const error = new ClientError({
      statusCode: 409,
      headers: {},
      body: {
        error: {
          type: 'mutationError',
          description: 'Mutation failed: Document by ID "a" already exists',
          items: [
            {
              index: 1,
              error: {type: 'documentAlreadyExistsError', description: 'Document "a" exists'},
            },
          ],
        },
      },
      url: 'https://test.api.sanity.io/v2025-02-19/data/mutate/test',
      method: 'POST',
    })
    expect(readMutationFailure(error)).toEqual({
      message: 'Mutation failed: Document by ID "a" already exists',
      items: [{index: 2, message: 'Document "a" exists'}],
    })
  })

  it('keeps the message of any other error', () => {
    expect(readMutationFailure(new Error('Network down'))).toEqual({
      message: 'Network down',
      items: [],
    })
  })
})
