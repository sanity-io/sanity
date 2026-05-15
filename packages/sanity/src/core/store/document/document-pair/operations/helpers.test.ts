import {type SanityClient} from '@sanity/client'
import {type SanityDocument} from '@sanity/types'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {createMockSanityClient} from '../../../../../../test/mocks/mockSanityClient'
import {createSchema} from '../../../../schema'
import {type IdPair} from '../../types'
import {emitOperation} from '../operationEvents'
import {createOperationsAPI, GUARDED} from './helpers'
import {type OperationArgs} from './types'

vi.mock('../operationEvents', () => ({
  emitOperation: vi.fn(),
}))

vi.mock('../getOperationStoreKey', () => ({
  getOperationStoreKey: vi.fn(() => 'store-key'),
}))

const emitOperationMock = vi.mocked(emitOperation)

const schema = createSchema({
  name: 'default',
  types: [
    {
      name: 'movie',
      title: 'Movie',
      type: 'document',
      fields: [{name: 'title', type: 'string'}],
    },
  ],
})

function createSnapshot(overrides: Partial<SanityDocument> = {}): SanityDocument {
  return {
    _createdAt: '2021-09-14T22:48:02.303Z',
    _id: 'drafts.example-id',
    _rev: 'exampleRev',
    _type: 'movie',
    _updatedAt: '2021-09-14T22:48:02.303Z',
    title: 'Alien',
    ...overrides,
  }
}

function createOperationArgs(overrides: Partial<OperationArgs> = {}): OperationArgs {
  const idPair: IdPair = {publishedId: 'example-id', draftId: 'drafts.example-id'}
  const client = createMockSanityClient() as unknown as SanityClient

  return {
    client,
    draft: {} as OperationArgs['draft'],
    historyStore: {} as OperationArgs['historyStore'],
    idPair,
    published: {} as OperationArgs['published'],
    schema,
    serverActionsEnabled: true,
    snapshots: {
      draft: createSnapshot(),
      published: createSnapshot({_id: 'example-id'}),
    },
    typeName: 'movie',
    ...overrides,
  }
}

describe('operations helpers', () => {
  beforeEach(() => {
    emitOperationMock.mockClear()
  })

  it('guards every operation before arguments are ready', () => {
    for (const [operationName, operation] of Object.entries(GUARDED)) {
      expect(operation.disabled).toBe('NOT_READY')
      expect(() => operation.execute()).toThrow(`Called ${operationName} before it was ready.`)
    }
  })

  it('emits operations when wrapped execute methods are called', () => {
    const api = createOperationsAPI(createOperationArgs())

    api.patch.execute([{set: {title: 'Alien'}}], {_id: 'drafts.example-id'})

    expect(emitOperationMock).toHaveBeenCalledWith(
      'patch',
      {publishedId: 'example-id', draftId: 'drafts.example-id'},
      'movie',
      [[{set: {title: 'Alien'}}], {_id: 'drafts.example-id'}],
      'store-key',
    )
  })

  it('keeps patch stable when only the current snapshot changes', () => {
    const args = createOperationArgs()
    const nextArgs = createOperationArgs({
      client: args.client,
      snapshots: {
        ...args.snapshots,
        draft: createSnapshot({title: 'Aliens'}),
      },
    })

    const api = createOperationsAPI(args)
    const nextApi = createOperationsAPI(nextArgs)

    expect(nextApi.patch).toBe(api.patch)
  })

  it('recreates operations when their disabled state changes', () => {
    const args = createOperationArgs()
    const nextArgs = createOperationArgs({
      client: args.client,
      snapshots: {
        draft: null,
        published: null,
      },
    })

    const api = createOperationsAPI(args)
    const nextApi = createOperationsAPI(nextArgs)

    expect(nextApi.delete).not.toBe(api.delete)
    expect(nextApi.delete.disabled).toBe('NOTHING_TO_DELETE')
  })
})
